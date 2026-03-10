
-- 2. Atomic payment approval RPC
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
  -- Lock and fetch payment
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  IF v_payment.status != 'pending' THEN
    RAISE EXCEPTION 'Payment is not pending (current: %)', v_payment.status;
  END IF;

  -- Update payment
  UPDATE payments SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_payment_id;

  -- Create subscriptions for each baby
  v_start_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '1 year';

  FOREACH v_baby_id IN ARRAY v_payment.baby_ids LOOP
    INSERT INTO subscriptions (user_id, baby_id, type, status, start_date, end_date)
    VALUES (v_payment.user_id, v_baby_id, 'annual', 'active', v_start_date, v_end_date);
  END LOOP;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (p_admin_id, 'approve_payment', 'payments', p_payment_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'approved', 'baby_count', array_length(v_payment.baby_ids, 1))
  );
END;
$$;

-- 3. Payment proof storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload their own proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can view their own proofs
CREATE POLICY "Users can view own payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR is_any_admin(auth.uid())
));

-- 4. Admin action rate limit table
CREATE TABLE public.admin_action_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_minute timestamp with time zone NOT NULL DEFAULT date_trunc('minute', now()),
  action_count integer NOT NULL DEFAULT 1,
  UNIQUE(admin_id, action_minute)
);

ALTER TABLE public.admin_action_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage own limits"
ON public.admin_action_limits FOR ALL
TO authenticated
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(p_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Upsert counter for current minute
  INSERT INTO admin_action_limits (admin_id, action_minute, action_count)
  VALUES (p_admin_id, date_trunc('minute', now()), 1)
  ON CONFLICT (admin_id, action_minute) 
  DO UPDATE SET action_count = admin_action_limits.action_count + 1
  RETURNING action_count INTO v_count;

  -- Clean old entries
  DELETE FROM admin_action_limits WHERE action_minute < now() - interval '5 minutes';

  RETURN v_count <= 30;
END;
$$;

-- 5. Vaccine soft delete column
ALTER TABLE public.vaccines ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Prevent delete of vaccines used in schedules
CREATE OR REPLACE FUNCTION public.soft_delete_vaccine(p_vaccine_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_schedule_count integer;
BEGIN
  -- Check if used in any schedule
  SELECT count(*) INTO v_schedule_count
  FROM vaccine_schedules
  WHERE vaccine_id = p_vaccine_id AND status NOT IN ('done', 'skipped');

  IF v_schedule_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete vaccine: % active schedules exist', v_schedule_count;
  END IF;

  UPDATE vaccines SET deleted_at = now(), is_active = false WHERE id = p_vaccine_id;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (p_admin_id, 'soft_delete_vaccine', 'vaccines', p_vaccine_id,
    jsonb_build_object('deleted_at', null),
    jsonb_build_object('deleted_at', now()::text)
  );
END;
$$;

-- 7. Dose rule validation trigger
CREATE OR REPLACE FUNCTION public.validate_dose_rule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_prev_dose integer;
BEGIN
  -- min_age_days <= recommended_age_days
  IF NEW.min_age_days > NEW.recommended_age_days THEN
    RAISE EXCEPTION 'min_age_days (%) must be <= recommended_age_days (%)', NEW.min_age_days, NEW.recommended_age_days;
  END IF;

  -- max_age_days >= recommended_age_days
  IF NEW.max_age_days IS NOT NULL AND NEW.max_age_days < NEW.recommended_age_days THEN
    RAISE EXCEPTION 'max_age_days (%) must be >= recommended_age_days (%)', NEW.max_age_days, NEW.recommended_age_days;
  END IF;

  -- dose_number must be sequential (1-based, no gaps for active rules)
  IF NEW.dose_number > 1 AND NEW.is_active = true THEN
    SELECT max(dose_number) INTO v_prev_dose
    FROM vaccine_dose_rules
    WHERE vaccine_id = NEW.vaccine_id AND is_active = true AND id != NEW.id;

    IF v_prev_dose IS NULL AND NEW.dose_number != 1 THEN
      RAISE EXCEPTION 'First dose must be dose_number 1, got %', NEW.dose_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_dose_rule
BEFORE INSERT OR UPDATE ON public.vaccine_dose_rules
FOR EACH ROW EXECUTE FUNCTION public.validate_dose_rule();
