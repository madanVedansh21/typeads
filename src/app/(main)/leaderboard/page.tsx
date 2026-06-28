// @ts-nocheck
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
    <div className="page-wrapper" style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 32 }}>
        <div className="label-sm">THE REGISTRY</div>
        <h1 className="font-headline" style={{ fontSize: 42, marginTop: 12 }}>
          GLOBAL LEADERBOARD
        </h1>
        <p className="font-body" style={{ color: 'var(--ink-light)', marginTop: 8 }}>
          Top typists ranked by total points balance.
        </p>
      </div>

      {/* Your rank */}
      {currentUserEntry && (
        <div className="editorial-box" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 32,
          background: 'var(--paper-dark)'
        }}>
          <span className="label-sm">YOUR RANK</span>
          <span className="font-headline" style={{ fontSize: 32, color: 'var(--ink)' }}>
            #{currentUserEntry.rank}
          </span>
          <span style={{ fontFamily: 'var(--font-courier)', fontSize: 14, fontWeight: 700, marginLeft: 'auto' }}>
            {currentUserEntry.points_balance.toLocaleString()} pts · {currentUserEntry.avg_wpm} avg wpm
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="editorial-box" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: 60, borderRight: '1px solid var(--paper-darker)' }}>#</th>
              <th style={{ borderRight: '1px solid var(--paper-darker)' }}>TYPIST</th>
              <th style={{ textAlign: 'right', borderRight: '1px solid var(--paper-darker)' }}>POINTS</th>
              <th style={{ textAlign: 'right', borderRight: '1px solid var(--paper-darker)' }}>AVG WPM</th>
              <th style={{ textAlign: 'right', borderRight: '1px solid var(--paper-darker)' }}>ACCURACY</th>
              <th style={{ textAlign: 'right' }}>ADS DONE</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry, idx) => {
              const isCurrentUser = entry.id === user?.id
              const medal = idx === 0 ? 'I' : idx === 1 ? 'II' : idx === 2 ? 'III' : null

              return (
                <tr key={entry.id} style={{ background: isCurrentUser ? 'var(--paper-dark)' : 'transparent' }}>
                  <td style={{ textAlign: 'center', fontSize: 18, borderRight: '1px solid var(--paper-darker)', fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
                    {medal ?? entry.rank}
                  </td>
                  <td style={{ borderRight: '1px solid var(--paper-darker)', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, border: '1px solid var(--ink)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-playfair)', fontSize: 18 }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (entry.username ?? 'U')[0].toUpperCase()
                        }
                      </div>
                      <div>
                        <Link href={`/profile/${entry.username}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700, fontFamily: 'var(--font-libre)', fontSize: 14 }}>
                          {entry.display_name ?? entry.username}
                        </Link>
                        <div style={{ fontFamily: 'var(--font-courier)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                          @{entry.username}
                        </div>
                      </div>
                      {isCurrentUser && (
                        <span className="badge badge-solid" style={{ marginLeft: 16 }}>YOU</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-courier)', fontSize: 16, borderRight: '1px solid var(--paper-darker)' }}>
                    {entry.points_balance.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontWeight: 700, borderRight: '1px solid var(--paper-darker)' }}>{entry.avg_wpm}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontWeight: 700, borderRight: '1px solid var(--paper-darker)' }}>{entry.avg_accuracy}%</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontWeight: 700 }}>{entry.total_completions}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(!entries || entries.length === 0) && (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p className="label-sm" style={{ fontSize: 16 }}>NO ENTRIES YET</p>
          </div>
        )}
      </div>
    </div>
  )
}
