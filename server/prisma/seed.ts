/*
 * Seeds one schema with a fixed, deterministic dataset.
 *
 * Every run wipes and rebuilds the same data, so resetting a sandbox is just
 * this again. The reset path imports seed() rather than spawning a child
 * process, which is why it takes a client instead of making one.
 *
 * IMPORTANT, and it will cost you an afternoon otherwise: Prisma model methods
 * are schema-qualified from the connection URL, so `prisma.user.create()`
 * always writes to whatever `?schema=` says. `SET search_path` does NOT move
 * them. Only raw SQL follows search_path.
 *
 * So the caller decides which schema by handing over a client bound to it:
 *
 *   const client = new PrismaClient({
 *     datasources: { db: { url: `${BASE_URL}?schema=${schema}` } },
 *   });
 *   await seed(client);
 *   await client.$disconnect();
 *
 *   npm run prisma:seed        seeds public, the template
 *
 * Users are created in two passes, because managerId points at a User that does
 * not exist yet on the first pass. That self relation is what gives the org
 * chart its shape, and therefore what WITH RECURSIVE and the self-join queries
 * walk.
 */

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import type { UserModel, ProductModel } from '../generated/prisma/models.js';
// =============================================================
// DATA
// Shaped so every query category has something real to show. Varied salaries
// and hire dates for window and date functions, a few zero-stock products for
// CASE, users with no orders so LEFT JOIN differs from INNER, and a three deep
// reporting line so WITH RECURSIVE has something to walk.
//
// manager is a name, resolved to an id on a second pass below.
// =============================================================

const userData = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    age: 28,
    department: 'Engineering',
    salary: 95000,
    hiredAt: '2021-03-14',
    manager: 'Bob Smith',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    age: 34,
    department: 'Engineering',
    salary: 110000,
    hiredAt: '2019-07-01',
    manager: 'Frank Wilson',
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    age: 31,
    department: 'Marketing',
    salary: 78000,
    hiredAt: '2022-01-10',
    manager: 'Frank Wilson',
  },
  {
    name: 'David Brown',
    email: 'david@example.com',
    age: 42,
    department: 'Sales',
    salary: 87000,
    hiredAt: '2018-11-20',
    manager: 'Henry Davis',
  },
  {
    name: 'Eva Martinez',
    email: 'eva@example.com',
    age: 26,
    department: 'Design',
    salary: 82000,
    hiredAt: '2023-05-02',
    manager: 'Frank Wilson',
  },
  {
    name: 'Frank Wilson',
    email: 'frank@example.com',
    age: 39,
    department: 'Engineering',
    salary: 125000,
    hiredAt: '2017-09-15',
    manager: null,
  },
  {
    name: 'Grace Lee',
    email: 'grace@example.com',
    age: 29,
    department: 'Marketing',
    salary: 72000,
    hiredAt: '2022-08-23',
    manager: 'Carol Williams',
  },
  {
    name: 'Henry Davis',
    email: 'henry@example.com',
    age: 45,
    department: 'Sales',
    salary: 98000,
    hiredAt: '2016-02-11',
    manager: 'Frank Wilson',
  },
  {
    name: 'Ivy Chen',
    email: 'ivy@example.com',
    age: 33,
    department: 'Engineering',
    salary: 105000,
    hiredAt: '2020-06-18',
    manager: 'Frank Wilson',
  },
  {
    name: 'Jack Turner',
    email: 'jack@example.com',
    age: 37,
    department: 'Sales',
    salary: 91000,
    hiredAt: '2019-12-05',
    manager: 'Henry Davis',
  },
  {
    name: 'Kara Nguyen',
    email: 'kara@example.com',
    age: 24,
    department: 'Design',
    salary: 68000,
    hiredAt: '2024-02-19',
    manager: 'Eva Martinez',
  },
  {
    name: "Liam O'Brien",
    email: 'liam@example.com',
    age: 30,
    department: 'Marketing',
    salary: 75000,
    hiredAt: '2021-10-01',
    manager: 'Carol Williams',
  },
];

const postData = [
  {
    title: 'Getting Started with PostgreSQL',
    content:
      'A beginner-friendly introduction to relational databases and SQL.',
    published: true,
    author: 'Alice Johnson',
    createdAt: '2024-01-05',
  },
  {
    title: 'Advanced Window Functions',
    content: 'Learn how to use RANK, ROW_NUMBER, LAG and LEAD effectively.',
    published: true,
    author: 'Bob Smith',
    createdAt: '2024-02-12',
  },
  {
    title: 'Why We Chose Prisma',
    content: 'Our experience moving from a document database to Postgres.',
    published: true,
    author: 'Alice Johnson',
    createdAt: '2024-02-20',
  },
  {
    title: 'Draft: Marketing Campaign Ideas',
    content: 'Brainstorming notes for Q4 campaign.',
    published: false,
    author: 'Carol Williams',
    createdAt: '2024-03-01',
  },
  {
    title: 'Sales Strategies for 2026',
    content: 'Key takeaways from the annual sales conference.',
    published: true,
    author: 'David Brown',
    createdAt: '2024-03-15',
  },
  {
    title: 'UI Design Principles',
    content: 'Modern design systems and accessibility best practices.',
    published: true,
    author: 'Eva Martinez',
    createdAt: '2024-04-02',
  },
  {
    title: 'Database Indexing Deep Dive',
    content: 'How indexes work under the hood and when to use them.',
    published: true,
    author: 'Frank Wilson',
    createdAt: '2024-04-10',
  },
  {
    title: 'Unpublished Research Notes',
    content: 'Internal notes, not ready for publication.',
    published: false,
    author: 'Frank Wilson',
    createdAt: '2024-04-11',
  },
  {
    title: 'CTEs vs Subqueries',
    content: 'When to reach for a common table expression instead of nesting.',
    published: true,
    author: 'Ivy Chen',
    createdAt: '2024-05-01',
  },
  {
    title: 'A Guide to JSONB Columns',
    content: 'Storing and querying semi-structured data in Postgres.',
    published: true,
    author: 'Ivy Chen',
    createdAt: '2024-05-20',
  },
  {
    title: 'Draft: Rebrand Notes',
    content: 'Early thoughts on the Q3 rebrand.',
    published: false,
    author: 'Grace Lee',
    createdAt: '2024-06-01',
  },
];

// tags drives the array-containment queries, metadata drives the JSONB ones.
const productData = [
  {
    name: 'Wireless Mouse',
    price: 29.99,
    stock: 150,
    category: 'Electronics',
    tags: ['wireless', 'peripheral', 'bestseller'],
    metadata: { warrantyMonths: 24, color: 'black', wireless: true },
  },
  {
    name: 'Mechanical Keyboard',
    price: 89.99,
    stock: 75,
    category: 'Electronics',
    tags: ['peripheral', 'mechanical', 'bestseller'],
    metadata: { warrantyMonths: 24, switchType: 'brown', backlit: true },
  },
  {
    name: 'USB-C Hub',
    price: 45.5,
    stock: 200,
    category: 'Electronics',
    tags: ['adapter', 'peripheral'],
    metadata: { warrantyMonths: 12, ports: 7 },
  },
  {
    name: 'Webcam HD',
    price: 69.99,
    stock: 60,
    category: 'Electronics',
    tags: ['video', 'peripheral'],
    metadata: { warrantyMonths: 12, resolution: '1080p' },
  },
  {
    name: 'Noise-Cancelling Headphones',
    price: 149.99,
    stock: 0,
    category: 'Electronics',
    tags: ['audio', 'wireless', 'premium'],
    metadata: { warrantyMonths: 24, wireless: true, anc: true },
  },
  {
    name: 'Standing Desk',
    price: 349.0,
    stock: 25,
    category: 'Furniture',
    tags: ['ergonomic', 'premium'],
    metadata: { warrantyMonths: 60, adjustable: true },
  },
  {
    name: 'Ergonomic Chair',
    price: 279.99,
    stock: 40,
    category: 'Furniture',
    tags: ['ergonomic', 'bestseller'],
    metadata: { warrantyMonths: 60, adjustable: true },
  },
  {
    name: 'Monitor Stand',
    price: 59.99,
    stock: 90,
    category: 'Furniture',
    tags: ['ergonomic'],
    metadata: { warrantyMonths: 12 },
  },
  {
    name: 'Bookshelf',
    price: 129.99,
    stock: 15,
    category: 'Furniture',
    tags: ['storage'],
    metadata: { warrantyMonths: 24, shelves: 5 },
  },
  {
    name: 'Notebook Pack (5)',
    price: 12.99,
    stock: 300,
    category: 'Stationery',
    tags: ['paper', 'bulk'],
    metadata: { warrantyMonths: 0, pages: 200 },
  },
  {
    name: 'Premium Pens Set',
    price: 18.5,
    stock: 180,
    category: 'Stationery',
    tags: ['writing', 'premium'],
    metadata: { warrantyMonths: 0, count: 10 },
  },
  {
    name: 'Sticky Notes Bulk Pack',
    price: 9.99,
    stock: 400,
    category: 'Stationery',
    tags: ['paper', 'bulk'],
    metadata: { warrantyMonths: 0 },
  },
  {
    name: 'Desk Calendar',
    price: 14.99,
    stock: 0,
    category: 'Stationery',
    tags: ['paper'],
    metadata: { warrantyMonths: 0, year: 2026 },
  },
  {
    name: 'Laptop Sleeve',
    price: 24.99,
    stock: 120,
    category: 'Accessories',
    tags: ['protection', 'travel'],
    metadata: { warrantyMonths: 12, fitsInches: 15 },
  },
  {
    name: 'Cable Organizer',
    price: 11.99,
    stock: 250,
    category: 'Accessories',
    tags: ['storage', 'bulk'],
    metadata: { warrantyMonths: 0 },
  },
  {
    name: 'Laptop Stand',
    price: 39.99,
    stock: 85,
    category: 'Accessories',
    tags: ['ergonomic', 'travel'],
    metadata: { warrantyMonths: 12, adjustable: true },
  },
  {
    name: 'Phone Grip',
    price: 8.99,
    stock: 500,
    category: 'Accessories',
    tags: ['bulk'],
    metadata: { warrantyMonths: 0 },
  },
];

// The join table is what makes multi-table JOINs and revenue sums possible.
const orderPlan = [
  {
    user: 'Alice Johnson',
    status: 'completed',
    createdAt: '2024-06-01',
    items: [
      ['Wireless Mouse', 2],
      ['USB-C Hub', 1],
    ],
  },
  {
    user: 'Alice Johnson',
    status: 'completed',
    createdAt: '2024-07-15',
    items: [['Mechanical Keyboard', 1]],
  },
  {
    user: 'Bob Smith',
    status: 'completed',
    createdAt: '2024-06-10',
    items: [
      ['Standing Desk', 1],
      ['Monitor Stand', 1],
    ],
  },
  {
    user: 'Carol Williams',
    status: 'pending',
    createdAt: '2024-07-01',
    items: [
      ['Notebook Pack (5)', 3],
      ['Premium Pens Set', 2],
    ],
  },
  {
    user: 'David Brown',
    status: 'completed',
    createdAt: '2024-05-20',
    items: [['Ergonomic Chair', 1]],
  },
  {
    user: 'Eva Martinez',
    status: 'cancelled',
    createdAt: '2024-06-25',
    items: [
      ['Laptop Sleeve', 1],
      ['Cable Organizer', 2],
    ],
  },
  {
    user: 'Frank Wilson',
    status: 'completed',
    createdAt: '2024-07-05',
    items: [
      ['Mechanical Keyboard', 1],
      ['Webcam HD', 1],
    ],
  },
  {
    user: 'Ivy Chen',
    status: 'completed',
    createdAt: '2024-07-20',
    items: [
      ['USB-C Hub', 3],
      ['Cable Organizer', 3],
    ],
  },
  {
    user: 'Jack Turner',
    status: 'pending',
    createdAt: '2024-07-22',
    items: [['Bookshelf', 1]],
  },
  {
    user: 'Alice Johnson',
    status: 'completed',
    createdAt: '2024-08-01',
    items: [
      ['Laptop Stand', 1],
      ['Phone Grip', 2],
    ],
  },
] as const;

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
}

export async function seed(prisma: PrismaClient) {
  await resetDatabase(prisma);

  const users: UserModel[] = [];
  for (const u of userData) {
    const { manager: _manager, ...row } = u;
    users.push(
      await prisma.user.create({
        data: { ...row, hiredAt: new Date(row.hiredAt) },
      }),
    );
  }
  const byName = (name: string) => users.find(u => u.name === name)!;

  for (const u of userData) {
    if (!u.manager) continue;
    await prisma.user.update({
      where: { id: byName(u.name).id },
      data: { managerId: byName(u.manager).id },
    });
  }

  for (const p of postData) {
    const { author, createdAt, ...rest } = p;
    await prisma.post.create({
      data: {
        ...rest,
        authorId: byName(author).id,
        createdAt: new Date(createdAt),
      },
    });
  }

  const products: ProductModel[] = [];
  for (const p of productData) {
    products.push(await prisma.product.create({ data: p }));
  }
  const byProduct = (name: string) => products.find(p => p.name === name)!;

  for (const o of orderPlan) {
    await prisma.order.create({
      data: {
        userId: byName(o.user).id,
        status: o.status,
        createdAt: new Date(o.createdAt),
        items: {
          create: o.items.map(([productName, quantity]) => {
            const product = byProduct(productName as string);
            return {
              productId: product.id,
              quantity: quantity as number,
              unitPrice: product.price,
            };
          }),
        },
      },
    });
  }

  return {
    users: users.length,
    posts: postData.length,
    products: products.length,
    orders: orderPlan.length,
  };
}

const isDirectRun = process.argv[1]?.includes('seed');

if (isDirectRun) {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  seed(prisma)
    .then(counts => {
      console.log('seeded:', counts);
    })
    .catch(err => {
      console.error('Error while seeding:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
