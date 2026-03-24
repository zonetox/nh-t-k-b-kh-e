-- 20260324000002_add_missing_and_optional_vaccines.sql
-- Thêm các vắc xin tham khảo phụ trợ và cập nhật mũi Tả, Thương hàn vào TCMR.

DO $$
DECLARE
  v_rota_id uuid;
  v_6in1_id uuid;
  v_phecau_id uuid;
  v_cum_id uuid;
  v_thuydau_id uuid;
  v_mmr_id uuid;
  v_vg_a_id uuid;
  v_hpv_id uuid;
  v_naomocau_id uuid;
  v_dai_id uuid;
  v_ta_id uuid;
  v_thuonghan_id uuid;
BEGIN
  -- ==========================================
  -- CÁC MŨI THUỘC TIÊM CHỦNG MỞ RỘNG (BỔ SUNG)
  -- ==========================================
  
  -- 10. Thuộc TCMR: Tả
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Phòng bệnh tả (đường uống)', 'Tả', 'standard', 2, 'Dành cho trẻ em vùng có nguy cơ dịch tả', true, 'CHOLERA')
  RETURNING id INTO v_ta_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_ta_id, 1, 730, 730, NULL),
    (v_ta_id, 2, 744, 744, 14);

  -- 11. Thuộc TCMR: Thương hàn
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Phòng Thương hàn', 'Thương hàn', 'standard', 1, 'Tiêm 1 liều cho trẻ từ 3 đến 10 tuổi ở vùng dịch', true, 'TYPHOID')
  RETURNING id INTO v_thuonghan_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_thuonghan_id, 1, 1095, 1095, NULL);

  -- ==========================================
  -- CÁC MŨI DỊCH VỤ (KHÔNG BẮT BUỘC)
  -- ==========================================
  
  -- 1. Tiêu chảy cấp Rotavirus (uống)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Tiêu chảy do rotavirus (dịch vụ)', 'Rotavirus', 'optional', 2, 'Vắc xin uống, 2 hoặc 3 liều tuỳ loại, dành cho trẻ nhỏ.', false, 'ROTAVIRUS')
  RETURNING id INTO v_rota_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_rota_id, 1, 42, 60, NULL),
    (v_rota_id, 2, 70, 90, 28);

  -- 2. 6 trong 1 (Dịch vụ thay thế 5 trong 1)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('6 trong 1 (dịch vụ)', '6-in-1', 'optional', 3, 'Ngừa Bạch hầu, ho gà, uốn ván, bại liệt, viêm gan B, Hib (Hexaxim/Infanrix Hexa)', false, '6IN1')
  RETURNING id INTO v_6in1_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_6in1_id, 1, 60, 60, NULL),
    (v_6in1_id, 2, 90, 90, 28),
    (v_6in1_id, 3, 120, 120, 28);

  -- 3. Phế cầu khuẩn
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Phế cầu (dịch vụ)', 'Phế Cầu', 'optional', 3, 'Viêm màng não, viêm tai giữa, viêm phổi do phế cầu (Prevenar 13/Synflorix)', false, 'PNEUMOCOCCAL')
  RETURNING id INTO v_phecau_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_phecau_id, 1, 42, 60, NULL),
    (v_phecau_id, 2, 70, 90, 28),
    (v_phecau_id, 3, 164, 180, 28);

  -- 4. Cúm mùa
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Cúm (dịch vụ)', 'Cúm', 'optional', 1, 'Ngừa cúm mùa (Vaxigrip/Influvac), nên nhắc lại mỗi năm', false, 'FLU')
  RETURNING id INTO v_cum_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_cum_id, 1, 180, 180, NULL);

  -- 5. Thủy đậu
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Thủy đậu (dịch vụ)', 'Thủy Đậu', 'optional', 2, 'Phòng bệnh thủy đậu (Varivax/Varilrix)', false, 'VARICELLA')
  RETURNING id INTO v_thuydau_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_thuydau_id, 1, 270, 365, NULL),
    (v_thuydau_id, 2, 730, 730, 90);

  -- 6. Viêm gan A
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Viêm gan A (dịch vụ)', 'Viêm gan A', 'optional', 2, 'Phòng bệnh viêm gan A (Avaxim/Twinrix)', false, 'HEPA')
  RETURNING id INTO v_vg_a_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_vg_a_id, 1, 365, 365, NULL),
    (v_vg_a_id, 2, 545, 545, 180);

  -- 7. Não mô cầu BC / ACWY
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Não mô cầu (dịch vụ)', 'Não mô cầu', 'service', 2, 'Phòng viêm màng não do não mô cầu (Mengoc BC, Menactra)', false, 'MENINGOCOCCAL')
  RETURNING id INTO v_naomocau_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_naomocau_id, 1, 180, 180, NULL),
    (v_naomocau_id, 2, 225, 225, 45);

  -- 8. HPV
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Ung thư cổ tử cung HPV', 'HPV', 'service', 2, 'Phòng các bệnh do vi rút HPV (Gardasil) cho bé từ 9 tuổi', false, 'HPV')
  RETURNING id INTO v_hpv_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_hpv_id, 1, 3285, 3285, NULL),
    (v_hpv_id, 2, 3465, 3465, 180);

END $$;
