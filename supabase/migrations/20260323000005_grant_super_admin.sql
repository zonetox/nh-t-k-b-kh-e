-- Grant super_admin role to the project owner/admin account
-- This ensures the admin panel is accessible

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID for the phone number 0918731411
    SELECT id INTO v_user_id FROM public.profiles WHERE phone = '0918731411';

    IF v_user_id IS NOT NULL THEN
        -- Insert into user_roles if not exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Also ensure is_admin is true in profiles
        UPDATE public.profiles SET is_admin = true WHERE id = v_user_id;
    END IF;
END $$;
