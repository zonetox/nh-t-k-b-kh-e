-- Resolve duplicate vaccines and add unique constraint

DO $$
DECLARE
    v_code VARCHAR;
    v_keep_id UUID;
    v_dup_id UUID;
BEGIN
    -- Loop through each duplicated code
    FOR v_code IN 
        SELECT code FROM public.vaccines GROUP BY code HAVING COUNT(*) > 1 AND code IS NOT NULL
    LOOP
        -- Get the earliest created_at ID to keep as the canonical record
        SELECT id INTO v_keep_id 
        FROM public.vaccines 
        WHERE code = v_code 
        ORDER BY created_at ASC 
        LIMIT 1;

        -- Loop through the duplicate records that we need to remove
        FOR v_dup_id IN 
            SELECT id FROM public.vaccines 
            WHERE code = v_code AND id != v_keep_id
        LOOP
            -- 1. Handle vaccine_schedules
            -- Delete any schedules pointing to dup_id that would cause a unique constraint violation 
            -- (if the baby already has a schedule for the same dose_number using the keep_id)
            DELETE FROM public.vaccine_schedules vs_dup
            WHERE vs_dup.vaccine_id = v_dup_id
            AND EXISTS (
                SELECT 1 FROM public.vaccine_schedules vs_keep
                WHERE vs_keep.vaccine_id = v_keep_id
                AND vs_keep.baby_id = vs_dup.baby_id
                AND vs_keep.dose_number = vs_dup.dose_number
            );

            -- Update all remaining safe schedules to point to the keep_id
            UPDATE public.vaccine_schedules
            SET vaccine_id = v_keep_id
            WHERE vaccine_id = v_dup_id;

            -- 2. Delete dose rules for the duplicate vaccine
            DELETE FROM public.vaccine_dose_rules 
            WHERE vaccine_id = v_dup_id;

            -- 3. Delete the duplicate vaccine entry itself
            DELETE FROM public.vaccines 
            WHERE id = v_dup_id;
        END LOOP;
    END LOOP;
END $$;

-- Drop existing constraint if it exists just in case
ALTER TABLE public.vaccines DROP CONSTRAINT IF EXISTS vaccines_code_key;

-- Add UNIQUE constraint to prevent future duplicates
ALTER TABLE public.vaccines ADD CONSTRAINT vaccines_code_key UNIQUE (code);
