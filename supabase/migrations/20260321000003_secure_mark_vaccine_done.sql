-- Migration: Thắt chặt bảo mật cho hàm mark_vaccine_done_atomic
-- Kiểm tra tính đúng đắn của đường dẫn ảnh (phải thuộc thư mục của user)

CREATE OR REPLACE FUNCTION public.mark_vaccine_done_atomic(
  p_schedule_id uuid,
  p_user_id uuid,
  p_injected_date date,
  p_batch_number text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_image_paths text[] DEFAULT ARRAY[]::text[]
)
RETURNS public.vaccine_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_baby_id uuid;
  v_history_record public.vaccine_history;
  v_image_path text;
BEGIN
  -- 1. Validate ownership: Schedule -> Baby -> User
  SELECT b.id INTO v_baby_id
  FROM public.vaccine_schedules vs
  JOIN public.babies b ON vs.baby_id = b.id
  WHERE vs.id = p_schedule_id AND b.user_id = p_user_id;

  IF v_baby_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: schedule does not belong to user or not found' USING ERRCODE = '42501';
  END IF;

  -- 2. Kiểm tra xem đã tiêm chưa (Tránh duplications)
  IF EXISTS (SELECT 1 FROM public.vaccine_history WHERE schedule_id = p_schedule_id) THEN
    RAISE EXCEPTION 'Conflict: Vaccine already marked as done' USING ERRCODE = '23505';
  END IF;

  -- 3. Insert vào vaccine_history
  INSERT INTO public.vaccine_history (
    schedule_id, 
    injected_date, 
    batch_number, 
    location, 
    notes
  )
  VALUES (
    p_schedule_id, 
    p_injected_date, 
    p_batch_number, 
    p_location, 
    p_notes
  )
  RETURNING * INTO v_history_record;

  -- 4. Insert ảnh minh chứng (Security validation for paths)
  IF p_image_paths IS NOT NULL AND array_length(p_image_paths, 1) > 0 THEN
    FOREACH v_image_path IN ARRAY p_image_paths LOOP
      -- Kiểm tra đường dẫn phải bắt đầu bằng userId/
      IF NOT (v_image_path LIKE p_user_id::text || '/%') THEN
        RAISE EXCEPTION 'Forbidden: image path % does not belong to user', v_image_path USING ERRCODE = '42501';
      END IF;

      INSERT INTO public.vaccine_history_images (history_id, image_url)
      VALUES (v_history_record.id, v_image_path);
    END LOOP;
  END IF;

  -- 5. Cập nhật trạng thái lịch tiêm
  UPDATE public.vaccine_schedules
  SET status = 'done',
      updated_at = NOW()
  WHERE id = p_schedule_id;

  RETURN v_history_record;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
