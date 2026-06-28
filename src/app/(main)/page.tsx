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
  const availableCampaigns = activeCampaigns.filter(c => !completedCampaignIds.has(c.id))
  
  // Pick a random campaign from available ones
  const nextCampaign = availableCampaigns.length > 0 
    ? availableCampaigns[Math.floor(Math.random() * availableCampaigns.length)]
    : undefined

  const dailyRemaining = Math.max(0, 20 - (profile?.daily_completions ?? 0))

  if (dailyRemaining === 0 || !nextCampaign) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
        <div className="editorial-box" style={{ padding: '48px', textAlign: 'center', maxWidth: 400 }}>
          <div className="box-label">DISPATCH</div>
          <p className="font-headline" style={{ fontSize: 24, margin: '16px 0' }}>
            {dailyRemaining === 0 ? 'DAILY LIMIT REACHED' : 'NO ADS AVAILABLE'}
          </p>
          <p className="font-body" style={{ color: 'var(--ink-light)' }}>
            {dailyRemaining === 0 ? 'You have completed your daily quota. Come back tomorrow to earn more points.' : 'There are no campaigns currently available in the system. Check back later.'}
          </p>
        </div>
      </div>
    )
  }

  // Render TypingInterface for the next campaign
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TypingInterface campaign={nextCampaign} userId={user.id} />
    </div>
  )
}
