import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ResultsCharts from '@/components/results/ResultsCharts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('typing_sessions')
    .select(`
      *,
      campaigns (brand_name, ad_text, image_url, points_reward)
    `)
    .eq('id', sessionId)
    .single()

  if (error || !session) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('points_balance, total_completions, total_wpm_sum')
    .eq('id', session.user_id)
    .single()

  const avgWpm = profile?.total_completions
    ? Math.round((profile.total_wpm_sum ?? 0) / profile.total_completions)
    : 0

  const accuracySamples = (session.accuracy_samples as Array<{ char_index: number; accuracy: number; wpm: number }>) ?? []
  const isFlagged = session.is_flagged
  const campaign = session.campaigns as { brand_name: string; ad_text: string; image_url: string | null; points_reward: number } | null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-brand" style={{ fontSize: 32, marginBottom: 8, color: '#000' }}>
          {isFlagged ? 'SESSION FLAGGED' : 'SESSION COMPLETE'}
        </h1>
        {isFlagged && (
          <div style={{ background: 'var(--red-error)', color: 'var(--white)', padding: 12, border: '3px solid #000', fontFamily: 'Arial Black', fontSize: 12 }}>
            THIS SESSION WAS FLAGGED FOR REVIEW: {session.flag_reason}. POINTS ARE HELD PENDING ADMIN REVIEW.
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #000', marginBottom: 24, background: '#fff' }}>
        {[
          { label: 'WPM', value: session.wpm, sub: `AVG: ${avgWpm}` },
          { label: 'ACCURACY', value: `${session.accuracy}%`, sub: '' },
          { label: 'POINTS EARNED', value: isFlagged ? '0*' : `+${session.points_earned}`, sub: isFlagged ? 'PENDING REVIEW' : 'ADDED TO WALLET' },
          { label: 'TOTAL BALANCE', value: (profile?.points_balance ?? 0).toLocaleString(), sub: 'CURRENT' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '16px',
              borderRight: i < 3 ? '3px solid #000' : 'none',
              textAlign: 'center',
            }}
          >
            <div className="label-sm" style={{ marginBottom: 6 }}>{stat.label}</div>
            <div className="stat-number" style={{ fontSize: 28 }}>{stat.value}</div>
            {stat.sub && (
              <div style={{ fontFamily: 'Arial', fontSize: 9, color: 'var(--grey-mid)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                {stat.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      {accuracySamples.length > 1 && (
        <div style={{ border: '3px solid #000', padding: 24, background: '#fff', marginBottom: 24 }}>
          <ResultsCharts samples={accuracySamples} />
        </div>
      )}

      {/* Session details */}
      <div className="section-box">
        <div className="section-header">SESSION DETAILS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            ['KEYSTROKES', session.total_keystrokes],
            ['CORRECT', session.correct_keystrokes],
            ['DURATION', `${session.duration_seconds}s`],
            ['WORDS', Math.round((session.total_keystrokes) / 5)],
          ].map(([label, val], i) => (
            <div key={String(label)} style={{
              padding: '16px 24px',
              borderRight: i < 3 ? '3px solid #000' : 'none',
              textAlign: 'center'
            }}>
              <div className="label-sm">{label}</div>
              <div style={{ fontFamily: 'Arial Black', fontSize: 20, color: '#000', marginTop: 8, fontWeight: 900 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
        <Link href="/dashboard" className="btn btn-inverted" style={{ flex: 1, padding: '24px', fontSize: 20, justifyContent: 'center' }}>
          NEXT AD →
        </Link>
        <Link href="/leaderboard" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
          LEADERBOARD
        </Link>
      </div>
    </div>
  )
}
