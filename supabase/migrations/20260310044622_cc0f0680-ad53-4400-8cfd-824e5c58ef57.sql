
-- Protect approve_payment_transaction with role check
CREATE OR REPLACE FUNCTION public.approve_payment_transaction(
  p_payment_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment RECORD;
  v_baby_id uuid;
  v_start_date date;
  v_end_date date;
BEGIN
  -- Role check
  IF NOT (has_role(p_admin_id, 'super_admin') OR has_role(p_admin_id, 'finance_admin')) THEN
    RAISE EXCEPTION 'Unauthorized admin action';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment IS NULL THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF v_payment.status != 'pending' THEN RAISE EXCEPTION 'Payment is not pending (current: %)', v_payment.status; END IF;

  UPDATE payments SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_admin_id, admin_notes = p_admin_notes WHERE id = p_payment_id;

  v_start_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '1 year';
  FOREACH v_baby_id IN ARRAY v_payment.baby_ids LOOP
    INSERT INTO subscriptions (user_id, baby_id, type, status, start_date, end_date)
    VALUES (v_payment.user_id, v_baby_id, 'annual', 'active', v_start_date, v_end_date);
  END LOOP;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (p_admin_id, 'approve_payment', 'payments', p_payment_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'approved', 'baby_count', array_length(v_payment.baby_ids, 1)));
END;
$$;

-- Protect soft_delete_vaccine with role check
CREATE OR REPLACE FUNCTION public.soft_delete_vaccine(p_vaccine_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule_count integer;
BEGIN
  -- Role check
  IF NOT (has_role(p_admin_id, 'super_admin') OR has_role(p_admin_id, 'medical_admin')) THEN
    RAISE EXCEPTION 'Unauthorized admin action';
  END IF;

  SELECT count(*) INTO v_schedule_count FROM vaccine_schedules WHERE vaccine_id = p_vaccine_id AND status NOT IN ('done', 'skipped');
  IF v_schedule_count > 0 THEN RAISE EXCEPTION 'Cannot delete vaccine: % active schedules exist', v_schedule_count; END IF;

  UPDATE vaccines SET deleted_at = now(), is_active = false WHERE id = p_vaccine_id;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (p_admin_id, 'soft_delete_vaccine', 'vaccines', p_vaccine_id,
    jsonb_build_object('deleted_at', null), jsonb_build_object('deleted_at', now()::text));
END;
$$;
