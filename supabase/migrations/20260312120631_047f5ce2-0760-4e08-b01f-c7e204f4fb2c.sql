
-- Fix: restrict system_errors insert to admins only (edge functions use service role which bypasses RLS)
DROP POLICY "Service can insert errors" ON public.system_errors;
