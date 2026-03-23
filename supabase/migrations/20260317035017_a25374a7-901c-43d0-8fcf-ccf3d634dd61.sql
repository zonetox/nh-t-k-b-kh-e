
-- ============================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- ============================================

-- babies: fast lookup by user
CREATE INDEX IF NOT EXISTS idx_babies_user_id ON public.babies(user_id) WHERE deleted_at IS NULL;

-- vaccine_schedules: core query indexes
CREATE INDEX IF NOT EXISTS idx_schedules_baby_id ON public.vaccine_schedules(baby_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.vaccine_schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON public.vaccine_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_vaccine_id ON public.vaccine_schedules(vaccine_id);

-- Composite: dashboard + upcoming + overdue queries
CREATE INDEX IF NOT EXISTS idx_schedules_baby_status_date ON public.vaccine_schedules(baby_id, status, scheduled_date);

-- notifications: bell queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- notification_jobs: cron batch processing
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_scheduled ON public.notification_jobs(status, scheduled_at) WHERE status = 'pending';

-- vaccine_history: schedule lookup
CREATE INDEX IF NOT EXISTS idx_vaccine_history_schedule_id ON public.vaccine_history(schedule_id);

-- ============================================
-- OPTIMIZED VIEW: baby_dashboard_summary
-- ============================================
CREATE OR REPLACE VIEW public.baby_dashboard_summary
WITH (security_invoker = on) AS
SELECT
  b.id AS baby_id,
  b.name AS baby_name,
  b.dob,
  b.gender,
  COALESCE(stats.total, 0) AS total_vaccines,
  COALESCE(stats.completed, 0) AS completed_count,
  COALESCE(stats.upcoming, 0) AS upcoming_count,
  COALESCE(stats.overdue, 0) AS overdue_count,
  COALESCE(stats.pending, 0) AS pending_count,
  nxt.vaccine_name AS next_vaccine_name,
  nxt.dose_number AS next_dose_number,
  nxt.scheduled_date AS next_vaccine_date,
  nxt.days_until AS next_vaccine_days
FROM babies b
LEFT JOIN LATERAL (
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE vs.status = 'done') AS completed,
    count(*) FILTER (WHERE vs.status = 'upcoming') AS upcoming,
    count(*) FILTER (WHERE vs.status = 'overdue') AS overdue,
    count(*) FILTER (WHERE vs.status = 'pending') AS pending
  FROM vaccine_schedules vs
  WHERE vs.baby_id = b.id
) stats ON true
LEFT JOIN LATERAL (
  SELECT
    v.name AS vaccine_name,
    vs.dose_number,
    vs.scheduled_date,
    (vs.scheduled_date - CURRENT_DATE)::integer AS days_until
  FROM vaccine_schedules vs
  JOIN vaccines v ON v.id = vs.vaccine_id
  WHERE vs.baby_id = b.id
    AND vs.status IN ('pending', 'upcoming', 'overdue')
  ORDER BY vs.scheduled_date ASC
  LIMIT 1
) nxt ON true
WHERE b.deleted_at IS NULL;
