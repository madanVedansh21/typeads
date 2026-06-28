import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TypingInterface from '@/components/typing/TypingInterface'
import type { Campaign, Profile } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .returns<Campaign[]>()

  // Fetch user's completed campaigns
  const { data: completedSessions } = await supabase
    .from('typing_sessions')
    .select('campaign_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .returns<{ campaign_id: string }[]>()

  const completedCampaignIds = new Set(completedSessions?.map(s => s.campaign_id) ?? [])

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    .returns<Profile>()

  const activeCampaigns = campaigns?.filter(c => c.completions_count < c.completion_cap) ?? []
  
  // Find next available campaign
  const nextCampaign = activeCampaigns.find(c => !completedCampaignIds.has(c.id))

  const dailyRemaining = Math.max(0, 20 - (profile?.daily_completions ?? 0))

  if (dailyRemaining === 0 || !nextCampaign) {
    return (
      <div style={{ height: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ border: '3px solid #000', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Arial Black', fontSize: 24, color: '#000', margin: 0, textTransform: 'uppercase' }}>
            {dailyRemaining === 0 ? 'DAILY LIMIT REACHED' : 'NO ADS AVAILABLE RIGHT NOW'}
          </p>
          <p style={{ fontFamily: 'Arial Black', fontSize: 12, color: 'var(--grey-mid)', marginTop: 16 }}>
            {dailyRemaining === 0 ? 'COME BACK TOMORROW TO EARN MORE POINTS.' : 'CHECK BACK LATER FOR NEW CAMPAIGNS.'}
          </p>
        </div>
      </div>
    )
  }

  // Render TypingInterface for the next campaign
  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <TypingInterface campaign={nextCampaign} userId={user.id} />
    </div>
  )
}
