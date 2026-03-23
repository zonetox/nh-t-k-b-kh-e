CREATE OR REPLACE FUNCTION public.get_next_vaccine(p_baby_id uuid)
 RETURNS TABLE(schedule_id uuid, vaccine_name character varying, vaccine_code text, dose_number smallint, scheduled_date date, days_until_due integer, is_overdue boolean, overdue_days integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ORDER BY
    CASE vs.status::text
      WHEN 'overdue' THEN 1
      WHEN 'upcoming' THEN 2
      WHEN 'pending' THEN 3
    END,
    vs.scheduled_date ASC
  LIMIT 1;
$function$;