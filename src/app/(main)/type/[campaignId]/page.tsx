import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TypingInterface from '@/components/typing/TypingInterface'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ campaignId: string }>
}

export default async function TypingPage({ params }: Props) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch campaign
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('is_active', true)
    .single()

  if (error || !campaign) notFound()

  // Check if already completed by user
  const { data: existing } = await supabase
    .from('typing_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('campaign_id', campaignId)
    .eq('status', 'completed')
    .single()

  if (existing) {
    redirect(`/dashboard?msg=already_completed`)
  }

  // Check daily cap
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_completions, last_daily_reset')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const lastReset = profile?.last_daily_reset
  const dailyCount = lastReset === today ? (profile?.daily_completions ?? 0) : 0

  if (dailyCount >= 20) {
    redirect('/dashboard?msg=daily_limit')
  }

  // Check completion cap
  if (campaign.completions_count >= campaign.completion_cap) {
    redirect('/dashboard?msg=campaign_full')
  }

  return (
    <TypingInterface
      campaign={campaign}
      userId={user.id}
    />
  )
}
