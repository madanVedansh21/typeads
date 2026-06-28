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
  })).reverse() ?? []

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      {/* Profile header */}
      <div className="section-box" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24, marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, fontFamily: 'Arial Black' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (profile.display_name ?? profile.username ?? 'U')[0].toUpperCase()
          }
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="font-brand" style={{ fontSize: 32, marginBottom: 4 }}>
            {profile.display_name ?? profile.username}
          </h1>
          <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)', textTransform: 'uppercase', fontWeight: 700 }}>
            @{profile.username} · MEMBER SINCE {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()}
          </p>
          {rankData && (
            <p style={{ fontFamily: 'Arial Black', fontSize: 14, fontWeight: 900, marginTop: 8 }}>
              GLOBAL RANK #{rankData.rank}
            </p>
          )}
        </div>
        {isOwnProfile && (
          <Link href="/rewards" className="btn btn-inverted">
            REDEEM POINTS
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="section-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'POINTS BALANCE', value: profile.points_balance.toLocaleString() },
          { label: 'ADS COMPLETED', value: profile.total_completions },
          { label: 'AVG WPM', value: avgWpm },
          { label: 'AVG ACCURACY', value: `${avgAccuracy}%` },
        ].map((stat, i) => (
          <div key={stat.label} style={{ padding: '24px 16px', borderRight: i < 3 ? '3px solid #000' : 'none', textAlign: 'center' }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>{stat.label}</div>
            <div className="stat-number">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* WPM / Accuracy charts */}
        <div className="section-box" style={{ padding: 24 }}>
          <div className="label-sm" style={{ marginBottom: 24 }}>PERFORMANCE HISTORY</div>
          {sessionChartData.length > 1 ? (
            <ProfileCharts data={sessionChartData} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', border: '3px solid #000' }}>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
                Complete more ads to see your performance trends.
              </p>
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="section-box">
          <div className="section-header">RECENT SESSIONS</div>
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {sessions?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>No sessions yet.</p>
              </div>
            ) : (
              sessions?.map(session => {
                const campaign = session.campaigns as { brand_name: string } | null
                return (
                  <div key={session.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 60px 60px',
                    padding: '16px 24px',
                    borderBottom: '3px solid #000',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 14, fontFamily: 'Arial Black', textTransform: 'uppercase' }}>
                        {campaign?.brand_name ?? 'UNKNOWN'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--grey-mid)', marginTop: 4, fontFamily: 'Arial' }}>
                        {new Date(session.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Courier New' }}>{session.wpm}</div>
                      <div className="label-sm" style={{ fontSize: 10 }}>WPM</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Courier New' }}>{session.accuracy}%</div>
                      <div className="label-sm" style={{ fontSize: 10 }}>ACC</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
