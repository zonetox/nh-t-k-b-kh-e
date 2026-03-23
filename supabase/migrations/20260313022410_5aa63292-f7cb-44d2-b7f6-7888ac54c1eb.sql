
-- Restore backup RPC (super_admin only)
-- Uses edge function for actual decrypt, this RPC is the access gate
CREATE OR REPLACE FUNCTION public.restore_backup(p_file_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super_admin can restore
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: only super_admin can restore backups';
  END IF;

  -- Validate file name format
  IF p_file_name !~ '^daily/backup-\d{4}-\d{2}-\d{2}-.+\.enc$' THEN
    RAISE EXCEPTION 'Invalid backup file name format';
  END IF;

  -- Log the restore attempt
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'backup_restore_requested', 'system_backups', NULL,
    jsonb_build_object('file_name', p_file_name, 'requested_at', now()));

  RETURN jsonb_build_object(
    'status', 'restore_logged',
    'file_name', p_file_name,
    'message', 'Restore request logged. Use edge function restore-backup to execute.'
  );
END;
$$;
