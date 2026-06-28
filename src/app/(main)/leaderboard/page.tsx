import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true })
    .limit(100)

  const currentUserEntry = entries?.find(e => e.id === user?.id)

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #000', padding: '16px 24px', background: '#000', color: '#fff' }}>
        <h1 className="font-brand" style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em', color: '#fff' }}>
          GLOBAL LEADERBOARD
        </h1>
        <p style={{ fontFamily: 'Arial', fontSize: 11, color: '#555', marginTop: 4 }}>
          Top typists ranked by total points balance.
        </p>
      </div>

      {/* Your rank */}
      {currentUserEntry && (
        <div style={{
          background: '#eee',
          borderBottom: '3px solid #000',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <span style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            YOUR RANK
          </span>
          <span className="font-brand" style={{ fontSize: 22, fontWeight: 900 }}>
            #{currentUserEntry.rank}
          </span>
          <span style={{ fontFamily: 'Courier New', fontSize: 13, color: '#555' }}>
            {currentUserEntry.points_balance.toLocaleString()} pts · {currentUserEntry.avg_wpm} avg WPM
          </span>
        </div>
      )}

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 140px 140px 140px 120px',
        borderBottom: '3px solid #000',
        padding: '8px 0',
        background: '#fff'
      }}>
        {['RANK', 'TYPIST', 'POINTS', 'AVG WPM', 'ACCURACY', 'ADS DONE'].map((col, i) => (
          <div key={col} style={{
            padding: '0 16px',
            fontFamily: 'Arial',
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--grey-mid)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textAlign: i > 1 ? 'right' : 'left',
            borderLeft: i === 0 ? 'none' : '2px solid #eee'
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Leaderboard rows */}
      <div>
        {entries?.map((entry, idx) => {
          const isCurrentUser = entry.id === user?.id
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

          return (
            <Link
              key={entry.id}
              href={`/profile/${entry.username}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 140px 140px 140px 120px',
                borderBottom: '2px solid #eee',
                background: isCurrentUser ? '#f5f5f5' : '#fff',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#eee')}
                onMouseLeave={e => (e.currentTarget.style.background = isCurrentUser ? '#f5f5f5' : '#fff')}
              >
                {/* Rank */}
                <div style={{
                  padding: '14px 16px',
                  fontFamily: 'Arial Black',
                  fontSize: 16,
                  fontWeight: 900,
                  textAlign: 'center',
                  borderRight: '2px solid #eee',
                  color: idx < 3 ? '#000' : 'var(--grey-mid)'
                }}>
                  {medal ?? `#${entry.rank}`}
                </div>

                {/* Typist */}
                <div style={{
                  padding: '14px 16px',
                  borderRight: '2px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <div style={{
                    width: 32, height: 32,
                    border: '2px solid #000',
                    background: '#eee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Arial Black', fontSize: 12, fontWeight: 900,
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {entry.avatar_url
                      ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (entry.username ?? 'U')[0].toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Arial Black', fontSize: 13, fontWeight: 900 }}>
                      {entry.display_name ?? entry.username}
                    </div>
                    <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>
                      @{entry.username}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <span className="badge badge-fulfilled" style={{ marginLeft: 8, fontSize: 8 }}>YOU</span>
                  )}
                </div>

                {/* Points */}
                <div style={{
                  padding: '14px 16px',
                  fontFamily: 'Arial Black', fontSize: 14, fontWeight: 900,
                  textAlign: 'right', borderRight: '2px solid #eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
                }}>
                  {entry.points_balance.toLocaleString()}
                </div>

                {/* Avg WPM */}
                <div style={{
                  padding: '14px 16px',
                  fontFamily: 'Courier New', fontSize: 14,
                  textAlign: 'right', borderRight: '2px solid #eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
                }}>
                  {entry.avg_wpm}
                </div>

                {/* Accuracy */}
                <div style={{
                  padding: '14px 16px',
                  fontFamily: 'Courier New', fontSize: 14,
                  textAlign: 'right', borderRight: '2px solid #eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
                }}>
                  {entry.avg_accuracy}%
                </div>

                {/* Ads done */}
                <div style={{
                  padding: '14px 16px',
                  fontFamily: 'Courier New', fontSize: 14,
                  textAlign: 'right',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
                }}>
                  {entry.total_completions}
                </div>
              </div>
            </Link>
          )
        })}

        {(!entries || entries.length === 0) && (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p className="font-brand" style={{ fontSize: 18, color: 'var(--grey-mid)' }}>
              NO ENTRIES YET
            </p>
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)', marginTop: 8 }}>
              Complete your first ad to appear on the leaderboard.
            </p>
            <Link href="/dashboard" className="btn" style={{ marginTop: 24, display: 'inline-block' }}>
              START TYPING →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
