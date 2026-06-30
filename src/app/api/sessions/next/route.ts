// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DAILY_AD_LIMIT, REPEAT_COUNT } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })
    }

    // Fetch user's daily state
    const { data: dailyState, error: stateError } = await supabase
      .from('user_daily_states')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let state = dailyState

    if (stateError && stateError.code !== 'PGRST116') {
      // PGRST116 is code for "JSON object requested, multiple or no rows returned"
      console.error('Error fetching daily state:', stateError)
      return NextResponse.json({ error: stateError.message }, { status: 500 })
    }

    // Lazy reset if it's a new day or daily state doesn't exist
    if (!state) {
      const newState = {
        user_id: user.id,
        local_date: date,
        current_campaign_id: null,
        repeats_completed: 0,
        ads_served_today: [],
        quota_exhausted: false
      }
      const { data: inserted, error: insertError } = await supabase
        .from('user_daily_states')
        .insert(newState)
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting daily state:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      state = inserted
    } else if (state.local_date !== date) {
      // It's a new day! Reset the daily state
      const resetState = {
        local_date: date,
        current_campaign_id: null,
        repeats_completed: 0,
        ads_served_today: [],
        quota_exhausted: false
      }
      const { data: updated, error: updateError } = await supabase
        .from('user_daily_states')
        .update(resetState)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error resetting daily state:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      state = updated
    }

    // 1. If quota is already exhausted, return practice mode
    if (state.quota_exhausted) {
      return NextResponse.json({
        mode: 'practice',
        quotaExhausted: true
      })
    }

    // Helper to get active and valid campaigns
    const getCampaigns = async () => {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      return campaigns?.filter(c => c.completions_count < c.completion_cap) ?? []
    }

    // 2. If user is currently in the middle of repeating a campaign
    if (state.current_campaign_id) {
      const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', state.current_campaign_id)
        .single()

      // Verify campaign is active and under cap
      if (campaign && campaign.is_active && campaign.completions_count < campaign.completion_cap) {
        return NextResponse.json({
          mode: 'ad',
          campaign,
          repeatNumber: state.repeats_completed + 1,
          totalRepeats: REPEAT_COUNT,
          quotaExhausted: false
        })
      } else {
        // Campaign became invalid/inactive, reset current campaign on state
        state.current_campaign_id = null
        state.repeats_completed = 0
      }
    }

    // 3. Select next new campaign
    const activeCampaigns = await getCampaigns()

    // Determine campaigns completed today (must have completed all REPEAT_COUNT repeats)
    const adsServedToday = state.ads_served_today || []
    const completedTodayAdIds = new Set(
      adsServedToday
        .filter(a => a.repeatsCompleted >= REPEAT_COUNT)
        .map(a => a.adId)
    )

    const availableCampaigns = activeCampaigns.filter(c => !completedTodayAdIds.has(c.id))

    // Check if unique ads limit reached or no campaigns are available
    const uniqueAdsCompletedCount = adsServedToday.filter(a => a.repeatsCompleted >= REPEAT_COUNT).length

    if (uniqueAdsCompletedCount >= DAILY_AD_LIMIT || availableCampaigns.length === 0) {
      // Quota exhausted or inventory empty
      await supabase
        .from('user_daily_states')
        .update({ quota_exhausted: true, current_campaign_id: null })
        .eq('user_id', user.id)

      return NextResponse.json({
        mode: 'practice',
        quotaExhausted: true
      })
    }

    // Pick a random campaign from available ones
    const nextCampaign = availableCampaigns[Math.floor(Math.random() * availableCampaigns.length)]

    // Check if it's already in the ads_served_today array
    const adExists = adsServedToday.some(a => a.adId === nextCampaign.id)
    const updatedAdsServedToday = adExists 
      ? adsServedToday 
      : [...adsServedToday, { adId: nextCampaign.id, repeatsCompleted: 0 }]

    // Update daily state with the selected campaign
    const { error: updateStateError } = await supabase
      .from('user_daily_states')
      .update({
        current_campaign_id: nextCampaign.id,
        repeats_completed: 0,
        ads_served_today: updatedAdsServedToday
      })
      .eq('user_id', user.id)

    if (updateStateError) {
      console.error('Error updating daily state with new campaign:', updateStateError)
      return NextResponse.json({ error: updateStateError.message }, { status: 500 })
    }

    return NextResponse.json({
      mode: 'ad',
      campaign: nextCampaign,
      repeatNumber: 1,
      totalRepeats: REPEAT_COUNT,
      quotaExhausted: false
    })

  } catch (err) {
    console.error('API sessions next error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
