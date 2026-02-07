-- Function to auto-generate vaccine schedules for a baby based on DOB
CREATE OR REPLACE FUNCTION public.generate_vaccine_schedules_for_baby(p_baby_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_baby_dob DATE;
    v_count INTEGER := 0;
    v_rule RECORD;
BEGIN
    -- Get baby's DOB
    SELECT dob INTO v_baby_dob
    FROM public.babies
    WHERE id = p_baby_id AND deleted_at IS NULL;
    
    IF v_baby_dob IS NULL THEN
        RAISE EXCEPTION 'Baby not found or deleted';
    END IF;
    
    -- Generate schedules from active dose rules
    FOR v_rule IN
        SELECT vdr.id as rule_id, vdr.vaccine_id, vdr.dose_number, vdr.recommended_age_days
        FROM public.vaccine_dose_rules vdr
        JOIN public.vaccines v ON v.id = vdr.vaccine_id
        WHERE vdr.is_active = TRUE AND v.is_active = TRUE
        ORDER BY vdr.recommended_age_days, vdr.dose_number
    LOOP
        -- Insert schedule for each dose
        INSERT INTO public.vaccine_schedules (
            baby_id,
            vaccine_id,
            dose_number,
            scheduled_date,
            status,
            generated_from_rule_id,
            is_manual
        ) VALUES (
            p_baby_id,
            v_rule.vaccine_id,
            v_rule.dose_number,
            v_baby_dob + (v_rule.recommended_age_days || ' days')::INTERVAL,
            'pending',
            v_rule.rule_id,
            FALSE
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;

-- Trigger to auto-generate schedules when baby is created
CREATE OR REPLACE FUNCTION public.trigger_generate_baby_schedules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.generate_vaccine_schedules_for_baby(NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger on babies table
DROP TRIGGER IF EXISTS trg_generate_schedules_on_baby_insert ON public.babies;
CREATE TRIGGER trg_generate_schedules_on_baby_insert
    AFTER INSERT ON public.babies
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_baby_schedules();

-- Function to update vaccine schedule statuses based on current date
CREATE OR REPLACE FUNCTION public.update_vaccine_schedule_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    -- Update pending to upcoming (within 14 days)
    UPDATE public.vaccine_schedules
    SET status = 'upcoming', updated_at = NOW()
    WHERE status = 'pending'
      AND scheduled_date <= CURRENT_DATE + INTERVAL '14 days'
      AND scheduled_date >= CURRENT_DATE;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Update pending/upcoming to overdue (past due)
    UPDATE public.vaccine_schedules
    SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('pending', 'upcoming')
      AND scheduled_date < CURRENT_DATE;
    
    RETURN v_updated;
END;
$$;

-- Add unique constraint to prevent duplicate schedules
ALTER TABLE public.vaccine_schedules 
ADD CONSTRAINT unique_baby_vaccine_dose 
UNIQUE (baby_id, vaccine_id, dose_number);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vaccine_schedules_baby_status 
ON public.vaccine_schedules(baby_id, status, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_vaccine_schedules_scheduled_date 
ON public.vaccine_schedules(scheduled_date, status);