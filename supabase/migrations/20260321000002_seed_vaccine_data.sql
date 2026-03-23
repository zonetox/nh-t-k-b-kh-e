-- Seed data for Vietnamese National Expanded Program on Immunization (TCMR)
-- Dữ liệu lịch tiêm chủng mở rộng Việt Nam

DO $$
DECLARE
  v_bcg_id uuid;
  v_vgb_id uuid;
  v_5in1_id uuid;
  v_opv_id uuid;
  v_ipv_id uuid;
  v_measles_id uuid;
  v_mr_id uuid;
  v_jbev_id uuid;
  v_dpt_id uuid;
BEGIN
  -- 1. Lao (BCG)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Vắc xin phòng Lao', 'BCG', 'standard', 1, 'Tiêm càng sớm càng tốt sau khi sinh', true, 'BCG')
  RETURNING id INTO v_bcg_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, notes)
  VALUES (v_bcg_id, 1, 0, 1, 'Tiêm trong vòng 24h sau sinh');

  -- 2. Viêm gan B (VGB)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Viêm gan B', 'VGB', 'standard', 1, 'Sơ sinh trong 24h đầu', true, 'VGB')
  RETURNING id INTO v_vgb_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, notes)
  VALUES (v_vgb_id, 1, 0, 1, 'Mũi 0 sơ sinh');

  -- 3. 5 trong 1 (DPT-VGB-Hib) - ComBE Five / SII
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('5 trong 1 (DPT-VGB-Hib)', '5-in-1', 'standard', 3, 'Bạch hầu, ho gà, uốn ván, viêm gan B, Hib', true, 'DPT-VGB-HIB')
  RETURNING id INTO v_5in1_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_5in1_id, 1, 60, 60, NULL),
    (v_5in1_id, 2, 90, 90, 28),
    (v_5in1_id, 3, 120, 120, 28);

  -- 4. Bại liệt uống (OPV)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Bại liệt uống', 'OPV', 'standard', 3, 'Vắc xin bại liệt đường uống', true, 'OPV')
  RETURNING id INTO v_opv_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_opv_id, 1, 60, 60, NULL),
    (v_opv_id, 2, 90, 90, 28),
    (v_opv_id, 3, 120, 120, 28);

  -- 5. Bại liệt tiêm (IPV)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Bại liệt tiêm', 'IPV', 'standard', 2, 'Vắc xin bại liệt đường tiêm', true, 'IPV')
  RETURNING id INTO v_ipv_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_ipv_id, 1, 150, 150, NULL),
    (v_ipv_id, 2, 270, 270, 90);

  -- 6. Sởi
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Sởi đơn', 'Sởi', 'standard', 1, 'Phòng bệnh sởi', true, 'MEASLES')
  RETURNING id INTO v_measles_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days)
  VALUES (v_measles_id, 1, 270, 275);

  -- 7. Viêm não Nhật Bản
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Viêm não Nhật Bản', 'VNNB', 'standard', 3, 'Phòng bệnh viêm não Nhật Bản', true, 'JBE')
  RETURNING id INTO v_jbev_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days, min_interval_days)
  VALUES 
    (v_jbev_id, 1, 365, 365, NULL),
    (v_jbev_id, 2, 372, 372, 7),
    (v_jbev_id, 3, 730, 730, 365);

  -- 8. Sởi-Rubella (MR)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Sởi - Rubella', 'MR', 'standard', 1, 'Phòng bệnh sởi và rubella', true, 'MR')
  RETURNING id INTO v_mr_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days)
  VALUES (v_mr_id, 1, 540, 540);

  -- 9. Bạch hầu - Ho gà - Uốn ván (DPT)
  INSERT INTO public.vaccines (name, short_name, type, total_doses, description, is_mandatory, code)
  VALUES ('Bạch hầu-Ho gà-Uốn ván', 'DPT', 'standard', 1, 'Mũi nhắc lại (mũi 4)', true, 'DPT')
  RETURNING id INTO v_dpt_id;

  INSERT INTO public.vaccine_dose_rules (vaccine_id, dose_number, min_age_days, recommended_age_days)
  VALUES (v_dpt_id, 1, 540, 540);

END $$;
