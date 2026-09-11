# SQL Sandbox

An interactive SQL playground. Click a button, real SQL runs against a real
PostgreSQL database, and you get back the rows, the query that produced them,
and a note explaining what it does.

**Status: still building.** The backend works end to end, but there's no
interface yet, so there's nothing to click. Come back in a few days/weeks.
This particular project I'm taking my time, in order to learn Next.js, PostgreSQL and Typescript thoroughly.

## The idea

Most SQL demos run against a fake in-memory database, or a shared one where all
you can do is read. This one hands every visitor their own private Postgres
schema, so you can insert, update, delete, add indexes and drop tables without
affecting anyone else. A Reset button puts it back the way it was.

Three things make it worth a look:

- **It shows the code behind every query.** A toggle reveals the SQL, the note,
  and the actual source files that ran it, read off disk when you ask for them
  so the panel can't drift from the real code.
- **A private sandbox per visitor.** Twenty Postgres schemas handed out one at
  a time, which is what makes writes and schema changes safe on a public site.
- **Around 58 queries across nine pages**, from plain SELECT through joins,
  CTEs, window functions, JSONB and full text search.

## Built with

| Area      | Choice                |
| --------- | --------------------- |
| Framework | Next.js, App Router   |
| Language  | TypeScript            |
| Database  | PostgreSQL            |
| Driver    | node-postgres, no ORM |
| Styling   | Tailwind              |
| Hosting   | Vercel and Neon       |

No ORM. The SQL is the whole point, so all of it is hand written.
This was done to relearn SQL without any shortcuts.

## Running it locally

You'll need Docker and Node 24.

```bash
git clone https://github.com/SZStanton/sql-sandbox.git
cd sql-sandbox
npm install
cp .env.example .env.local
npm run db:up
npm run db:migrate
npm run db:provision
npm run dev
```
