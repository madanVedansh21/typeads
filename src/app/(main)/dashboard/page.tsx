import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign, Profile } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function AdCard({ campaign, completed }: { campaign: Campaign; completed: boolean }) {
  const wordsCount = campaign.ad_text.trim().split(/\s+/).length
  const estSeconds = campaign.estimated_time_seconds ?? Math.round(wordsCount / 60 * 60)
  const estMin = Math.floor(estSeconds / 60)
  const estSec = estSeconds % 60
  const pctFilled = Math.min(100, Math.round((campaign.completions_count / campaign.completion_cap) * 100))

  return (
    <div className="ad-card" style={{ opacity: completed ? 0.4 : 1, pointerEvents: completed ? 'none' : 'auto' }}>
      <div className="ad-card-header">
        <span style={{ fontFamily: 'Arial Black', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>
          {campaign.brand_name.toUpperCase()}
        </span>
        {completed && (
          <span className="badge badge-fulfilled">DONE</span>
        )}
      </div>


      {/* Tile preview */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(3, 20px)',
        borderBottom: '2px solid #000', overflow: 'hidden'
      }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} style={{
            background: campaign.tile_color,
            borderRight: i % 8 !== 7 ? '1px solid rgba(0,0,0,0.2)' : 'none',
            borderBottom: i < 16 ? '1px solid rgba(0,0,0,0.2)' : 'none',
          }} />
        ))}
      </div>

      <div className="ad-card-body">
        <p style={{
          fontFamily: 'Courier New, monospace', fontSize: 12, color: '#555',
          lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {campaign.ad_text}
        </p>
      </div>

      <div className="ad-card-footer">
        <div className="points-tag">
          +{campaign.points_reward} PTS
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)', fontWeight: 700 }}>
            ~{estMin}:{estSec.toString().padStart(2, '0')} MIN
          </span>
          <span style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)', fontWeight: 700 }}>
            {wordsCount} WORDS
          </span>
        </div>
      </div>

      {/* Completion progress bar */}
      <div style={{ borderTop: '2px solid #000', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, height: 4, background: '#eee', marginRight: 8 }}>
          <div style={{ width: `${pctFilled}%`, height: '100%', background: '#000' }} />
        </div>
        <span style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, color: 'var(--grey-mid)', whiteSpace: 'nowrap' }}>
          {campaign.completions_count}/{campaign.completion_cap}
        </span>
      </div>

      {!completed && (
        <Link href={`/type/${campaign.id}`} className="btn" style={{ width: '100%', borderTop: '3px solid #000', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
          START TYPING →
        </Link>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .returns<import('@/lib/supabase/types').Campaign[]>()


  // Fetch user's completed campaigns
  const { data: completedSessions } = await supabase
    .from('typing_sessions')
    .select('campaign_id')
    .eq('user_id', user!.id)
    .eq('status', 'completed')
    .returns<{ campaign_id: string }[]>()

  const completedCampaignIds = new Set(completedSessions?.map(s => s.campaign_id) ?? [])

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()
    .returns<import('@/lib/supabase/types').Profile>()

  const activeCampaigns = campaigns?.filter(c => c.completions_count < c.completion_cap) ?? []
  const dailyRemaining = Math.max(0, 20 - ((profile as import('@/lib/supabase/types').Profile | null)?.daily_completions ?? 0))


  return (
    <div>
      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stats-bar-cell">
          <div className="label-sm">POINTS BALANCE</div>
          <div className="stat-number">{(profile?.points_balance ?? 0).toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">TOTAL COMPLETIONS</div>
          <div className="stat-number">{profile?.total_completions ?? 0}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">TODAY&apos;S REMAINING</div>
          <div className="stat-number">{dailyRemaining}<span style={{ fontSize: 12, fontWeight: 400 }}>/20</span></div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">ADS AVAILABLE</div>
          <div className="stat-number">{activeCampaigns.length}</div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '3px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>AD QUEUE</h1>
          <p style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', marginTop: 2 }}>
            Click any ad to start typing and earn points.
          </p>
        </div>
        {dailyRemaining === 0 && (
          <div className="alert" style={{ border: '2px solid #000', padding: '8px 16px', background: '#eee' }}>
            <span style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700 }}>
              DAILY LIMIT REACHED — COME BACK TOMORROW
            </span>
          </div>
        )}
      </div>

      {/* Ad grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 0,
        padding: 0
      }}>
        {activeCampaigns.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 64, textAlign: 'center' }}>
            <p className="font-brand" style={{ fontSize: 18, color: 'var(--grey-mid)' }}>
              NO ADS AVAILABLE RIGHT NOW
            </p>
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)', marginTop: 8 }}>
              New campaigns are added regularly. Check back soon.
            </p>
          </div>
        ) : (
          activeCampaigns.map(campaign => (
            <div key={campaign.id} style={{ borderRight: '3px solid #000', borderBottom: '3px solid #000' }}>
              <AdCard campaign={campaign} completed={completedCampaignIds.has(campaign.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
