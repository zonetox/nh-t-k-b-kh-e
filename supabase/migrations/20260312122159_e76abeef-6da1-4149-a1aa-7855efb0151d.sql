
-- Rate-limited error insert function
CREATE OR REPLACE FUNCTION public.insert_system_error(
  p_error_type text,
  p_error_message text,
  p_source text,
  p_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM system_errors
  WHERE created_at > now() - interval '1 hour';

  IF v_count >= 100 THEN
    RETURN;
  END IF;

  INSERT INTO system_errors (error_type, error_message, source, user_id, metadata)
  VALUES (p_error_type, p_error_message, p_source, p_user_id, p_metadata);
END;
$$;

-- Export RPCs with super_admin role check

CREATE OR REPLACE FUNCTION public.export_users()
RETURNS TABLE(id uuid, phone varchar, display_name varchar, is_active boolean, created_at timestamptz, last_login_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized export access';
  END IF;
  RETURN QUERY SELECT p.id, p.phone, p.display_name, p.is_active, p.created_at, p.last_login_at
    FROM profiles p WHERE p.deleted_at IS NULL ORDER BY p.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_babies()
RETURNS TABLE(id uuid, name varchar, dob date, gender varchar, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized export access';
  END IF;
  RETURN QUERY SELECT b.id, b.name, b.dob, b.gender, b.created_at
    FROM babies b WHERE b.deleted_at IS NULL ORDER BY b.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_vaccinations()
RETURNS TABLE(id uuid, baby_id uuid, vaccine_id uuid, dose_number smallint, scheduled_date date, status varchar)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized export access';
  END IF;
  RETURN QUERY SELECT vs.id, vs.baby_id, vs.vaccine_id, vs.dose_number, vs.scheduled_date, vs.status
    FROM vaccine_schedules vs ORDER BY vs.scheduled_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_payments()
RETURNS TABLE(id uuid, user_id uuid, amount integer, status varchar, created_at timestamptz, reviewed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized export access';
  END IF;
  RETURN QUERY SELECT p.id, p.user_id, p.amount, p.status, p.created_at, p.reviewed_at
    FROM payments p ORDER BY p.created_at;
END;
$$;
