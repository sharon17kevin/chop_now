-- ============================================================================
-- ESCROW AUTO-RELEASE CRON JOB
-- ============================================================================
-- Created: March 3, 2026
-- Purpose: Schedule automatic release of eligible escrow funds (every 2 hours)
-- Depends: auto-release-escrow Edge Function must be deployed
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE REQUIRED EXTENSIONS
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'HTTP client for PostgreSQL - required for calling Edge Functions';

-- ----------------------------------------------------------------------------
-- 2. DROP EXISTING CRON JOB (IF EXISTS)
-- ----------------------------------------------------------------------------

-- Remove any existing escrow release jobs for clean setup
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname IN ('auto-release-escrow-hourly', 'auto-release-escrow-2hr', 'hourly-escrow-release', 'escrow-release');

-- ----------------------------------------------------------------------------
-- 3. CREATE ESCROW RELEASE CRON JOB
-- ----------------------------------------------------------------------------

-- ⚠️ READY TO RUN - Values already filled in with your credentials

SELECT cron.schedule(
  'auto-release-escrow-2hr',                        -- Job name
  '0 */2 * * *',                                    -- Runs every 2 hours (12am, 2am, 4am, etc.)
  $$
  SELECT net.http_post(
    url := 'https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/auto-release-escrow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW5kcnB3Y3Zud2FtdnB2anN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ1NzM3OSwiZXhwIjoyMDc4MDMzMzc5fQ.B1CmjaipN0b8WOrgpunANY9KtU8Uf8-5uqnHVn-Y28Y'
    ),
    body := jsonb_build_object(
      'triggered_by', 'cron',
      'triggered_at', to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
  );
  $$
);

-- ----------------------------------------------------------------------------
-- 4. VERIFY CRON JOB CREATED
-- ----------------------------------------------------------------------------

-- Check the cron job was created successfully
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'auto-release-escrow-2hr';

-- Expected output:
-- jobid | jobname                    | schedule     | active | command
-- ------|----------------------------|--------------|--------|----------
-- X     | auto-release-escrow-2hr    | 0 */2 * * *  | t      | SELECT net.http_post(...)

-- ----------------------------------------------------------------------------
-- 5. MONITORING QUERIES
-- ----------------------------------------------------------------------------

-- View all cron jobs
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;

-- Check when the job will run next (every 2 hours)
-- Next run times: 12:00 AM, 2:00 AM, 4:00 AM, 6:00 AM, 8:00 AM, 10:00 AM, 12:00 PM, etc.
SELECT 
  jobid,
  jobname,
  schedule,
  date_trunc('hour', now()) + 
    interval '2 hour' * CEIL(EXTRACT(HOUR FROM now())::numeric / 2) as next_run_estimate
FROM cron.job
WHERE jobname = 'auto-release-escrow-2hr';

-- ----------------------------------------------------------------------------
-- 6. MANUAL TESTING (RECOMMENDED BEFORE WAITING FOR CRON)
-- ----------------------------------------------------------------------------

-- Test the Edge Function manually to verify it works
/*
SELECT net.http_post(
  url := 'https://aoqndrpwcvnwamvpvjsx.supabase.co/functions/v1/auto-release-escrow',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcW5kcnB3Y3Zud2FtdnB2anN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ1NzM3OSwiZXhwIjoyMDc4MDMzMzc5fQ.B1CmjaipN0b8WOrgpunANY9KtU8Uf8-5uqnHVn-Y28Y'
  ),
  body := jsonb_build_object('test', true)
);

-- Expected response: {"status": 200, "content": ...}
-- If you get an error, check Edge Function is deployed
*/

-- Check if any orders are eligible for release right now
SELECT 
  id,
  vendor_id,
  total,
  vendor_payout_amount,
  escrow_status,
  eligible_for_release_at,
  CASE 
    WHEN eligible_for_release_at <= NOW() THEN 'ELIGIBLE NOW'
    ELSE 'NOT YET ELIGIBLE'
  END as release_status,
  EXTRACT(EPOCH FROM (eligible_for_release_at - NOW())) / 3600 as hours_until_eligible
FROM orders
WHERE escrow_status = 'held'
  AND payment_status = 'paid'
  AND status = 'delivered'
ORDER BY eligible_for_release_at ASC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 7. TROUBLESHOOTING
-- ----------------------------------------------------------------------------

-- If cron job isn't working:

-- 1. Check extensions are enabled
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
-- Should show both extensions

-- 2. Verify job is active
SELECT jobid, jobname, active FROM cron.job WHERE jobname = 'auto-release-escrow-2hr';
-- active should be 't' (true)

-- 3. Check Edge Function is deployed (go to Dashboard → Edge Functions)

-- 4. Manually test the HTTP call (run the query from Step 6 above)

-- To disable the cron job temporarily:
-- SELECT cron.unschedule('auto-release-escrow-2hr');

-- To re-enable, run Step 3 again

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================

/*
BEFORE RUNNING THIS MIGRATION:
1. Deploy Edge Function: 
   cd c:\Resources\app\chow
   supabase functions deploy auto-release-escrow

2. ✅ Credentials already filled in (Step 3):
   - Project: aoqndrpwcvnwamvpvjsx.supabase.co
   - Service role key: eyJhbG... (already in place)

3. Run this entire file in Supabase SQL Editor

AFTER RUNNING:
1. Verify: SELECT * FROM cron.job WHERE jobname = 'auto-release-escrow-2hr';
2. Test manually (Step 6 above)
3. Check logs after next 2-hour mark (Dashboard → Edge Functions → Logs)
4. Verify releases: SELECT * FROM orders WHERE escrow_status = 'released';

SCHEDULE:
- Runs every 2 hours at: 12am, 2am, 4am, 6am, 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm, 10pm
- Escrow still waits 24 hours after delivery before becoming eligible
- This just checks less frequently (saves resources)

ESTIMATED TIME:
- Deploy Edge Function: 2 min
- Run migration: 30 sec
- Test: 2 min
- Total: ~5 minutes
*/

-- ============================================================================
-- END OF CRON JOB SETUP
-- ============================================================================
