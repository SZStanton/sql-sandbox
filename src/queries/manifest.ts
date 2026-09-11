// Curriculum order. Also the order the nav renders in.
export const PAGES = [
  'reading',
  'aggregating',
  'joins',
  'subqueries',
  'window-functions',
  'transforming',
  'writing',
  'schema',
  'json-and-search',
] as const;

export type PageId = (typeof PAGES)[number];

type ChartSpec = {
  type: 'bar';
  x: string;
  y: string;
};

type BaseQuery = {
  id: string;
  title: string;
  page: PageId;
  note: string;
  sql: string;
  chart?: ChartSpec;
};

// A write has to prove it worked, so verify is required only when it mutates.
type ReadQuery = BaseQuery & { mutates: false };
type WriteQuery = BaseQuery & { mutates: true; verify: string };

export type QueryEntry = ReadQuery | WriteQuery;

export const QUERIES = [
  {
    id: 'all-users',
    title: 'Every user',
    page: 'reading',
    note: 'SELECT names the columns you want. * is fine while exploring, but naming them means the result stops changing when someone adds a column.',
    sql: `SELECT id, name, email, department, salary
FROM users
ORDER BY id`,
    mutates: false,
  },
  {
    id: 'filter-department',
    title: 'One department, highest paid first',
    page: 'reading',
    note: 'WHERE filters rows before they are returned. ORDER BY runs after, so it sorts only what survived the filter.',
    sql: `SELECT name, salary, hired_at
FROM users
WHERE department = 'Engineering'
ORDER BY salary DESC`,
    mutates: false,
  },
  {
    id: 'recent-hires',
    title: 'Five most recent hires',
    page: 'reading',
    note: 'LIMIT caps the rows returned. It only means "the newest five" because ORDER BY ran first.',
    sql: `SELECT name, department, hired_at
FROM users
ORDER BY hired_at DESC
LIMIT 5`,
    mutates: false,
  },
  {
    id: 'headcount-by-department',
    title: 'Headcount and average salary by department',
    page: 'aggregating',
    note: 'GROUP BY collapses rows into one per department. Every selected column has to be either grouped or wrapped in an aggregate.',
    sql: `SELECT department,
        count(*) AS headcount,
        round(avg(salary), 2) AS avg_salary
FROM users
WHERE department IS NOT NULL
GROUP BY department
ORDER BY headcount DESC`,
    chart: { type: 'bar', x: 'department', y: 'headcount' },
    mutates: false,
  },
] as const satisfies readonly QueryEntry[];

export type QueryId = (typeof QUERIES)[number]['id'];

// Built once at import, so a click is a map lookup rather than a scan.
const BY_ID = new Map<QueryId, QueryEntry>(
  QUERIES.map(query => [query.id, query]),
);

export function getQuery(id: string) {
  return BY_ID.get(id as QueryId);
}
