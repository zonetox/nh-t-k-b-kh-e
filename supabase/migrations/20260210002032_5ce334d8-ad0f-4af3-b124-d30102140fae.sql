
-- 1. notification_settings (user preferences)
CREATE TABLE public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enable_push BOOLEAN NOT NULL DEFAULT true,
  enable_email BOOLEAN NOT NULL DEFAULT false,
  enable_zalo BOOLEAN NOT NULL DEFAULT false,
  quiet_start TIME NOT NULL DEFAULT '21:00',
  quiet_end TIME NOT NULL DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. notification_jobs (job queue)
CREATE TABLE public.notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  baby_id UUID NOT NULL REFERENCES public.babies(id),
  schedule_id UUID NOT NULL REFERENCES public.vaccine_schedules(id),
  notify_type TEXT NOT NULL, -- T7, T3, T1, T0, OVERDUE3, OVERDUE7, MONTHLY
  channel TEXT NOT NULL DEFAULT 'inapp', -- inapp, push, email, zalo
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, notify_type, channel)
);

CREATE INDEX idx_notification_jobs_pending ON public.notification_jobs(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_notification_jobs_user ON public.notification_jobs(user_id);

ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.notification_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- 3. notifications (in-app inbox)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  job_id UUID REFERENCES public.notification_jobs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. notification_failures (dead letter queue)
CREATE TABLE public.notification_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.notification_jobs(id),
  error_message TEXT NOT NULL,
  failed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.notification_failures
  FOR SELECT USING (false);

-- 5. Job generation function
CREATE OR REPLACE FUNCTION public.generate_notification_jobs_for_schedule(
  p_schedule_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule RECORD;
  v_count INTEGER := 0;
  v_notify_types TEXT[] := ARRAY['T7','T3','T1','T0'];
  v_offsets INTEGER[] := ARRAY[-7,-3,-1,0];
  v_type TEXT;
  v_offset INTEGER;
  v_scheduled_at TIMESTAMPTZ;
  i INTEGER;
BEGIN
  SELECT vs.id, vs.baby_id, vs.scheduled_date, vs.status, b.user_id
  INTO v_schedule
  FROM vaccine_schedules vs
  JOIN babies b ON b.id = vs.baby_id
  WHERE vs.id = p_schedule_id;

  IF v_schedule IS NULL THEN RETURN 0; END IF;
  IF v_schedule.status IN ('done', 'skipped') THEN RETURN 0; END IF;

  FOR i IN 1..array_length(v_notify_types, 1) LOOP
    v_type := v_notify_types[i];
    v_offset := v_offsets[i];
    v_scheduled_at := (v_schedule.scheduled_date + (v_offset || ' days')::INTERVAL)::DATE + TIME '08:00';
    
    -- Skip if in the past
    IF v_scheduled_at <= NOW() THEN CONTINUE; END IF;

    INSERT INTO notification_jobs (user_id, baby_id, schedule_id, notify_type, channel, scheduled_at)
    VALUES (v_schedule.user_id, v_schedule.baby_id, p_schedule_id, v_type, 'inapp', v_scheduled_at)
    ON CONFLICT (schedule_id, notify_type, channel) DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 6. Trigger: auto-generate jobs when schedule is inserted
CREATE OR REPLACE FUNCTION public.trigger_generate_notification_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM generate_notification_jobs_for_schedule(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_notification_jobs
  AFTER INSERT ON public.vaccine_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_notification_jobs();

-- 7. Cancel jobs when schedule marked done/skipped
CREATE OR REPLACE FUNCTION public.trigger_cancel_notification_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('done', 'skipped') AND OLD.status NOT IN ('done', 'skipped') THEN
    UPDATE notification_jobs
    SET status = 'cancelled'
    WHERE schedule_id = NEW.id AND status = 'pending';
  END IF;
  
  -- Generate overdue jobs if status changed to overdue
  IF NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
    DECLARE
      v_user_id UUID;
      v_sched_at TIMESTAMPTZ;
    BEGIN
      SELECT b.user_id INTO v_user_id FROM babies b WHERE b.id = NEW.baby_id;
      
      -- OVERDUE3
      v_sched_at := (NEW.scheduled_date + INTERVAL '3 days')::DATE + TIME '08:00';
      IF v_sched_at > NOW() THEN
        INSERT INTO notification_jobs (user_id, baby_id, schedule_id, notify_type, channel, scheduled_at)
        VALUES (v_user_id, NEW.baby_id, NEW.id, 'OVERDUE3', 'inapp', v_sched_at)
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- OVERDUE7
      v_sched_at := (NEW.scheduled_date + INTERVAL '7 days')::DATE + TIME '08:00';
      IF v_sched_at > NOW() THEN
        INSERT INTO notification_jobs (user_id, baby_id, schedule_id, notify_type, channel, scheduled_at)
        VALUES (v_user_id, NEW.baby_id, NEW.id, 'OVERDUE7', 'inapp', v_sched_at)
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cancel_notification_jobs
  AFTER UPDATE ON public.vaccine_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cancel_notification_jobs();

-- 8. Generate jobs for existing schedules
DO $$
DECLARE
  v_schedule RECORD;
BEGIN
  FOR v_schedule IN SELECT id FROM vaccine_schedules WHERE status NOT IN ('done', 'skipped') LOOP
    PERFORM generate_notification_jobs_for_schedule(v_schedule.id);
  END LOOP;
END;
$$;
