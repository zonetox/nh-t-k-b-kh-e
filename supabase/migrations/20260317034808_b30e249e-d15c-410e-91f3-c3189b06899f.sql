
-- 1. Validation trigger: prevent scheduled_date < baby.dob
CREATE OR REPLACE FUNCTION public.validate_schedule_date()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
DECLARE
  v_dob date;
BEGIN
  SELECT dob INTO v_dob FROM babies WHERE id = NEW.baby_id;
  
  IF v_dob IS NOT NULL AND NEW.scheduled_date < v_dob THEN
    RAISE EXCEPTION 'scheduled_date (%) cannot be before baby birth date (%)', NEW.scheduled_date, v_dob;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_schedule_date
  BEFORE INSERT OR UPDATE ON public.vaccine_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_schedule_date();

-- 2. Update generate function to add GREATEST(dob, calculated_date) safety
CREATE OR REPLACE FUNCTION public.generate_vaccine_schedules_for_baby(p_baby_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_baby_dob DATE;
    v_count INTEGER := 0;
    v_rule RECORD;
    v_scheduled_date DATE;
BEGIN
    SELECT dob INTO v_baby_dob
    FROM public.babies
    WHERE id = p_baby_id AND deleted_at IS NULL;
    
    IF v_baby_dob IS NULL THEN
        RAISE EXCEPTION 'Baby not found or deleted';
    END IF;
    
    FOR v_rule IN
        SELECT vdr.id as rule_id, vdr.vaccine_id, vdr.dose_number, vdr.recommended_age_days
        FROM public.vaccine_dose_rules vdr
        JOIN public.vaccines v ON v.id = vdr.vaccine_id
        WHERE vdr.is_active = TRUE AND v.is_active = TRUE AND v.deleted_at IS NULL
        ORDER BY vdr.recommended_age_days, vdr.dose_number
    LOOP
        v_scheduled_date := GREATEST(v_baby_dob, v_baby_dob + (v_rule.recommended_age_days || ' days')::INTERVAL);
        
        INSERT INTO public.vaccine_schedules (
            baby_id, vaccine_id, dose_number, scheduled_date,
            status, generated_from_rule_id, is_manual
        ) VALUES (
            p_baby_id, v_rule.vaccine_id, v_rule.dose_number,
            v_scheduled_date, 'pending', v_rule.rule_id, FALSE
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;
