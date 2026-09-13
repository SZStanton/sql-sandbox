-- Created here without a password, so the GRANTs in the next file have
-- something to grant to. db/provision.ts gives it a password and login.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sandbox_app') THEN
    CREATE ROLE sandbox_app NOLOGIN;
  END IF;
END
$$;

-- The registry and every visitor's token live in public.
REVOKE ALL ON SCHEMA public FROM sandbox_app;