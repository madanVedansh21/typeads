// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProfileCharts from '@/components/profile/ProfileCharts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) notFound()

  const isOwnProfile = user?.id === profile.id

  const { data: sessions } = await supabase
    .from('typing_sessions')
    .select(`*, campaigns(brand_name)`)
    .eq('user_id', profile.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20)

  const { data: rankData } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('id', profile.id)
    .single()

  const avgWpm = profile.total_completions > 0
    ? Math.round(profile.total_wpm_sum / profile.total_completions)
    : 0
  const avgAccuracy = profile.total_completions > 0
    ? Math.round(profile.total_accuracy_sum / profile.total_completions * 10) / 10
    : 0

  const sessionChartData = sessions?.map(s => ({
    date: new Date(s.completed_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    wpm: s.wpm,
    accuracy: s.accuracy,
    brand: (s.campaigns as { brand_name: string } | null)?.brand_name ?? '',
    test_mode: s.test_mode || 'jumbled',
    time_limit: s.time_limit || null,
  })).reverse() ?? []

  return (
    <div className="page-wrapper" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(12px, 3vw, 24px)' }}>
      
      {/* Profile header */}
      <div className="editorial-box profile-header" style={{ marginBottom: 32, background: 'var(--paper-dark)' }}>
        <div style={{ width: 100, height: 100, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontFamily: 'var(--font-playfair)', background: 'var(--paper)', flexShrink: 0 }}>
          {profile.avatar_url
             ? <img src={profile.avatar_url} alt={profile.display_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             : (profile.display_name ?? profile.username ?? 'U')[0].toUpperCase()
          }
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="font-headline" style={{ fontSize: 'clamp(28px, 5vw, 42px)', marginBottom: 8 }}>
            {profile.display_name ?? profile.username}
          </h1>
          <p style={{ fontFamily: 'var(--font-libre)', fontSize: 11, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            @{profile.username} · MEMBER SINCE {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()}
          </p>
          {rankData && (
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 16, marginTop: 12, fontStyle: 'italic' }}>
              Global Rank: #{rankData.rank}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="editorial-box resp-stats-4col" style={{ padding: 0, marginBottom: 32 }}>
        {[
          { label: 'POINTS BALANCE', value: profile.points_balance.toLocaleString() },
          { label: 'ADS COMPLETED', value: profile.total_completions },
          { label: 'AVG WPM', value: avgWpm },
          { label: 'AVG ACCURACY', value: `${avgAccuracy}%` },
        ].map((stat, i) => (
          <div key={stat.label} style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div className="label-sm" style={{ marginBottom: 12 }}>{stat.label}</div>
            <div className="stat-number">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="editorial-box" style={{ padding: 'clamp(16px, 4vw, 32px)', marginBottom: 32 }}>
        <div className="label-sm" style={{ marginBottom: 24, borderBottom: '1px solid var(--paper-darker)', paddingBottom: 8 }}>PERFORMANCE HISTORY</div>
        {sessionChartData.length > 1 ? (
          <ProfileCharts data={sessionChartData} />
        ) : (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p className="font-body" style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              Complete more ads to see your performance trends.
            </p>
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="editorial-box" style={{ padding: 0 }}>
        <div className="box-label" style={{ padding: '16px 24px', margin: 0 }}>RECENT SESSIONS</div>
        <div style={{ overflowY: 'auto', maxHeight: 400 }}>
          {sessions?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p className="font-body" style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>No sessions yet.</p>
            </div>
          ) : (
            sessions?.map(session => {
              const campaign = session.campaigns as { brand_name: string } | null
              return (
                <div key={session.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 70px 70px',
                  padding: '16px clamp(12px, 3vw, 24px)',
                  borderBottom: '1px solid var(--paper-darker)',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 16 }}>
                      {campaign?.brand_name ?? 'UNKNOWN'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, fontFamily: 'var(--font-courier)' }}>
                      {new Date(session.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-courier)' }}>{session.wpm}</div>
                    <div className="label-sm" style={{ fontSize: 9 }}>WPM</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-courier)' }}>{session.accuracy}%</div>
                    <div className="label-sm" style={{ fontSize: 9 }}>ACC</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
