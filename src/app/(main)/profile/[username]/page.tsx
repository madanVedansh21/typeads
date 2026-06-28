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

  // Fetch profile by username
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Fetch recent sessions
  const { data: sessions } = await supabase
    .from('typing_sessions')
    .select(`*, campaigns(brand_name)`)
    .eq('user_id', profile.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20)

  // Get rank
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
  })).reverse() ?? []

  return (
    <div>
      {/* Profile header */}
      <div style={{ borderBottom: '3px solid #000', padding: '24px' }}>
        <div className="profile-header" style={{ border: 'none', padding: 0 }}>
          <div className="profile-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.display_name ?? ''} />
              : (profile.display_name ?? profile.username ?? 'U')[0].toUpperCase()
            }
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="font-brand" style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
              {profile.display_name ?? profile.username}
            </h1>
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
              @{profile.username} · MEMBER SINCE {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()}
            </p>
            {rankData && (
              <p style={{ fontFamily: 'Arial Black', fontSize: 13, fontWeight: 900, marginTop: 6 }}>
                GLOBAL RANK #{rankData.rank}
              </p>
            )}
          </div>
          {isOwnProfile && (
            <Link href="/rewards" className="btn">REDEEM POINTS</Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-bar" style={{ borderBottom: '3px solid #000' }}>
        <div className="stats-bar-cell">
          <div className="label-sm">POINTS BALANCE</div>
          <div className="stat-number">{profile.points_balance.toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">ADS COMPLETED</div>
          <div className="stat-number">{profile.total_completions}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">AVG WPM</div>
          <div className="stat-number">{avgWpm}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">AVG ACCURACY</div>
          <div className="stat-number">{avgAccuracy}%</div>
        </div>
      </div>

      {/* Charts + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 400 }}>
        {/* WPM / Accuracy charts */}
        <div style={{ borderRight: '3px solid #000', padding: 24 }}>
          <div className="label-sm" style={{ marginBottom: 16 }}>PERFORMANCE HISTORY</div>
          {sessionChartData.length > 1 ? (
            <ProfileCharts data={sessionChartData} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', border: '2px solid #eee' }}>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
                Complete more ads to see your performance trends.
              </p>
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '2px solid #000', background: '#fff' }}>
            <div className="label-sm">RECENT SESSIONS</div>
          </div>
          {sessions?.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>No sessions yet.</p>
            </div>
          ) : (
            sessions?.map(session => {
              const campaign = session.campaigns as { brand_name: string } | null
              return (
                <div key={session.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 60px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #eee',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900 }}>
                      {campaign?.brand_name ?? 'UNKNOWN'}
                    </div>
                    <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>
                      {new Date(session.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Courier New', fontSize: 13, fontWeight: 700 }}>{session.wpm}</div>
                    <div className="label-sm" style={{ fontSize: 8 }}>WPM</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Courier New', fontSize: 13, fontWeight: 700 }}>{session.accuracy}%</div>
                    <div className="label-sm" style={{ fontSize: 8 }}>ACC</div>
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
