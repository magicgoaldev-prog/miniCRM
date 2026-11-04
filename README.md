# SiteFlow

Мини-CRM для строительных объектов и задач с циклом проверки.  
Mini CRM for construction sites and tasks with a review cycle.

**Стек / Stack:** React, TypeScript, Vite, Supabase (Auth + Postgres RLS)

---

## Русский

### Что внутри

- Роли: постановщик и исполнитель
- Объекты и задачи, допустимые переходы статусов
- История статусов
- Права на уровне базы (RLS): обход интерфейса не открывает чужие данные
- Миграция: `supabase/migrations/20260322000001_init.sql`
- Сид демо-данных: `supabase/seed.sql`

### Как запустить

1. Создайте проект в Supabase.
2. **Authentication → Providers → Email** — отключите публичную регистрацию.
3. В SQL Editor выполните `supabase/migrations/20260322000001_init.sql`.
4. Создайте трёх пользователей в Auth (email confirmed):

| Роль | Email | Пароль |
|------|-------|--------|
| Постановщик | `assigner@siteflow.demo` | `DemoAssigner!23` |
| Исполнитель | `exec1@siteflow.demo` | `DemoExec1!23` |
| Исполнитель | `exec2@siteflow.demo` | `DemoExec2!23` |

5. Выполните `supabase/seed.sql` (id пользователей подтягиваются по email).
6. Скопируйте `.env.example` → `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

Только **anon / publishable** ключ. `service_role` в репозиторий и фронт не класть.

7. Локально:

```bash
npm install
npm run dev
```

Сборка: `npm run build`

### Документы к сдаче

- Пояснение для руководителя (без программистского жаргона): [`OVERVIEW.md`](OVERVIEW.md)
- Решения и допущения: [`ASSUMPTIONS.md`](ASSUMPTIONS.md)

### Деплой

Vercel, Netlify или любой static host. Те же `VITE_*` переменные в настройках хоста. После деплоя — ссылка на приложение и доступы из таблицы выше.

---

## English

### What’s included

- Roles: assigner and executor
- Sites (objects) and tasks with allowed status transitions
- Status history
- Database-level access (RLS): bypassing the UI does not expose other people’s data
- Migration: `supabase/migrations/20260322000001_init.sql`
- Demo seed: `supabase/seed.sql`

### How to run

1. Create a Supabase project.
2. **Authentication → Providers → Email** — disable public signups.
3. Run `supabase/migrations/20260322000001_init.sql` in the SQL Editor.
4. Create three Auth users (email confirmed) using the table in the Russian section above.
5. Run `supabase/seed.sql` (user ids are resolved by email).
6. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon/publishable only — never `service_role`).
7. `npm install` then `npm run dev`. Production build: `npm run build`.

### Submission docs

- Non-technical overview: [`OVERVIEW.md`](OVERVIEW.md)
- Decisions and assumptions: [`ASSUMPTIONS.md`](ASSUMPTIONS.md)

### Deploy

Any static host (Vercel / Netlify). Set the same `VITE_` env vars. Ship the live URL plus the demo accounts from the table above.
