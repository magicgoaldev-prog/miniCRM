create extension if not exists "pgcrypto";

create type public.app_role as enum ('assigner', 'executor');
create type public.task_status as enum (
  'new',
  'in_progress',
  'on_review',
  'rework',
  'accepted'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null check (length(trim(full_name)) > 0),
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  address text not null check (length(trim(address)) > 0),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects (id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  assignee_id uuid not null references public.profiles (id),
  status public.task_status not null default 'new',
  author_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  actor_id uuid not null references public.profiles (id),
  comment text,
  created_at timestamptz not null default now()
);

create index tasks_object_id_idx on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_status_idx on public.tasks (status);
create index task_status_history_task_id_created_at_idx
  on public.task_status_history (task_id, created_at);

create or replace function public.is_assigner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'assigner'
  );
$$;

create or replace function public.profile_role(p_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = p_user_id;
$$;

create or replace function public.enforce_task_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_assignee_role public.app_role;
begin
  if tg_op = 'INSERT' then
    if v_uid is null or not public.is_assigner() then
      raise exception 'FORBIDDEN_ROLE'
        using errcode = 'P0001';
    end if;

    if new.status is distinct from 'new' then
      raise exception 'TASK_TRANSITION_FORBIDDEN'
        using errcode = 'P0001';
    end if;

    if new.author_id is distinct from v_uid then
      raise exception 'FORBIDDEN_ROLE'
        using errcode = 'P0001';
    end if;

    v_assignee_role := public.profile_role(new.assignee_id);
    if v_assignee_role is distinct from 'executor' then
      raise exception 'ASSIGNEE_MUST_BE_EXECUTOR'
        using errcode = 'P0001';
    end if;

    new.title := trim(new.title);
    new.description := coalesce(new.description, '');
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if v_uid is null or not public.is_assigner() then
      if current_setting('app.allow_status_transition', true) is distinct from 'on' then
        raise exception 'FORBIDDEN_ROLE'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from old.status
       and current_setting('app.allow_status_transition', true) is distinct from 'on' then
      raise exception 'TASK_STATUS_IMMUTABLE_VIA_UPDATE'
        using errcode = 'P0001';
    end if;

    if new.assignee_id is distinct from old.assignee_id then
      if current_setting('app.allow_status_transition', true) = 'on' then
        raise exception 'TASK_FIELD_UPDATE_FORBIDDEN'
          using errcode = 'P0001';
      end if;

      if not public.is_assigner() then
        raise exception 'FORBIDDEN_ROLE'
          using errcode = 'P0001';
      end if;

      if old.status not in ('new', 'rework') then
        raise exception 'TASK_REASSIGN_NOT_ALLOWED'
          using errcode = 'P0001';
      end if;

      v_assignee_role := public.profile_role(new.assignee_id);
      if v_assignee_role is distinct from 'executor' then
        raise exception 'ASSIGNEE_MUST_BE_EXECUTOR'
          using errcode = 'P0001';
      end if;
    end if;

    if current_setting('app.allow_status_transition', true) is distinct from 'on' then
      if new.object_id is distinct from old.object_id
         or new.author_id is distinct from old.author_id
         or new.created_at is distinct from old.created_at then
        raise exception 'TASK_FIELD_UPDATE_FORBIDDEN'
          using errcode = 'P0001';
      end if;

      if old.status = 'accepted'
         and (
           new.title is distinct from old.title
           or new.description is distinct from old.description
           or new.assignee_id is distinct from old.assignee_id
         ) then
        null;
      end if;
    end if;

    new.title := trim(new.title);
    new.description := coalesce(new.description, '');
    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;

create or replace function public.on_task_created_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_status_history (
    task_id,
    from_status,
    to_status,
    actor_id,
    comment
  ) values (
    new.id,
    null,
    'new',
    new.author_id,
    null
  );
  return new;
end;
$$;

create or replace function public.transition_task(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_task public.tasks;
  v_from public.task_status;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
  v_allowed boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001';
  end if;

  v_role := public.profile_role(v_uid);
  if v_role is null then
    raise exception 'FORBIDDEN_ROLE'
      using errcode = 'P0001';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'TASK_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  v_from := v_task.status;

  if v_from = 'new' and p_to_status = 'in_progress' then
    v_allowed := v_role = 'executor' and v_task.assignee_id = v_uid;
  elsif v_from = 'in_progress' and p_to_status = 'on_review' then
    v_allowed := v_role = 'executor' and v_task.assignee_id = v_uid;
  elsif v_from = 'on_review' and p_to_status = 'accepted' then
    v_allowed := v_role = 'assigner';
  elsif v_from = 'on_review' and p_to_status = 'rework' then
    if v_role = 'assigner' then
      if v_comment is null then
        raise exception 'TASK_COMMENT_REQUIRED'
          using errcode = 'P0001';
      end if;
      v_allowed := true;
    end if;
  elsif v_from = 'rework' and p_to_status = 'in_progress' then
    v_allowed := v_role = 'executor' and v_task.assignee_id = v_uid;
  end if;

  if not v_allowed then
    raise exception 'TASK_TRANSITION_FORBIDDEN'
      using errcode = 'P0001';
  end if;

  perform set_config('app.allow_status_transition', 'on', true);

  update public.tasks
  set status = p_to_status
  where id = p_task_id
  returning * into v_task;

  insert into public.task_status_history (
    task_id,
    from_status,
    to_status,
    actor_id,
    comment
  ) values (
    p_task_id,
    v_from,
    p_to_status,
    v_uid,
    v_comment
  );

  return v_task;
end;
$$;

create trigger tasks_enforce_write
before insert or update on public.tasks
for each row
execute function public.enforce_task_write();

create trigger tasks_created_history
after insert on public.tasks
for each row
execute function public.on_task_created_history();

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

create policy profiles_select on public.profiles
for select
to authenticated
using (
  public.is_assigner()
  or id = auth.uid()
  or id in (
    select t.author_id
    from public.tasks t
    where t.assignee_id = auth.uid()
  )
);

create policy objects_select on public.objects
for select
to authenticated
using (
  public.is_assigner()
  or exists (
    select 1
    from public.tasks t
    where t.object_id = objects.id
      and t.assignee_id = auth.uid()
  )
);

create policy objects_insert on public.objects
for insert
to authenticated
with check (public.is_assigner() and created_by = auth.uid());

create policy objects_update on public.objects
for update
to authenticated
using (public.is_assigner())
with check (public.is_assigner());

create policy objects_delete on public.objects
for delete
to authenticated
using (public.is_assigner());

create policy tasks_select on public.tasks
for select
to authenticated
using (
  public.is_assigner()
  or assignee_id = auth.uid()
);

create policy tasks_insert on public.tasks
for insert
to authenticated
with check (
  public.is_assigner()
  and author_id = auth.uid()
  and status = 'new'
);

create policy tasks_update on public.tasks
for update
to authenticated
using (public.is_assigner())
with check (public.is_assigner());

create policy tasks_delete on public.tasks
for delete
to authenticated
using (public.is_assigner());

create policy task_status_history_select on public.task_status_history
for select
to authenticated
using (
  public.is_assigner()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_status_history.task_id
      and t.assignee_id = auth.uid()
  )
);

revoke all on table public.task_status_history from anon, authenticated;
grant select on table public.task_status_history to authenticated;

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.objects to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

revoke all on function public.transition_task(uuid, public.task_status, text) from public;
grant execute on function public.transition_task(uuid, public.task_status, text) to authenticated;

grant usage on schema public to authenticated;
