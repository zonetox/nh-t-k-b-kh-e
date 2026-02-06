
-- =============================================
-- AUTH MODULE - SCHEMA ADDITIONS
-- =============================================

-- 1. Add display_name to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- 2. Create login_sessions table for session management
CREATE TABLE IF NOT EXISTS public.login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_info JSONB,
    ip_address INET,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON public.login_sessions(user_id);
CREATE INDEX idx_sessions_token ON public.login_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON public.login_sessions(expires_at) WHERE revoked_at IS NULL;

-- 3. Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_phone ON public.login_attempts(phone, created_at);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address, created_at);

-- 4. Enable RLS
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for login_sessions
CREATE POLICY "Users can view own sessions" ON public.login_sessions
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete own sessions" ON public.login_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 6. No public access to login_attempts (only via edge functions)
CREATE POLICY "No public access to login_attempts" ON public.login_attempts
    FOR ALL USING (false);

-- 7. Create function to check rate limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
    p_phone VARCHAR,
    p_ip INET
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_phone_attempts INT;
    v_ip_attempts INT;
    v_last_attempt TIMESTAMPTZ;
    v_locked_until TIMESTAMPTZ;
BEGIN
    -- Count attempts in last 15 minutes for this phone
    SELECT COUNT(*), MAX(created_at)
    INTO v_phone_attempts, v_last_attempt
    FROM public.login_attempts
    WHERE phone = p_phone 
      AND success = FALSE
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Count attempts in last 15 minutes for this IP
    SELECT COUNT(*)
    INTO v_ip_attempts
    FROM public.login_attempts
    WHERE ip_address = p_ip 
      AND success = FALSE
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Check if locked (5 failed attempts = 30 min lock)
    IF v_phone_attempts >= 5 THEN
        v_locked_until := v_last_attempt + INTERVAL '30 minutes';
        IF v_locked_until > NOW() THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', 'account_locked',
                'locked_until', v_locked_until,
                'remaining_seconds', EXTRACT(EPOCH FROM (v_locked_until - NOW()))::INT
            );
        END IF;
    END IF;
    
    -- Check IP rate limit
    IF v_ip_attempts >= 10 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'ip_rate_limit',
            'message', 'Too many attempts from this IP'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'attempts_remaining', 5 - v_phone_attempts
    );
END;
$$;

-- 8. Create function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_phone VARCHAR,
    p_ip INET,
    p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.login_attempts (phone, ip_address, success)
    VALUES (p_phone, p_ip, p_success);
    
    -- Clean up old attempts (older than 24 hours)
    DELETE FROM public.login_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 9. Create function to revoke all sessions
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.login_sessions
    SET revoked_at = NOW()
    WHERE user_id = p_user_id AND revoked_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 10. Create function to clean up expired sessions (for cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM public.login_sessions
    WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 11. Add trigger for audit log on profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log password change (detected by trigger on auth.users)
        IF OLD.phone != NEW.phone THEN
            INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
            VALUES (NEW.id, 'change_phone', 'profiles', NEW.id, 
                jsonb_build_object('phone', OLD.phone),
                jsonb_build_object('phone', NEW.phone));
        END IF;
        
        IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
            INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
            VALUES (NEW.id, 'update_profile', 'profiles', NEW.id,
                jsonb_build_object('display_name', OLD.display_name),
                jsonb_build_object('display_name', NEW.display_name));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profile_changes();
