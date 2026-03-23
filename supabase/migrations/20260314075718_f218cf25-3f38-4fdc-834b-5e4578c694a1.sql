
-- 1. Add is_catchup column to vaccine_schedules
ALTER TABLE public.vaccine_schedules ADD COLUMN IF NOT EXISTS is_catchup boolean DEFAULT false;

-- 2. Create get_next_vaccine function
CREATE OR REPLACE FUNCTION public.get_next_vaccine(p_baby_id uuid)
RETURNS TABLE(
  schedule_id uuid,
  vaccine_name varchar,
  vaccine_code text,
  dose_number smallint,
  scheduled_date date,
  days_until_due integer,
  is_overdue boolean,
  overdue_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    vs.id as schedule_id,
    v.name as vaccine_name,
    v.code as vaccine_code,
    vs.dose_number,
    vs.scheduled_date,
    (vs.scheduled_date - CURRENT_DATE)::integer as days_until_due,
    vs.scheduled_date < CURRENT_DATE as is_overdue,
    GREATEST(0, (CURRENT_DATE - vs.scheduled_date)::integer) as overdue_days
  FROM vaccine_schedules vs
  JOIN vaccines v ON v.id = vs.vaccine_id
  WHERE vs.baby_id = p_baby_id
    AND vs.status IN ('pending', 'upcoming', 'overdue')
  ORDER BY vs.scheduled_date ASC
  LIMIT 1;
$$;

-- 3. Create get_upcoming_vaccines function
CREATE OR REPLACE FUNCTION public.get_upcoming_vaccines(p_baby_id uuid, p_days_ahead integer DEFAULT 30)
RETURNS TABLE(
  schedule_id uuid,
  vaccine_name varchar,
  vaccine_code text,
  dose_number smallint,
  scheduled_date date,
  days_until_due integer,
  status varchar,
  is_overdue boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    vs.id as schedule_id,
    v.name as vaccine_name,
    v.code as vaccine_code,
    vs.dose_number,
    vs.scheduled_date,
    (vs.scheduled_date - CURRENT_DATE)::integer as days_until_due,
    vs.status,
    vs.scheduled_date < CURRENT_DATE as is_overdue
  FROM vaccine_schedules vs
  JOIN vaccines v ON v.id = vs.vaccine_id
  WHERE vs.baby_id = p_baby_id
    AND vs.status IN ('pending', 'upcoming', 'overdue')
    AND vs.scheduled_date <= CURRENT_DATE + (p_days_ahead || ' days')::interval
  ORDER BY vs.scheduled_date ASC;
$$;

-- 4. Create baby_vaccine_status view
CREATE OR REPLACE VIEW public.baby_vaccine_status AS
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

-- 5. Create recalculate_future_doses function
CREATE OR REPLACE FUNCTION public.recalculate_future_doses(p_schedule_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule RECORD;
  v_completed_date date;
  v_vaccine_id uuid;
  v_baby_id uuid;
  v_dose_number smallint;
  v_next_rule RECORD;
  v_new_date date;
  v_updated integer := 0;
BEGIN
  -- Get the completed schedule info
  SELECT vs.vaccine_id, vs.baby_id, vs.dose_number, vs.status,
         vh.injected_date
  INTO v_schedule
  FROM vaccine_schedules vs
  LEFT JOIN vaccine_history vh ON vh.schedule_id = vs.id
  WHERE vs.id = p_schedule_id;

  IF v_schedule IS NULL OR v_schedule.status != 'done' THEN
    RETURN 0;
  END IF;

  v_completed_date := v_schedule.injected_date;
  v_vaccine_id := v_schedule.vaccine_id;
  v_baby_id := v_schedule.baby_id;
  v_dose_number := v_schedule.dose_number;

  IF v_completed_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Find next dose rules for same vaccine with higher dose numbers
  FOR v_next_rule IN
    SELECT vdr.dose_number, vdr.min_interval_days, vdr.recommended_age_days
    FROM vaccine_dose_rules vdr
    WHERE vdr.vaccine_id = v_vaccine_id
      AND vdr.dose_number > v_dose_number
      AND vdr.is_active = true
    ORDER BY vdr.dose_number ASC
  LOOP
    -- Calculate new date based on interval from completed dose
    IF v_next_rule.min_interval_days IS NOT NULL THEN
      v_new_date := v_completed_date + (v_next_rule.min_interval_days || ' days')::interval;
      
      -- Also check recommended_age minimum from DOB
      DECLARE
        v_dob date;
        v_age_date date;
      BEGIN
        SELECT dob INTO v_dob FROM babies WHERE id = v_baby_id;
        v_age_date := v_dob + (v_next_rule.recommended_age_days || ' days')::interval;
        -- Use the later of interval-based or age-based date
        IF v_age_date > v_new_date THEN
          v_new_date := v_age_date;
        END IF;
      END;

      -- Only update pending/upcoming/overdue schedules that are NOT custom
      UPDATE vaccine_schedules
      SET scheduled_date = v_new_date,
          status = CASE
            WHEN v_new_date < CURRENT_DATE THEN 'overdue'
            WHEN v_new_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
            ELSE 'pending'
          END,
          is_catchup = true,
          updated_at = now()
      WHERE baby_id = v_baby_id
        AND vaccine_id = v_vaccine_id
        AND dose_number = v_next_rule.dose_number
        AND status IN ('pending', 'upcoming', 'overdue')
        AND is_manual = false;

      IF FOUND THEN
        v_updated := v_updated + 1;
        -- Update completed_date for chaining next doses
        v_completed_date := v_new_date;
      END IF;
    END IF;
  END LOOP;

  RETURN v_updated;
END;
$$;

-- 6. Create trigger to auto-recalculate when vaccine is completed
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    PERFORM recalculate_future_doses(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_on_completion ON vaccine_schedules;
CREATE TRIGGER trg_recalculate_on_completion
  AFTER UPDATE ON vaccine_schedules
  FOR EACH ROW
  WHEN (NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done')
  EXECUTE FUNCTION trigger_recalculate_on_completion();
