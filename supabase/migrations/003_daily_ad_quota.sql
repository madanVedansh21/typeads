-- Migration: 003_daily_ad_quota.sql
-- Description: Ensure metadata columns exist, create user_daily_states table, and update complete_session function

-- 1. Ensure metadata columns exist in typing_sessions (safeguard in case migration 002 wasn't run)
ALTER TABLE public.typing_sessions 
ADD COLUMN IF NOT EXISTS test_mode TEXT DEFAULT 'jumbled',
ADD COLUMN IF NOT EXISTS time_limit INTEGER NULL,
ADD COLUMN IF NOT EXISTS use_punctuation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS use_lowercase BOOLEAN DEFAULT false;

-- 2. Create user_daily_states table
CREATE TABLE IF NOT EXISTS public.user_daily_states (
  user_id              UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date           TEXT NOT NULL, -- Format: YYYY-MM-DD
  current_campaign_id  UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  repeats_completed    INTEGER NOT NULL DEFAULT 0,
  ads_served_today     JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { adId, repeatsCompleted }
  quota_exhausted      BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_daily_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own daily states" ON public.user_daily_states;
CREATE POLICY "Users can view own daily states" ON public.user_daily_states 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily states" ON public.user_daily_states;
CREATE POLICY "Users can insert own daily states" ON public.user_daily_states 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily states" ON public.user_daily_states;
CREATE POLICY "Users can update own daily states" ON public.user_daily_states 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Update complete_session function to support points override and higher safety cap
CREATE OR REPLACE FUNCTION public.complete_session(
  p_session_id UUID,
  p_user_id UUID,
  p_campaign_id UUID,
  p_wpm INTEGER,
  p_accuracy DECIMAL,
  p_keystrokes_data JSONB,
  p_accuracy_samples JSONB,
  p_total_keystrokes INTEGER,
  p_correct_keystrokes INTEGER,
  p_duration_seconds INTEGER,
  p_test_mode TEXT DEFAULT 'jumbled',
  p_time_limit INTEGER DEFAULT NULL,
  p_use_punctuation BOOLEAN DEFAULT true,
  p_use_lowercase BOOLEAN DEFAULT false,
  p_points_override INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_campaign RECORD;
  v_profile RECORD;
  v_is_flagged BOOLEAN := false;
  v_flag_reason TEXT;
  v_points_earned INTEGER;
  v_status TEXT := 'completed';
BEGIN
  -- Get campaign
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Campaign not found');
  END IF;

  -- Check campaign is active
  IF NOT v_campaign.is_active THEN
    RETURN jsonb_build_object('error', 'Campaign is not active');
  END IF;

  -- Check completion cap
  IF v_campaign.completions_count >= v_campaign.completion_cap THEN
    RETURN jsonb_build_object('error', 'Campaign completion cap reached');
  END IF;

  -- Get / reset daily completions
  PERFORM public.reset_daily_completions_if_needed(p_user_id);
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  -- Check daily cap (increased safety cap to 100 for repetition system)
  IF v_profile.daily_completions >= 100 THEN
    RETURN jsonb_build_object('error', 'Daily completion limit reached');
  END IF;

  -- Anti-fraud checks
  IF p_wpm > 200 THEN
    v_is_flagged := true;
    v_flag_reason := 'WPM > 200';
    v_status := 'flagged';
  END IF;

  -- Determine points earned (0 if flagged, override if supplied, otherwise campaign default)
  IF v_is_flagged THEN
    v_points_earned := 0;
  ELSIF p_points_override IS NOT NULL THEN
    v_points_earned := p_points_override;
  ELSE
    v_points_earned := v_campaign.points_reward;
  END IF;

  -- Insert session with metadata
  INSERT INTO public.typing_sessions (
    id, user_id, campaign_id, wpm, accuracy, keystrokes_data, accuracy_samples,
    total_keystrokes, correct_keystrokes, duration_seconds, status,
    is_flagged, flag_reason, points_earned,
    test_mode, time_limit, use_punctuation, use_lowercase
  ) VALUES (
    p_session_id, p_user_id, p_campaign_id, p_wpm, p_accuracy, p_keystrokes_data,
    p_accuracy_samples, p_total_keystrokes, p_correct_keystrokes, p_duration_seconds,
    v_status, v_is_flagged, v_flag_reason, v_points_earned,
    p_test_mode, p_time_limit, p_use_punctuation, p_use_lowercase
  );

  -- Update profile stats
  UPDATE public.profiles SET
    points_balance    = points_balance + v_points_earned,
    total_completions = total_completions + 1,
    daily_completions = daily_completions + 1,
    total_wpm_sum     = total_wpm_sum + p_wpm,
    total_accuracy_sum = total_accuracy_sum + p_accuracy,
    updated_at        = NOW()
  WHERE id = p_user_id;

  -- Update campaign completions count
  UPDATE public.campaigns
  SET completions_count = completions_count + 1, updated_at = NOW()
  WHERE id = p_campaign_id;

  -- Log points transaction (only if not flagged and points > 0)
  IF NOT v_is_flagged AND v_points_earned > 0 THEN
    INSERT INTO public.points_transactions (user_id, type, amount, reference_id, description)
    VALUES (
      p_user_id, 'earned', v_points_earned, p_session_id,
      'Completed ad: ' || v_campaign.brand_name
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'points_earned', v_points_earned,
    'is_flagged', v_is_flagged,
    'flag_reason', v_flag_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
