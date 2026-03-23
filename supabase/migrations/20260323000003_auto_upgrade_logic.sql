-- 1. Tạo bucket 'receipts' cho ảnh minh chứng chuyển khoản
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Thiết lập RLS cho bucket 'receipts'
DROP POLICY IF EXISTS "Public Access Receipts" ON storage.objects;
CREATE POLICY "Public Access Receipts" ON storage.objects
    FOR SELECT USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can upload own receipt" ON storage.objects;
CREATE POLICY "Users can upload own receipt" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'receipts' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Tạo hàm RPC để yêu cầu nâng cấp tự động
CREATE OR REPLACE FUNCTION public.request_auto_upgrade(
    p_amount integer,
    p_proof_url text,
    p_baby_ids uuid[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập';
    END IF;

    -- 1. Ghi nhận vào bảng payments (trạng thái chờ duyệt nhưng auto-activate)
    INSERT INTO public.payments (
        user_id,
        baby_ids,
        amount,
        proof_image_url,
        status,
        admin_notes
    ) VALUES (
        v_user_id,
        p_baby_ids,
        p_amount,
        p_proof_url,
        'pending',
        'Auto-activated by user request. Pending admin verification.'
    );

    -- 2. Kích hoạt Premium ngay lập tức cho người dùng
    UPDATE public.profiles 
    SET 
        is_premium = TRUE,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- 3. (Tùy chọn) Ghi log
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (v_user_id, 'auto_upgrade_request', 'profiles', v_user_id, jsonb_build_object('is_premium', true));
END;
$$;
