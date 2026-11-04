-- Demo data only. Auth users must already exist (do not recreate accounts):
--   assigner@siteflow.demo  /  DemoAssigner!23
--   exec1@siteflow.demo     /  DemoExec1!23
--   exec2@siteflow.demo     /  DemoExec2!23
-- Run once in SQL Editor. Re-run safe: rebuilds objects/tasks, keeps auth users.

do $$
declare
  v_assigner uuid;
  v_exec1 uuid;
  v_exec2 uuid;
  o1 uuid;
  o2 uuid;
  o3 uuid;
  o4 uuid;
  o5 uuid;
  t uuid;
begin
  select id into v_assigner from auth.users where lower(email) = lower('assigner@siteflow.demo');
  select id into v_exec1 from auth.users where lower(email) = lower('exec1@siteflow.demo');
  select id into v_exec2 from auth.users where lower(email) = lower('exec2@siteflow.demo');

  if v_assigner is null or v_exec1 is null or v_exec2 is null then
    raise exception 'Auth users missing. Keep existing accounts: assigner@, exec1@, exec2@ siteflow.demo';
  end if;

  alter table public.tasks disable trigger tasks_enforce_write;
  alter table public.tasks disable trigger tasks_created_history;

  delete from public.tasks;
  delete from public.objects;

  insert into public.profiles (id, email, full_name, role) values
    (v_assigner, 'assigner@siteflow.demo', 'Aleksandr Morozov', 'assigner'),
    (v_exec1, 'exec1@siteflow.demo', 'Dmitry Orlov', 'executor'),
    (v_exec2, 'exec2@siteflow.demo', 'Sergey Volkov', 'executor')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role;

  insert into public.objects (title, address, created_by) values
    ('ЖК «Невский берег»', '191186, г. Санкт-Петербург, наб. реки Фонтанки, д. 12', v_assigner)
  returning id into o1;

  insert into public.objects (title, address, created_by) values
    ('Логистический комплекс «Южные ворота»', '142715, Московская обл., г. Видное, ул. Заводская, д. 7', v_assigner)
  returning id into o2;

  insert into public.objects (title, address, created_by) values
    ('БЦ «Сибирский квартал»', '630099, г. Новосибирск, ул. Красный проспект, д. 25', v_assigner)
  returning id into o3;

  insert into public.objects (title, address, created_by) values
    ('Школа №47, реконструкция корпуса', '620014, г. Екатеринбург, ул. Малышева, д. 36', v_assigner)
  returning id into o4;

  insert into public.objects (title, address, created_by) values
    ('Мостовой переход через р. Казанка', '420111, г. Казань, ул. Баумана, д. 9/15', v_assigner)
  returning id into o5;

  -- o1: mix for exec1
  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o1, 'Согласовать график бетонирования плиты', 'Согласовать окна заливки перекрытия 3-го этажа с лабораторией.', v_exec1, v_assigner, 'new')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o1, 'Проверить установку опалубки лифтовой шахты', 'Сверить геометрию опалубки с чертежом АР-12.', v_exec1, v_assigner, 'in_progress')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec1);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o1, 'Сдать акт скрытых работ по гидроизоляции', 'Подготовить акт и фото фиксации по подвалу секции А.', v_exec2, v_assigner, 'on_review')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec2),
    (t, 'in_progress', 'on_review', v_exec2);

  -- o2: warehouse / fencing / drainage — exec2 heavy
  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o2, 'Инвентаризация временного ограждения', 'Посчитать панели по восточному периметру и отметить пропуски.', v_exec2, v_assigner, 'new')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o2, 'Переснять фото дренажа у корпуса Б', 'Заменить размытые кадры у ливнеприёмника №3.', v_exec2, v_assigner, 'rework')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id, comment) values
    (t, null, 'new', v_assigner, null),
    (t, 'new', 'in_progress', v_exec2, null),
    (t, 'in_progress', 'on_review', v_exec2, null),
    (t, 'on_review', 'rework', v_assigner, 'На кадре 2 отсутствует маркировка ливнеприёмника.');

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o2, 'Проверить погрузочную рампу', 'Замерить уклон и зафиксировать повреждения покрытия.', v_exec1, v_assigner, 'in_progress')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec1);

  -- o3: office frame
  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o3, 'Проверить вертикальность колонн оси C', 'Зафиксировать отклонения свыше 3 мм.', v_exec1, v_assigner, 'accepted')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec1),
    (t, 'in_progress', 'on_review', v_exec1),
    (t, 'on_review', 'accepted', v_assigner);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o3, 'Загрузить план подъёма краном на неделю 14', 'Приложить подписанный PDF и схему зон ограничения.', v_exec1, v_assigner, 'on_review')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec1),
    (t, 'in_progress', 'on_review', v_exec1);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o3, 'Уточнить ведомость металлоконструкций', 'Сверить спецификацию с поставкой по накладной №441.', v_exec2, v_assigner, 'new')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner);

  -- o4: school reconstruction
  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o4, 'Осмотреть состояние кровли над актовым залом', 'Отметить протечки и повреждения покрытия.', v_exec2, v_assigner, 'in_progress')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec2);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o4, 'Согласовать временные пути эвакуации', 'Согласовать схему с заказчиком до начала демонтажа.', v_exec1, v_assigner, 'rework')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id, comment) values
    (t, null, 'new', v_assigner, null),
    (t, 'new', 'in_progress', v_exec1, null),
    (t, 'in_progress', 'on_review', v_exec1, null),
    (t, 'on_review', 'rework', v_assigner, 'Нет подписи ответственного за пожарную безопасность.');

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o4, 'Сфотографировать демонтаж перегородок 2 этажа', 'Сделать обзорные и детальные кадры до вывоза мусора.', v_exec2, v_assigner, 'accepted')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec2),
    (t, 'in_progress', 'on_review', v_exec2),
    (t, 'on_review', 'accepted', v_assigner);

  -- o5: bridge — both executors
  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o5, 'Контроль армирования опоры №2', 'Сверить шаг арматуры с проектом КЖ-05.', v_exec1, v_assigner, 'new')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o5, 'Зафиксировать уровень воды у временного пирса', 'Снять показания утром и вечером, приложить фото рейки.', v_exec2, v_assigner, 'on_review')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec2),
    (t, 'in_progress', 'on_review', v_exec2);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o5, 'Проверить освещение строительной площадки', 'Пройти ночной обход, отметить негорящие опоры.', v_exec1, v_assigner, 'in_progress')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec1);

  insert into public.tasks (object_id, title, description, assignee_id, author_id, status) values
    (o5, 'Сдать журнал бетонных работ за неделю', 'Заполнить журнал и приложить результаты испытаний кубиков.', v_exec2, v_assigner, 'accepted')
  returning id into t;
  insert into public.task_status_history (task_id, from_status, to_status, actor_id) values
    (t, null, 'new', v_assigner),
    (t, 'new', 'in_progress', v_exec2),
    (t, 'in_progress', 'on_review', v_exec2),
    (t, 'on_review', 'accepted', v_assigner);

  alter table public.tasks enable trigger tasks_enforce_write;
  alter table public.tasks enable trigger tasks_created_history;
end;
$$;

select 'objects' as kind, count(*)::text as value from public.objects
union all
select 'tasks', count(*)::text from public.tasks
union all
select 'by_status', status || '=' || count(*)::text from public.tasks group by status
order by 1, 2;

select email, role from public.profiles order by role, email;
