-- Migration 004: Secure profiles table from client-side tampering
-- This trigger ensures that when a user updates their own profile via the Supabase Data API,
-- they cannot overwrite sensitive columns like is_admin, points_balance, etc.

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If the update is happening through the service_role key or postgres role (bypassing RLS),
  -- we might want to allow it. However, a simpler approach is to only allow it if the user
  -- making the change is a superuser/admin. But since we use server-side functions with 
  -- SECURITY DEFINER for points (like complete_session), those run as postgres owner anyway.
  -- Wait, triggers fire even for SECURITY DEFINER functions!
  -- To allow backend to update points, we check if the current user is 'authenticated' 
  -- (meaning a client-side API call). 
  -- If current_user is authenticated (Postgres role), then enforce protections.
  
  IF current_setting('role') = 'authenticated' THEN
    -- Force sensitive columns to remain unchanged
    NEW.is_admin = OLD.is_admin;
    NEW.points_balance = OLD.points_balance;
    NEW.total_completions = OLD.total_completions;
    NEW.daily_completions = OLD.daily_completions;
    NEW.total_wpm_sum = OLD.total_wpm_sum;
    NEW.total_accuracy_sum = OLD.total_accuracy_sum;
    NEW.is_banned = OLD.is_banned;
    NEW.last_daily_reset = OLD.last_daily_reset;
  END IF;

  -- Always update the updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_profile_security ON public.profiles;

CREATE TRIGGER ensure_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();
