-- Performance optimization for high-scale vaccination tracking
-- Focus: Improved indexing for frequent filters and large datasets

-- 1. Index for vaccine type and active status (used in dashboard and admin)
CREATE INDEX IF NOT EXISTS idx_vaccines_type_active ON public.vaccines (type, is_active) WHERE (deleted_at IS NULL);

-- 2. Index for vaccine history injected_date (used for reporting/sorting)
CREATE INDEX IF NOT EXISTS idx_vaccine_history_injected_date ON public.vaccine_history (injected_date DESC);

-- 3. Composite index for vaccine_schedules to support common dashboard queries
-- The current idx_schedules_baby_status_date is good, but let's ensure it's optimal
-- We often filter by baby_id and status, then order by scheduled_date
CREATE INDEX IF NOT EXISTS idx_schedules_baby_status_ordering 
ON public.vaccine_schedules (baby_id, status, scheduled_date ASC);

-- 4. Index for profile display_name (for admin searching)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles USING gin (display_name gin_trgm_ops) 
WHERE (display_name IS NOT NULL);
-- Note: Requires pg_trgm extension. Let's enable it first.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 5. Optimization for the baby list query
CREATE INDEX IF NOT EXISTS idx_babies_user_id_composite ON public.babies (user_id, created_at DESC) WHERE (deleted_at IS NULL);

-- 6. Add a trigger to update updated_at on vaccine_schedules automatically if not present
-- (Good for data consistency and cache invalidation)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_vaccine_schedules_updated_at') THEN
        CREATE TRIGGER tr_vaccine_schedules_updated_at
        BEFORE UPDATE ON public.vaccine_schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
