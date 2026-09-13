-- Runs with the owner's rights, so sandbox_app can claim a sandbox without
-- being able to read public.sandboxes itself.
CREATE OR REPLACE FUNCTION public.claim_sandbox(idle_minutes INTEGER)
RETURNS TABLE (claimed_token TEXT, claimed_schema TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE public.sandboxes AS s
  SET token = encode(public.gen_random_bytes(24), 'hex'),
      claimed_at = now(),
      last_seen_at = now()
  WHERE s.id = (
    SELECT free.id
    FROM public.sandboxes AS free
    WHERE free.token IS NULL
        OR free.last_seen_at < now() - (interval '1 minute' * idle_minutes)
    ORDER BY free.last_seen_at ASC NULLS FIRST
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING s.token, s.schema_name;
$$;

-- Checks the token and marks the visitor active, returning their schema.
CREATE OR REPLACE FUNCTION public.begin_sandbox_session(session_token TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE public.sandboxes AS s
  SET last_seen_at = now()
  WHERE s.token = session_token
  RETURNING s.schema_name;
$$;

-- Postgres grants EXECUTE to everyone by default, so take it away first.
REVOKE ALL ON FUNCTION public.claim_sandbox(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.begin_sandbox_session(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_sandbox(INTEGER) TO sandbox_app;
GRANT EXECUTE ON FUNCTION public.begin_sandbox_session(TEXT) TO sandbox_app;