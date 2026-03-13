
-- 1. Create vaccination-certificates storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vaccination-certificates', 'vaccination-certificates', false, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for vaccination-certificates bucket
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vaccination-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vaccination-certificates'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_any_admin(auth.uid())
  )
);

CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vaccination-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Create system-backups storage bucket (admin only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-backups', 'system-backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Only admins can access backups"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'system-backups'
  AND is_any_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'system-backups'
  AND is_any_admin(auth.uid())
);

-- 3. Audit trigger for baby creation/deletion
CREATE OR REPLACE FUNCTION public.audit_baby_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.user_id, 'baby_created', 'babies', NEW.id,
      jsonb_build_object('name', NEW.name, 'dob', NEW.dob));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Soft delete detection
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
      VALUES (NEW.user_id, 'baby_deleted', 'babies', NEW.id,
        jsonb_build_object('name', OLD.name));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_baby_changes
AFTER INSERT OR UPDATE ON babies
FOR EACH ROW EXECUTE FUNCTION audit_baby_changes();

-- 4. Audit trigger for vaccine schedule modifications
CREATE OR REPLACE FUNCTION public.audit_schedule_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM babies WHERE id = NEW.baby_id;
  
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (v_user_id, 'schedule_modified', 'vaccine_schedules', NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_schedule_changes
AFTER UPDATE ON vaccine_schedules
FOR EACH ROW EXECUTE FUNCTION audit_schedule_changes();

-- 5. Data integrity check function
CREATE OR REPLACE FUNCTION public.check_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orphan_schedules integer;
  v_invalid_vaccines integer;
  v_result jsonb;
BEGIN
  -- Check orphaned schedules (baby deleted)
  SELECT count(*) INTO v_orphan_schedules
  FROM vaccine_schedules vs
  WHERE NOT EXISTS (SELECT 1 FROM babies b WHERE b.id = vs.baby_id AND b.deleted_at IS NULL);

  -- Check invalid vaccine references
  SELECT count(*) INTO v_invalid_vaccines
  FROM vaccine_schedules vs
  WHERE NOT EXISTS (SELECT 1 FROM vaccines v WHERE v.id = vs.vaccine_id);

  v_result := jsonb_build_object(
    'orphan_schedules', v_orphan_schedules,
    'invalid_vaccine_refs', v_invalid_vaccines,
    'checked_at', now()
  );

  -- Log errors if found
  IF v_orphan_schedules > 0 THEN
    PERFORM insert_system_error('data_integrity', 
      format('%s orphaned vaccine schedules found', v_orphan_schedules),
      'integrity_check', NULL, v_result);
  END IF;

  IF v_invalid_vaccines > 0 THEN
    PERFORM insert_system_error('data_integrity',
      format('%s invalid vaccine references found', v_invalid_vaccines),
      'integrity_check', NULL, v_result);
  END IF;

  RETURN v_result;
END;
$$;

-- 6. Notification per-schedule limit (max 5)
CREATE OR REPLACE FUNCTION public.enforce_notification_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM notification_jobs
  WHERE schedule_id = NEW.schedule_id AND status != 'cancelled';

  IF v_count >= 5 THEN
    RETURN NULL; -- silently reject
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_notification_limit
BEFORE INSERT ON notification_jobs
FOR EACH ROW EXECUTE FUNCTION enforce_notification_limit();
