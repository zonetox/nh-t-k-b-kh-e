-- Migration: add_trial_fields
-- Description: Thêm trường dùng thử và thành viên vào bảng profiles

-- 1. Cập nhật độ dài cột phone và thêm các trường dùng thử
ALTER TABLE public.profiles 
ALTER COLUMN phone TYPE VARCHAR(100),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- 2. Cập nhật hàm handle_new_user để xử lý phone từ email giả lập hoặc metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_phone TEXT;
BEGIN
    -- Ưu tiên lấy phone từ metadata, sau đó đến top-level phone, cuối cùng là xử lý từ email
    v_phone := COALESCE(
        (NEW.raw_user_meta_data->>'phone'),
        NEW.phone,
        SPLIT_PART(NEW.email, '@', 1) -- Lấy phần trước @ nếu là email giả lập
    );

    INSERT INTO public.profiles (id, phone, trial_ends_at, is_premium)
    VALUES (
        NEW.id, 
        v_phone,
        (NOW() + INTERVAL '30 days'),
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        trial_ends_at = EXCLUDED.trial_ends_at,
        is_premium = EXCLUDED.is_premium;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cập nhật RLS (nơi cho phép admin sửa profile user)
DROP POLICY IF EXISTS "Admins can update premium status" ON public.profiles;
CREATE POLICY "Admins can update premium status" ON public.profiles
    FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR has_role(auth.uid(), 'super_admin'))))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR has_role(auth.uid(), 'super_admin'))));

-- 4. Cập nhật hàm approve_payment_transaction để set is_premium = TRUE
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

  -- Cập nhật profile người dùng thành Premium
  UPDATE profiles SET is_premium = TRUE WHERE id = v_payment.user_id;

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
