-- Enhance existing vaccine details and add optional vaccines
-- Cập nhật thông tin chi tiết và bổ sung vắc xin dịch vụ

-- 1. Update existing standard vaccines with better descriptions
UPDATE public.vaccines SET 
  description = 'Vắc xin phòng bệnh Lao. Giúp trẻ phòng ngừa các thể lao nặng như lao màng não, lao sơ nhiễm.',
  short_name = 'BCG'
WHERE code = 'BCG';

UPDATE public.vaccines SET 
  description = 'Phòng bệnh Viêm gan B. Giúp trẻ tránh lây nhiễm từ mẹ và giảm nguy cơ xơ gan, ung thư gan sau này.',
  short_name = 'VGB'
WHERE code = 'VGB';

UPDATE public.vaccines SET 
  description = 'Phòng 5 bệnh: Bạch hầu, Ho gà, Uốn ván, Viêm gan B và các bệnh viêm phổi/màng não do vi khuẩn Hib.',
  short_name = '5-trong-1'
WHERE code = 'DPT-VGB-HIB';

UPDATE public.vaccines SET 
  description = 'Vắc xin phòng bệnh Bại liệt đường uống (OPV). Giúp trẻ miễn dịch đối với các virus gây liệt chi.',
  short_name = 'Bại liệt uống'
WHERE code = 'OPV';

UPDATE public.vaccines SET 
  description = 'Vắc xin phòng bệnh Bại liệt đường tiêm (IPV). Cung cấp miễn dịch bổ sung và an toàn chống lại virus bại liệt.',
  short_name = 'Bại liệt tiêm'
WHERE code = 'IPV';

UPDATE public.vaccines SET 
  description = 'Vắc xin phòng bệnh Sởi đơn. Giúp trẻ tránh các biến chứng như viêm phổi, viêm não, tiêu chảy nặng do sởi.',
  short_name = 'Sởi'
WHERE code = 'MEASLES';

UPDATE public.vaccines SET 
  description = 'Vắc xin phòng bệnh Viêm não Nhật Bản. Cần thiết để phòng tránh di chứng thần kinh nặng nề.',
  short_name = 'VNNB'
WHERE code = 'JBE';

UPDATE public.vaccines SET 
  description = 'Vắc xin kết hợp phòng đồng thời 2 bệnh Sởi và Rubella (Sởi Đức).',
  short_name = 'Sởi-Rubella'
WHERE code = 'MR';

UPDATE public.vaccines SET 
  description = 'Vắc xin phòng 3 bệnh: Bạch hầu, Ho gà và Uốn ván (mũi nhắc lại).',
  short_name = 'DPT'
WHERE code = 'DPT';

-- 2. Add Optional Vaccines (Dịch vụ)
DO $$
DECLARE
  v_rota_id uuid;
  v_6in1_id uuid;
  v_pneumo_id uuid;
  v_flu_id uuid;
  v_mening_id uuid;
  v_hpv_id uuid;
BEGIN
  -- Rota virus
  IF NOT EXISTS (SELECT 1 FROM vaccines WHERE code = 'ROTA') THEN
    INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
    VALUES ('Vắc xin tiêu chảy cấp (Rota)', 'Rota', 'optional', 2, 'Phòng bệnh tiêu chảy cấp do vi-rút Rota gây ra ở trẻ nhỏ. Vắc xin dùng đường uống.', false, 'ROTA')
    RETURNING id INTO v_rota_id;

    INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
    VALUES 
      (v_rota_id, 1, 42, 60, NULL),
      (v_rota_id, 2, 70, 90, 28);
  END IF;

  -- 6 trong 1
  IF NOT EXISTS (SELECT 1 FROM vaccines WHERE code = '6IN1') THEN
    INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
    VALUES ('Vắc xin 6 trong 1 (Infanrix/Hexaxim)', '6-trong-1', 'optional', 4, 'Thay thế mũi 5-trong-1 và Bại liệt. Phòng 6 bệnh: Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B và Hib.', false, '6IN1')
    RETURNING id INTO v_6in1_id;

    INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
    VALUES 
      (v_6in1_id, 1, 60, 60, NULL),
      (v_6in1_id, 2, 90, 90, 28),
      (v_6in1_id, 3, 120, 120, 28),
      (v_6in1_id, 4, 540, 540, 365);
  END IF;

  -- Phế cầu
  IF NOT EXISTS (SELECT 1 FROM vaccines WHERE code = 'PCV') THEN
    INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
    VALUES ('Vắc xin Phế cầu (Synflorix/Prevenar 13)', 'Phế cầu', 'optional', 4, 'Phòng các bệnh viêm phổi, viêm tai giữa, viêm màng não do phế cầu khuẩn gây ra.', false, 'PCV')
    RETURNING id INTO v_pneumo_id;

    INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
    VALUES 
      (v_pneumo_id, 1, 60, 60, NULL),
      (v_pneumo_id, 2, 120, 120, 60),
      (v_pneumo_id, 3, 180, 180, 60),
      (v_pneumo_id, 4, 365, 365, 180);
  END IF;

  -- Cúm
  IF NOT EXISTS (SELECT 1 FROM vaccines WHERE code = 'FLU') THEN
    INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
    VALUES ('Vắc xin Cúm mùa', 'Cúm', 'optional', 2, 'Phòng bệnh cúm mùa. Trẻ từ 6 tháng cần tiêm 2 mũi cách nhau 1 tháng, sau đó nhắc lại hàng năm.', false, 'FLU')
    RETURNING id INTO v_flu_id;

    INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
    VALUES 
      (v_flu_id, 1, 180, 180, NULL),
      (v_flu_id, 2, 210, 210, 28);
  END IF;

END $$;
