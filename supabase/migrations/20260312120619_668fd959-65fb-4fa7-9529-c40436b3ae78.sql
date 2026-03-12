
-- 1. System Metrics Daily table
CREATE TABLE public.system_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL UNIQUE,
  total_users integer NOT NULL DEFAULT 0,
  total_babies integer NOT NULL DEFAULT 0,
  total_vaccine_schedules integer NOT NULL DEFAULT 0,
  completed_vaccines integer NOT NULL DEFAULT 0,
  pending_vaccines integer NOT NULL DEFAULT 0,
  overdue_vaccines integer NOT NULL DEFAULT 0,
  total_payments integer NOT NULL DEFAULT 0,
  total_revenue integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view metrics" ON public.system_metrics_daily
  FOR SELECT TO authenticated
  USING (is_any_admin(auth.uid()));

-- 2. System Errors table
CREATE TABLE public.system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  source text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view errors" ON public.system_errors
  FOR SELECT TO authenticated
  USING (is_any_admin(auth.uid()));

CREATE POLICY "Service can insert errors" ON public.system_errors
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Notification Metrics table
CREATE TABLE public.notification_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  jobs_created integer NOT NULL DEFAULT 0,
  jobs_sent integer NOT NULL DEFAULT 0,
  jobs_failed integer NOT NULL DEFAULT 0,
  jobs_retried integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view notification metrics" ON public.notification_metrics
  FOR SELECT TO authenticated
  USING (is_any_admin(auth.uid()));

-- 4. RPC to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date date := CURRENT_DATE - INTERVAL '1 day';
  v_total_users integer;
  v_total_babies integer;
  v_total_schedules integer;
  v_completed integer;
  v_pending integer;
  v_overdue integer;
  v_total_payments integer;
  v_total_revenue integer;
  v_jobs_created integer;
  v_jobs_sent integer;
  v_jobs_failed integer;
  v_jobs_retried integer;
BEGIN
  SELECT count(*) INTO v_total_users FROM profiles WHERE deleted_at IS NULL;
  SELECT count(*) INTO v_total_babies FROM babies WHERE deleted_at IS NULL;
  SELECT count(*) INTO v_total_schedules FROM vaccine_schedules;
  SELECT count(*) INTO v_completed FROM vaccine_schedules WHERE status = 'done';
  SELECT count(*) INTO v_pending FROM vaccine_schedules WHERE status IN ('pending', 'upcoming');
  SELECT count(*) INTO v_overdue FROM vaccine_schedules WHERE status = 'overdue';
  SELECT count(*) INTO v_total_payments FROM payments WHERE status = 'approved';
  SELECT COALESCE(sum(amount), 0) INTO v_total_revenue FROM payments WHERE status = 'approved';

  INSERT INTO system_metrics_daily (metric_date, total_users, total_babies, total_vaccine_schedules, completed_vaccines, pending_vaccines, overdue_vaccines, total_payments, total_revenue)
  VALUES (v_date, v_total_users, v_total_babies, v_total_schedules, v_completed, v_pending, v_overdue, v_total_payments, v_total_revenue)
  ON CONFLICT (metric_date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_babies = EXCLUDED.total_babies,
    total_vaccine_schedules = EXCLUDED.total_vaccine_schedules,
    completed_vaccines = EXCLUDED.completed_vaccines,
    pending_vaccines = EXCLUDED.pending_vaccines,
    overdue_vaccines = EXCLUDED.overdue_vaccines,
    total_payments = EXCLUDED.total_payments,
    total_revenue = EXCLUDED.total_revenue;

  -- Notification metrics
  SELECT count(*) INTO v_jobs_created FROM notification_jobs WHERE created_at::date = v_date;
  SELECT count(*) INTO v_jobs_sent FROM notification_jobs WHERE status = 'sent' AND sent_at::date = v_date;
  SELECT count(*) INTO v_jobs_failed FROM notification_jobs WHERE status = 'failed' AND created_at::date = v_date;
  SELECT count(*) INTO v_jobs_retried FROM notification_jobs WHERE retry_count > 0 AND created_at::date = v_date;

  INSERT INTO notification_metrics (date, jobs_created, jobs_sent, jobs_failed, jobs_retried)
  VALUES (v_date, v_jobs_created, v_jobs_sent, v_jobs_failed, v_jobs_retried)
  ON CONFLICT (date) DO UPDATE SET
    jobs_created = EXCLUDED.jobs_created,
    jobs_sent = EXCLUDED.jobs_sent,
    jobs_failed = EXCLUDED.jobs_failed,
    jobs_retried = EXCLUDED.jobs_retried;
END;
$$;
