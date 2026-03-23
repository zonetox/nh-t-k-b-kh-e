
-- Fix: Change view to SECURITY INVOKER (default, respects caller's RLS)
DROP VIEW IF EXISTS public.baby_vaccine_status;
CREATE VIEW public.baby_vaccine_status
WITH (security_invoker = on)
AS
SELECT
  vs.baby_id,
  count(*) as total_vaccines,
  count(*) FILTER (WHERE vs.status = 'done') as completed,
  count(*) FILTER (WHERE vs.status IN ('pending', 'upcoming')) as pending,
  count(*) FILTER (WHERE vs.status = 'overdue') as overdue,
  count(*) FILTER (WHERE vs.status = 'skipped') as skipped,
  min(vs.scheduled_date) FILTER (WHERE vs.status IN ('pending', 'upcoming', 'overdue')) as next_due_date
FROM vaccine_schedules vs
GROUP BY vs.baby_id;
