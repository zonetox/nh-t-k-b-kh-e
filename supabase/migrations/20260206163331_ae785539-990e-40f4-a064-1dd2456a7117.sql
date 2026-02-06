
-- =============================================
-- SCHEMA V2 - PRODUCTION SAAS READY
-- Nhật Ký Tiêm Chủng
-- =============================================

-- 1. PROFILES (thay thế users, liên kết với auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(15) UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_phone ON public.profiles(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- 2. USER_DEVICES (push notification tokens)
CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_devices_token ON public.user_devices(device_token);
CREATE INDEX idx_devices_user ON public.user_devices(user_id) WHERE is_active = TRUE;

-- 3. BABIES
CREATE TABLE public.babies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_babies_user ON public.babies(user_id) WHERE deleted_at IS NULL;

-- 4. SYSTEM_CONFIGS (cấu hình động)
CREATE TABLE public.system_configs (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- 5. SUBSCRIPTIONS (thiết kế lại - hỗ trợ lifecycle)
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('trial', 'paid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'expired', 'cancelled', 'pending_payment')),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_baby_status ON public.subscriptions(baby_id, status);
CREATE INDEX idx_subs_user ON public.subscriptions(user_id);
CREATE INDEX idx_subs_end_date ON public.subscriptions(end_date) WHERE status = 'active';

-- 6. PAYMENTS (liên kết subscription)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    baby_ids UUID[] NOT NULL,
    amount INTEGER NOT NULL,
    proof_image_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status) WHERE status = 'pending';

-- 7. PAYMENT_SUBSCRIPTIONS (liên kết N-N)
CREATE TABLE public.payment_subscriptions (
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    PRIMARY KEY (payment_id, subscription_id)
);

-- =============================================
-- VACCINE TEMPLATE ENGINE
-- =============================================

-- 8. VACCINES
CREATE TABLE public.vaccines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20),
    type VARCHAR(20) NOT NULL CHECK (type IN ('standard', 'optional')),
    total_doses SMALLINT NOT NULL DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VACCINE_DOSE_RULES (template lịch tiêm)
CREATE TABLE public.vaccine_dose_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
    dose_number SMALLINT NOT NULL,
    min_age_days INTEGER NOT NULL,
    max_age_days INTEGER,
    recommended_age_days INTEGER NOT NULL,
    min_interval_days INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vaccine_id, dose_number)
);

CREATE INDEX idx_dose_rules_vaccine ON public.vaccine_dose_rules(vaccine_id) WHERE is_active = TRUE;

-- 10. VACCINE_SCHEDULES
CREATE TABLE public.vaccine_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
    vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
    dose_number SMALLINT NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'upcoming', 'done', 'overdue', 'skipped')),
    generated_from_rule_id UUID REFERENCES public.vaccine_dose_rules(id),
    is_manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(baby_id, vaccine_id, dose_number)
);

CREATE INDEX idx_schedules_baby ON public.vaccine_schedules(baby_id);
CREATE INDEX idx_schedules_date_status ON public.vaccine_schedules(scheduled_date, status);

-- 11. VACCINE_HISTORY
CREATE TABLE public.vaccine_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID UNIQUE NOT NULL REFERENCES public.vaccine_schedules(id) ON DELETE CASCADE,
    injected_date DATE NOT NULL,
    location VARCHAR(200),
    batch_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VACCINE_HISTORY_IMAGES
CREATE TABLE public.vaccine_history_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id UUID NOT NULL REFERENCES public.vaccine_history(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_images ON public.vaccine_history_images(history_id);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- 13. NOTIFICATION_TEMPLATES
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('reminder', 'system', 'marketing')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATION_LOGS
CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.notification_templates(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(20) CHECK (channel IN ('push', 'sms', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    reference_type VARCHAR(50),
    reference_id UUID,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON public.notification_logs(user_id);
CREATE INDEX idx_notif_status ON public.notification_logs(status) WHERE status = 'pending';

-- =============================================
-- AUDIT & SYSTEM
-- =============================================

-- 15. AUDIT_LOGS
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_table ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- 16. BACKGROUND_JOBS
CREATE TABLE public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    attempts SMALLINT DEFAULT 0,
    max_attempts SMALLINT DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON public.background_jobs(status, scheduled_for) 
    WHERE status IN ('pending', 'retrying');

-- =============================================
-- HELPER FUNCTIONS & TRIGGERS
-- =============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_babies_updated BEFORE UPDATE ON public.babies 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON public.vaccine_schedules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_history_updated BEFORE UPDATE ON public.vaccine_history 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON public.user_devices 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_vaccines_updated BEFORE UPDATE ON public.vaccines 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_dose_rules_updated BEFORE UPDATE ON public.vaccine_dose_rules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, phone)
    VALUES (NEW.id, COALESCE(NEW.phone, NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_dose_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_history_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- USER_DEVICES policies
CREATE POLICY "Users can manage own devices" ON public.user_devices
    FOR ALL USING (auth.uid() = user_id);

-- BABIES policies
CREATE POLICY "Users can view own babies" ON public.babies
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can create babies" ON public.babies
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own babies" ON public.babies
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own babies" ON public.babies
    FOR DELETE USING (auth.uid() = user_id);

-- SYSTEM_CONFIGS policies (read-only for users)
CREATE POLICY "Anyone can read system configs" ON public.system_configs
    FOR SELECT USING (true);

-- SUBSCRIPTIONS policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PAYMENTS policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PAYMENT_SUBSCRIPTIONS policies
CREATE POLICY "Users can view own payment subscriptions" ON public.payment_subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.payments WHERE id = payment_id AND user_id = auth.uid())
    );

-- VACCINES policies (public read)
CREATE POLICY "Anyone can view vaccines" ON public.vaccines
    FOR SELECT USING (is_active = true);

-- VACCINE_DOSE_RULES policies (public read)
CREATE POLICY "Anyone can view dose rules" ON public.vaccine_dose_rules
    FOR SELECT USING (is_active = true);

-- VACCINE_SCHEDULES policies
CREATE POLICY "Users can view own schedules" ON public.vaccine_schedules
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.babies WHERE id = baby_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can update own schedules" ON public.vaccine_schedules
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.babies WHERE id = baby_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can insert schedules for own babies" ON public.vaccine_schedules
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.babies WHERE id = baby_id AND user_id = auth.uid())
    );

-- VACCINE_HISTORY policies
CREATE POLICY "Users can manage own vaccine history" ON public.vaccine_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vaccine_schedules vs
            JOIN public.babies b ON vs.baby_id = b.id
            WHERE vs.id = schedule_id AND b.user_id = auth.uid()
        )
    );

-- VACCINE_HISTORY_IMAGES policies
CREATE POLICY "Users can manage own history images" ON public.vaccine_history_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vaccine_history vh
            JOIN public.vaccine_schedules vs ON vh.schedule_id = vs.id
            JOIN public.babies b ON vs.baby_id = b.id
            WHERE vh.id = history_id AND b.user_id = auth.uid()
        )
    );

-- NOTIFICATION_TEMPLATES policies (public read)
CREATE POLICY "Anyone can view notification templates" ON public.notification_templates
    FOR SELECT USING (is_active = true);

-- NOTIFICATION_LOGS policies
CREATE POLICY "Users can view own notifications" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notification_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- AUDIT_LOGS policies (users can only view own logs)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- BACKGROUND_JOBS policies (no public access)
CREATE POLICY "No public access to background jobs" ON public.background_jobs
    FOR SELECT USING (false);
