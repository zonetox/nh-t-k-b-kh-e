
CREATE OR REPLACE FUNCTION public.undo_vaccine_completion(p_schedule_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_history_id uuid;
  v_scheduled_date date;
  v_new_status text;
  v_user_id uuid;
BEGIN
  -- Verify ownership
  SELECT b.user_id INTO v_user_id
  FROM vaccine_schedules vs
  JOIN babies b ON b.id = vs.baby_id
  WHERE vs.id = p_schedule_id AND vs.status = 'done';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Schedule not found or not in done status';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get history id
  SELECT id INTO v_history_id
  FROM vaccine_history
  WHERE schedule_id = p_schedule_id;

  IF v_history_id IS NULL THEN
    RAISE EXCEPTION 'No history record found for this schedule';
  END IF;

  -- Delete images first (referential integrity)
  DELETE FROM vaccine_history_images WHERE history_id = v_history_id;

  -- Delete history
  DELETE FROM vaccine_history WHERE id = v_history_id;

  -- Recalculate status based on scheduled_date
  SELECT scheduled_date INTO v_scheduled_date
  FROM vaccine_schedules WHERE id = p_schedule_id;

  IF v_scheduled_date < CURRENT_DATE THEN
    v_new_status := 'overdue';
  ELSIF v_scheduled_date <= CURRENT_DATE + INTERVAL '7 days' THEN
    v_new_status := 'upcoming';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update schedule status
  UPDATE vaccine_schedules
  SET status = v_new_status, updated_at = now()
  WHERE id = p_schedule_id;
END;
$function$;
