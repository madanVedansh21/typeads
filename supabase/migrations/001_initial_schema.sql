-- TypeAds MVP — Supabase Database Schema
-- Run this in the Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  display_name    TEXT,
  avatar_url      TEXT,
  email           TEXT NOT NULL,
  points_balance  INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_completions INTEGER NOT NULL DEFAULT 0,
  daily_completions INTEGER NOT NULL DEFAULT 0,
  last_daily_reset  DATE NOT NULL DEFAULT CURRENT_DATE,
  total_wpm_sum   BIGINT NOT NULL DEFAULT 0,  -- for avg WPM calc
  total_accuracy_sum DECIMAL NOT NULL DEFAULT 0, -- for avg accuracy calc
  is_admin        BOOLEAN NOT NULL DEFAULT false,
  is_banned       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name            TEXT NOT NULL,
  ad_text               TEXT NOT NULL,
  image_url             TEXT,
  points_reward         INTEGER NOT NULL DEFAULT 100,
  completion_cap        INTEGER NOT NULL DEFAULT 500,
  completions_count     INTEGER NOT NULL DEFAULT 0,
  estimated_time_seconds INTEGER,
  is_active             BOOLEAN NOT NULL DEFAULT false,
  tile_color            TEXT NOT NULL DEFAULT '#222222',  -- brand-adjacent tile color
  created_by            UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TYPING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.typing_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES public.campaigns(id),
  wpm               INTEGER NOT NULL DEFAULT 0,
  accuracy          DECIMAL(5,2) NOT NULL DEFAULT 0,
  keystrokes_data   JSONB,       -- [{key, timestamp, interval_ms}]
  accuracy_samples  JSONB,       -- [{char_index, accuracy, wpm}] every 5 keystrokes
  total_keystrokes  INTEGER NOT NULL DEFAULT 0,
  correct_keystrokes INTEGER NOT NULL DEFAULT 0,
  duration_seconds  INTEGER,
  status            TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','abandoned','flagged')),
  is_flagged        BOOLEAN NOT NULL DEFAULT false,
  flag_reason       TEXT,
  points_earned     INTEGER NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REDEMPTION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.redemption_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_card_type  TEXT NOT NULL,  -- 'amazon', 'flipkart', 'swiggy', 'myntra', 'zomato'
  denomination    INTEGER NOT NULL,  -- in INR
  points_cost     INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','rejected')),
  gift_card_code  TEXT,
  admin_notes     TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at    TIMESTAMPTZ
);

-- ============================================================
-- POINTS TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('earned','redeemed')),
  amount        INTEGER NOT NULL,
  reference_id  UUID,
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEADERBOARD VIEW (computed)
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.points_balance,
  p.total_completions,
  CASE
    WHEN p.total_completions > 0
    THEN ROUND(p.total_wpm_sum::DECIMAL / p.total_completions)
    ELSE 0
  END AS avg_wpm,
  CASE
    WHEN p.total_completions > 0
    THEN ROUND(p.total_accuracy_sum / p.total_completions, 1)
    ELSE 0
  END AS avg_accuracy,
  p.created_at,
  DENSE_RANK() OVER (ORDER BY p.points_balance DESC) AS rank
FROM public.profiles p
WHERE p.is_banned = false
  AND p.total_completions > 0
ORDER BY p.points_balance DESC;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reset daily completions if day has changed
CREATE OR REPLACE FUNCTION public.reset_daily_completions_if_needed(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET daily_completions = 0, last_daily_reset = CURRENT_DATE
  WHERE id = user_id AND last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a typing session and award points
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
  p_duration_seconds INTEGER
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

  -- Check daily cap (20 per day)
  IF v_profile.daily_completions >= 20 THEN
    RETURN jsonb_build_object('error', 'Daily completion limit reached');
  END IF;

  -- Anti-fraud checks
  IF p_wpm > 200 THEN
    v_is_flagged := true;
    v_flag_reason := 'WPM > 200';
    v_status := 'flagged';
  END IF;

  -- Determine points earned (0 if flagged, pending admin review)
  v_points_earned := CASE WHEN v_is_flagged THEN 0 ELSE v_campaign.points_reward END;

  -- Insert session
  INSERT INTO public.typing_sessions (
    id, user_id, campaign_id, wpm, accuracy, keystrokes_data, accuracy_samples,
    total_keystrokes, correct_keystrokes, duration_seconds, status,
    is_flagged, flag_reason, points_earned
  ) VALUES (
    p_session_id, p_user_id, p_campaign_id, p_wpm, p_accuracy, p_keystrokes_data,
    p_accuracy_samples, p_total_keystrokes, p_correct_keystrokes, p_duration_seconds,
    v_status, v_is_flagged, v_flag_reason, v_points_earned
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

  -- Log points transaction (only if not flagged)
  IF NOT v_is_flagged THEN
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

-- Request gift card redemption
CREATE OR REPLACE FUNCTION public.request_redemption(
  p_user_id UUID,
  p_gift_card_type TEXT,
  p_denomination INTEGER,
  p_points_cost INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_account_age_days INTEGER;
  v_redemption_id UUID := uuid_generate_v4();
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  -- Check account age (7 days)
  v_account_age_days := EXTRACT(DAY FROM NOW() - v_profile.created_at)::INTEGER;
  IF v_account_age_days < 7 THEN
    RETURN jsonb_build_object('error', 'Account must be at least 7 days old to redeem');
  END IF;

  -- Check minimum completions (10)
  IF v_profile.total_completions < 10 THEN
    RETURN jsonb_build_object('error', 'Must complete at least 10 ads before redeeming');
  END IF;

  -- Check points balance
  IF v_profile.points_balance < p_points_cost THEN
    RETURN jsonb_build_object('error', 'Insufficient points balance');
  END IF;

  -- Check minimum redemption (500 points)
  IF p_points_cost < 500 THEN
    RETURN jsonb_build_object('error', 'Minimum redemption is 500 points');
  END IF;

  -- Deduct points
  UPDATE public.profiles
  SET points_balance = points_balance - p_points_cost, updated_at = NOW()
  WHERE id = p_user_id;

  -- Create redemption request
  INSERT INTO public.redemption_requests (id, user_id, gift_card_type, denomination, points_cost)
  VALUES (v_redemption_id, p_user_id, p_gift_card_type, p_denomination, p_points_cost);

  -- Log transaction
  INSERT INTO public.points_transactions (user_id, type, amount, reference_id, description)
  VALUES (p_user_id, 'redeemed', p_points_cost, v_redemption_id,
          p_gift_card_type || ' gift card ₹' || p_denomination);

  RETURN jsonb_build_object('success', true, 'redemption_id', v_redemption_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Campaigns: everyone can read active, admins manage all
CREATE POLICY "Active campaigns viewable by all" ON public.campaigns FOR SELECT USING (is_active = true OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can insert campaigns" ON public.campaigns FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can update campaigns" ON public.campaigns FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Typing sessions: users see own, admins see all
CREATE POLICY "Users can view own sessions" ON public.typing_sessions FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own sessions" ON public.typing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Redemptions: users see own, admins see all
CREATE POLICY "Users can view own redemptions" ON public.redemption_requests FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can update redemptions" ON public.redemption_requests FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Points transactions: users see own, admins see all
CREATE POLICY "Users can view own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- STORAGE BUCKET (ad-images)
-- Run separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);
-- CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');
-- CREATE POLICY "Admin upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-images' AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
-- ============================================================

-- ============================================================
-- SEED: Gift card options reference data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_card_options (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  denominations INTEGER[] NOT NULL,  -- array of INR values
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.gift_card_options (name, slug, denominations, sort_order) VALUES
  ('Amazon', 'amazon', ARRAY[100, 250, 500, 1000], 1),
  ('Flipkart', 'flipkart', ARRAY[100, 250, 500, 1000], 2),
  ('Swiggy', 'swiggy', ARRAY[100, 250, 500], 3),
  ('Zomato', 'zomato', ARRAY[100, 250, 500], 4),
  ('Myntra', 'myntra', ARRAY[250, 500, 1000], 5)
ON CONFLICT (slug) DO NOTHING;
