-- Seed data for one schema. Replayed into every demo_* schema on reset,
-- so nothing here may name a schema.
--
-- Explicit ids let the org chart wire itself up in a single statement: foreign
-- key checks fire at the end of an INSERT, not per row, so Alice can point at
-- Bob before Bob's row exists.

TRUNCATE order_items, orders, posts, products, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, age, department, salary, hired_at, manager_id) VALUES
  (1, 'Alice Johnson', 'alice@example.com', 28, 'Engineering', 95000, '2021-03-14 00:00:00+00', 2),
  (2, 'Bob Smith', 'bob@example.com', 34, 'Engineering', 110000, '2019-07-01 00:00:00+00', 6),
  (3, 'Carol Williams', 'carol@example.com', 31, 'Marketing', 78000, '2022-01-10 00:00:00+00', 6),
  (4, 'David Brown', 'david@example.com', 42, 'Sales', 87000, '2018-11-20 00:00:00+00', 8),
  (5, 'Eva Martinez', 'eva@example.com', 26, 'Design', 82000, '2023-05-02 00:00:00+00', 6),
  (6, 'Frank Wilson', 'frank@example.com', 39, 'Engineering', 125000, '2017-09-15 00:00:00+00', NULL),
  (7, 'Grace Lee', 'grace@example.com', 29, 'Marketing', 72000, '2022-08-23 00:00:00+00', 3),
  (8, 'Henry Davis', 'henry@example.com', 45, 'Sales', 98000, '2016-02-11 00:00:00+00', 6),
  (9, 'Ivy Chen', 'ivy@example.com', 33, 'Engineering', 105000, '2020-06-18 00:00:00+00', 6),
  (10, 'Jack Turner', 'jack@example.com', 37, 'Sales', 91000, '2019-12-05 00:00:00+00', 8),
  (11, 'Kara Nguyen', 'kara@example.com', 24, 'Design', 68000, '2024-02-19 00:00:00+00', 5),
  (12, 'Liam O''Brien', 'liam@example.com', 30, 'Marketing', 75000, '2021-10-01 00:00:00+00', 3);

INSERT INTO posts (id, title, content, published, created_at, author_id) VALUES
  (1, 'Getting Started with PostgreSQL', 'A beginner-friendly introduction to relational databases and SQL.', true, '2024-01-05 00:00:00+00', 1),
  (2, 'Advanced Window Functions', 'Learn how to use RANK, ROW_NUMBER, LAG and LEAD effectively.', true, '2024-02-12 00:00:00+00', 2),
  (3, 'Why We Chose Prisma', 'Our experience moving from a document database to Postgres.', true, '2024-02-20 00:00:00+00', 1),
  (4, 'Draft: Marketing Campaign Ideas', 'Brainstorming notes for Q4 campaign.', false, '2024-03-01 00:00:00+00', 3),
  (5, 'Sales Strategies for 2026', 'Key takeaways from the annual sales conference.', true, '2024-03-15 00:00:00+00', 4),
  (6, 'UI Design Principles', 'Modern design systems and accessibility best practices.', true, '2024-04-02 00:00:00+00', 5),
  (7, 'Database Indexing Deep Dive', 'How indexes work under the hood and when to use them.', true, '2024-04-10 00:00:00+00', 6),
  (8, 'Unpublished Research Notes', 'Internal notes, not ready for publication.', false, '2024-04-11 00:00:00+00', 6),
  (9, 'CTEs vs Subqueries', 'When to reach for a common table expression instead of nesting.', true, '2024-05-01 00:00:00+00', 9),
  (10, 'A Guide to JSONB Columns', 'Storing and querying semi-structured data in Postgres.', true, '2024-05-20 00:00:00+00', 9),
  (11, 'Draft: Rebrand Notes', 'Early thoughts on the Q3 rebrand.', false, '2024-06-01 00:00:00+00', 7);

INSERT INTO products (id, name, price, stock, category, tags, metadata) VALUES
  (1, 'Wireless Mouse', 29.99, 150, 'Electronics', ARRAY['wireless', 'peripheral', 'bestseller'], '{"warrantyMonths":24,"color":"black","wireless":true}'),
  (2, 'Mechanical Keyboard', 89.99, 75, 'Electronics', ARRAY['peripheral', 'mechanical', 'bestseller'], '{"warrantyMonths":24,"switchType":"brown","backlit":true}'),
  (3, 'USB-C Hub', 45.50, 200, 'Electronics', ARRAY['adapter', 'peripheral'], '{"warrantyMonths":12,"ports":7}'),
  (4, 'Webcam HD', 69.99, 60, 'Electronics', ARRAY['video', 'peripheral'], '{"warrantyMonths":12,"resolution":"1080p"}'),
  (5, 'Noise-Cancelling Headphones', 149.99, 0, 'Electronics', ARRAY['audio', 'wireless', 'premium'], '{"warrantyMonths":24,"wireless":true,"anc":true}'),
  (6, 'Standing Desk', 349.00, 25, 'Furniture', ARRAY['ergonomic', 'premium'], '{"warrantyMonths":60,"adjustable":true}'),
  (7, 'Ergonomic Chair', 279.99, 40, 'Furniture', ARRAY['ergonomic', 'bestseller'], '{"warrantyMonths":60,"adjustable":true}'),
  (8, 'Monitor Stand', 59.99, 90, 'Furniture', ARRAY['ergonomic'], '{"warrantyMonths":12}'),
  (9, 'Bookshelf', 129.99, 15, 'Furniture', ARRAY['storage'], '{"warrantyMonths":24,"shelves":5}'),
  (10, 'Notebook Pack (5)', 12.99, 300, 'Stationery', ARRAY['paper', 'bulk'], '{"warrantyMonths":0,"pages":200}'),
  (11, 'Premium Pens Set', 18.50, 180, 'Stationery', ARRAY['writing', 'premium'], '{"warrantyMonths":0,"count":10}'),
  (12, 'Sticky Notes Bulk Pack', 9.99, 400, 'Stationery', ARRAY['paper', 'bulk'], '{"warrantyMonths":0}'),
  (13, 'Desk Calendar', 14.99, 0, 'Stationery', ARRAY['paper'], '{"warrantyMonths":0,"year":2026}'),
  (14, 'Laptop Sleeve', 24.99, 120, 'Accessories', ARRAY['protection', 'travel'], '{"warrantyMonths":12,"fitsInches":15}'),
  (15, 'Cable Organizer', 11.99, 250, 'Accessories', ARRAY['storage', 'bulk'], '{"warrantyMonths":0}'),
  (16, 'Laptop Stand', 39.99, 85, 'Accessories', ARRAY['ergonomic', 'travel'], '{"warrantyMonths":12,"adjustable":true}'),
  (17, 'Phone Grip', 8.99, 500, 'Accessories', ARRAY['bulk'], '{"warrantyMonths":0}');

INSERT INTO orders (id, status, created_at, user_id) VALUES
  (1, 'completed', '2024-06-01 00:00:00+00', 1),
  (2, 'completed', '2024-07-15 00:00:00+00', 1),
  (3, 'completed', '2024-06-10 00:00:00+00', 2),
  (4, 'pending', '2024-07-01 00:00:00+00', 3),
  (5, 'completed', '2024-05-20 00:00:00+00', 4),
  (6, 'cancelled', '2024-06-25 00:00:00+00', 5),
  (7, 'completed', '2024-07-05 00:00:00+00', 6),
  (8, 'completed', '2024-07-20 00:00:00+00', 9),
  (9, 'pending', '2024-07-22 00:00:00+00', 10),
  (10, 'completed', '2024-08-01 00:00:00+00', 1);

INSERT INTO order_items (id, quantity, unit_price, order_id, product_id) VALUES
  (1, 2, 29.99, 1, 1),
  (2, 1, 45.50, 1, 3),
  (3, 1, 89.99, 2, 2),
  (4, 1, 349.00, 3, 6),
  (5, 1, 59.99, 3, 8),
  (6, 3, 12.99, 4, 10),
  (7, 2, 18.50, 4, 11),
  (8, 1, 279.99, 5, 7),
  (9, 1, 24.99, 6, 14),
  (10, 2, 11.99, 6, 15),
  (11, 1, 89.99, 7, 2),
  (12, 1, 69.99, 7, 4),
  (13, 3, 45.50, 8, 3),
  (14, 3, 11.99, 8, 15),
  (15, 1, 129.99, 9, 9),
  (16, 1, 39.99, 10, 16),
  (17, 2, 8.99, 10, 17);

-- Explicit ids leave the identity sequences behind, so the INSERT demo
-- buttons would collide on the next generated id without this.
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('posts', 'id'), (SELECT max(id) FROM posts));
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT max(id) FROM products));
SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT max(id) FROM orders));
SELECT setval(pg_get_serial_sequence('order_items', 'id'), (SELECT max(id) FROM order_items));
