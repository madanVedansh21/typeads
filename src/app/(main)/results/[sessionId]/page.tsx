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

  return (
    <div className="page-wrapper" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 32 }}>
        <div className="label-sm">DISPATCH REPORT</div>
        <h1 className="font-headline" style={{ fontSize: 42, marginTop: 12 }}>
          {isFlagged ? 'SESSION FLAGGED' : 'SESSION COMPLETE'}
        </h1>
        {isFlagged && (
          <div style={{ background: 'var(--stamp-red)', color: 'var(--white)', padding: 12, marginTop: 16 }} className="label-sm">
            THIS SESSION WAS FLAGGED FOR REVIEW: {session.flag_reason}. POINTS ARE HELD PENDING ADMIN REVIEW.
          </div>
        )}
      </div>

      {/* Stats ledger */}
      <div className="editorial-box" style={{ marginBottom: 32, padding: 0 }}>
        <div className="box-label" style={{ padding: '12px 16px', margin: 0 }}>PERFORMANCE LEDGER</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'WPM', value: session.wpm, sub: `AVG: ${avgWpm}` },
            { label: 'ACCURACY', value: `${session.accuracy}%`, sub: '' },
            { label: 'POINTS EARNED', value: isFlagged ? '0*' : `+${session.points_earned}`, sub: isFlagged ? 'PENDING REVIEW' : 'ADDED TO WALLET' },
            { label: 'TOTAL BALANCE', value: (profile?.points_balance ?? 0).toLocaleString(), sub: 'CURRENT' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '24px 16px',
                borderRight: i < 3 ? '1px solid var(--paper-darker)' : 'none',
                textAlign: 'center',
              }}
            >
              <div className="label-sm" style={{ marginBottom: 12 }}>{stat.label}</div>
              <div className="stat-number">{stat.value}</div>
              {stat.sub && (
                <div style={{ fontFamily: 'var(--font-courier)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 8, fontWeight: 700 }}>
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      {accuracySamples.length > 1 && (
        <div className="editorial-box" style={{ marginBottom: 32 }}>
          <div className="box-label">TELEMETRY</div>
          <ResultsCharts samples={accuracySamples} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
        <Link href="/dashboard" className="btn btn-inverted" style={{ flex: 1, padding: '20px', fontSize: 16 }}>
          NEXT DISPATCH →
        </Link>
        <Link href="/leaderboard" className="btn" style={{ flex: 1 }}>
          VIEW LEADERBOARD
        </Link>
      </div>
    </div>
  )
}
