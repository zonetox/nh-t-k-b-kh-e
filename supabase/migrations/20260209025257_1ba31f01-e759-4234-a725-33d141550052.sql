-- 1. Add UNIQUE constraint on schedule_id for vaccine_history
ALTER TABLE public.vaccine_history
ADD CONSTRAINT vaccine_history_schedule_id_unique UNIQUE (schedule_id);

-- 2. Add skipped_reason column to vaccine_schedules
ALTER TABLE public.vaccine_schedules
ADD COLUMN skipped_reason TEXT;

-- 3. Update the status engine function to use 7 days for upcoming (instead of 14)
CREATE OR REPLACE FUNCTION public.update_vaccine_schedule_statuses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    -- Update pending to upcoming (within 7 days)
    UPDATE public.vaccine_schedules
    SET status = 'upcoming', updated_at = NOW()
    WHERE status = 'pending'
      AND scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
      AND scheduled_date >= CURRENT_DATE;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Update pending/upcoming to overdue (past due)
    UPDATE public.vaccine_schedules
    SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('pending', 'upcoming')
      AND scheduled_date < CURRENT_DATE;
    
    RETURN v_updated;
END;
$function$;