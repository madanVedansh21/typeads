// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REPEAT_COUNT, REPEAT_REWARD_FACTOR, DAILY_AD_LIMIT } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      session_id,
      user_id,
      campaign_id,
      wpm,
      accuracy,
      keystrokes_data,
      accuracy_samples,
      total_keystrokes,
      correct_keystrokes,
      duration_seconds,
      test_mode,
      time_limit,
      use_punctuation,
      use_lowercase,
    } = body

    // Verify user matches authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ── Practice mode fast-path (no campaign) ──────────────────────────────
    // When there are no ads available, users get practice mode with no campaign_id.
    // We still save the session so they can see their results page.
    if (!campaign_id) {
      const { error: insertError } = await supabase
        .from('typing_sessions')
        .insert({
          id: session_id,
          user_id,
          campaign_id: null,
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy * 100) / 100,
          keystrokes_data,
          accuracy_samples,
          total_keystrokes,
          correct_keystrokes,
          duration_seconds,
          status: 'completed',
          is_flagged: false,
          points_earned: 0,
          test_mode,
          time_limit,
          use_punctuation,
          use_lowercase,
          completed_at: new Date().toISOString(),
        })
      if (insertError) {
        console.error('Practice session insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, points_earned: 0, is_flagged: false })
    }
    // ────────────────────────────────────────────────────────────────────────

    // Fetch user's daily state\n
    const { data: state, error: stateError } = await supabase
      .from('user_daily_states')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (stateError || !state) {
      return NextResponse.json({ error: 'User daily state not found' }, { status: 400 })
    }

    if (state.quota_exhausted) {
      return NextResponse.json({ error: 'Daily ad quota exhausted' }, { status: 400 })
    }

    if (state.current_campaign_id !== campaign_id) {
      return NextResponse.json({ error: 'Invalid campaign session order' }, { status: 400 })
    }


    // Fetch the campaign to get its base reward
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('points_reward')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 400 })
    }

    // Determine reward credit: Full reward on first pass, reduced reward on repeats
    const isFirstPass = state.repeats_completed === 0
    const pointsEarned = isFirstPass
      ? campaign.points_reward
      : Math.round(campaign.points_reward * REPEAT_REWARD_FACTOR)

    // Anti-fraud: check keystroke timing variance
    let isFlaggedByTiming = false
    if (Array.isArray(keystrokes_data) && keystrokes_data.length > 10) {
      const intervals = keystrokes_data
        .map((k: { interval_ms: number }) => k.interval_ms)
        .filter((ms: number) => ms > 0)

      if (intervals.length > 5) {
        const mean = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length
        const variance = intervals.reduce((sum: number, ms: number) => sum + Math.pow(ms - mean, 2), 0) / intervals.length
        const stdDev = Math.sqrt(variance)

        // Humans typically have stdDev > 30ms. Bot-like if stdDev < 10ms
        if (stdDev < 10) {
          isFlaggedByTiming = true
        }
      }
    }

    // Call the complete_session function (try with override first)
    let { data, error } = await supabase.rpc('complete_session', {
      p_session_id: session_id,
      p_user_id: user_id,
      p_campaign_id: campaign_id,
      p_wpm: Math.round(wpm),
      p_accuracy: Math.round(accuracy * 100) / 100,
      p_keystrokes_data: keystrokes_data,
      p_accuracy_samples: accuracy_samples,
      p_total_keystrokes: total_keystrokes,
      p_correct_keystrokes: correct_keystrokes,
      p_duration_seconds: duration_seconds,
      p_test_mode: test_mode,
      p_time_limit: time_limit,
      p_use_punctuation: use_punctuation,
      p_use_lowercase: use_lowercase,
      p_points_override: pointsEarned,
    })

    // Fallback: If the database hasn't been migrated yet to accept the p_points_override parameter,
    // the RPC call will fail with a signature mismatch. Try again without points override.
    if (error && error.message.toLowerCase().includes('could not find the function')) {
      console.warn('Metadata RPC failed, falling back to legacy RPC signature...')
      const fallbackResult = await supabase.rpc('complete_session', {
        p_session_id: session_id,
        p_user_id: user_id,
        p_campaign_id: campaign_id,
        p_wpm: Math.round(wpm),
        p_accuracy: Math.round(accuracy * 100) / 100,
        p_keystrokes_data: keystrokes_data,
        p_accuracy_samples: accuracy_samples,
        p_total_keystrokes: total_keystrokes,
        p_correct_keystrokes: correct_keystrokes,
        p_duration_seconds: duration_seconds,
      })
      data = fallbackResult.data
      error = fallbackResult.error
    }

    if (error) {
      console.error('Session complete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update daily state progression on successful completion
    if (data?.success) {
      const newRepeatsCompleted = state.repeats_completed + 1
      let nextCampaignId = state.current_campaign_id
      let newRepeats = newRepeatsCompleted
      let isExhausted = state.quota_exhausted
      const adsServedToday = state.ads_served_today || []

      // Update repeatsCompleted in ads_served_today
      const adIndex = adsServedToday.findIndex(a => a.adId === campaign_id)
      if (adIndex >= 0) {
        adsServedToday[adIndex].repeatsCompleted = newRepeatsCompleted
      } else {
        adsServedToday.push({ adId: campaign_id, repeatsCompleted: newRepeatsCompleted })
      }

      if (newRepeatsCompleted >= REPEAT_COUNT) {
        // Enforced repetition done for this campaign
        nextCampaignId = null
        newRepeats = 0

        // Check if daily quota of unique ads is reached
        const uniqueAdsCompletedCount = adsServedToday.filter(a => a.repeatsCompleted >= REPEAT_COUNT).length
        if (uniqueAdsCompletedCount >= DAILY_AD_LIMIT) {
          isExhausted = true
        } else {
          // Double check if there are any other available campaigns left in database
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, completions_count, completion_cap')
            .eq('is_active', true)

          const activeCampaigns = campaigns?.filter(c => c.completions_count < c.completion_cap) ?? []
          const completedTodayAdIds = new Set(
            adsServedToday
              .filter(a => a.repeatsCompleted >= REPEAT_COUNT)
              .map(a => a.adId)
          )
          const remainingCampaigns = activeCampaigns.filter(c => !completedTodayAdIds.has(c.id))

          if (remainingCampaigns.length === 0) {
            // No more ads in inventory for today
            isExhausted = true
          }
        }
      }

      // Update the daily state in Supabase
      await supabase
        .from('user_daily_states')
        .update({
          current_campaign_id: nextCampaignId,
          repeats_completed: newRepeats,
          ads_served_today: adsServedToday,
          quota_exhausted: isExhausted,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
    }

    // If flagged by timing (bot detection), override status
    if (isFlaggedByTiming && data?.success) {
      await supabase
        .from('typing_sessions')
        .update({ is_flagged: true, flag_reason: 'Suspicious keystroke timing variance', status: 'flagged' })
        .eq('id', session_id)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Session API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
