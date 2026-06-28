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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #000', padding: '16px 24px', background: '#000', color: '#fff', marginBottom: 24 }}>
        <h1 className="font-brand" style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em' }}>
          GLOBAL LEADERBOARD
        </h1>
        <p style={{ fontFamily: 'Arial', fontSize: 11, color: '#ccc', marginTop: 4 }}>
          TOP TYPISTS RANKED BY TOTAL POINTS BALANCE.
        </p>
      </div>

      {/* Your rank */}
      {currentUserEntry && (
        <div style={{
          background: '#fff',
          border: '3px solid #000',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32
        }}>
          <span className="label-sm">YOUR RANK</span>
          <span className="font-brand" style={{ fontSize: 24, color: '#000' }}>
            #{currentUserEntry.rank}
          </span>
          <span style={{ fontFamily: 'Courier New', fontSize: 14, fontWeight: 700, marginLeft: 'auto' }}>
            {currentUserEntry.points_balance.toLocaleString()} pts · {currentUserEntry.avg_wpm} avg wpm
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="section-box">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: 60, borderRight: '3px solid #000' }}>#</th>
              <th style={{ borderRight: '3px solid #000' }}>TYPIST</th>
              <th style={{ textAlign: 'right', borderRight: '3px solid #000' }}>POINTS</th>
              <th style={{ textAlign: 'right', borderRight: '3px solid #000' }}>AVG WPM</th>
              <th style={{ textAlign: 'right', borderRight: '3px solid #000' }}>ACCURACY</th>
              <th style={{ textAlign: 'right' }}>ADS DONE</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry, idx) => {
              const isCurrentUser = entry.id === user?.id
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

              return (
                <tr key={entry.id} style={{ background: isCurrentUser ? '#ffffcc' : 'transparent' }}>
                  <td style={{ textAlign: 'center', fontSize: 18, borderRight: '3px solid #000', fontWeight: 900 }}>
                    {medal ?? entry.rank}
                  </td>
                  <td style={{ borderRight: '3px solid #000', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, border: '3px solid #000', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (entry.username ?? 'U')[0].toUpperCase()
                        }
                      </div>
                      <div>
                        <Link href={`/profile/${entry.username}`} style={{ color: '#000', textDecoration: 'none', fontWeight: 900, fontFamily: 'Arial Black', fontSize: 13 }}>
                          {entry.display_name ?? entry.username}
                        </Link>
                        <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>
                          @{entry.username}
                        </div>
                      </div>
                      {isCurrentUser && (
                        <span className="badge badge-solid" style={{ marginLeft: 8 }}>YOU</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'Arial Black', fontSize: 14, borderRight: '3px solid #000' }}>
                    {entry.points_balance.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', fontWeight: 700, borderRight: '3px solid #000' }}>{entry.avg_wpm}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', fontWeight: 700, borderRight: '3px solid #000' }}>{entry.avg_accuracy}%</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', fontWeight: 700 }}>{entry.total_completions}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(!entries || entries.length === 0) && (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p className="label-sm" style={{ fontSize: 16 }}>NO ENTRIES YET</p>
            <Link href="/dashboard" className="btn" style={{ marginTop: 24 }}>
              START TYPING
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
