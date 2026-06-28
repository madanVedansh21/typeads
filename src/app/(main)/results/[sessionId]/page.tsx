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

  const campaign = session.campaigns as { brand_name: string; ad_text: string; image_url: string | null; points_reward: number } | null
  const accuracySamples = (session.accuracy_samples as Array<{ char_index: number; accuracy: number; wpm: number }>) ?? []
  const isFlagged = session.is_flagged

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span className="brand-tag" style={{ marginBottom: 12, display: 'inline-block' }}>
          {campaign?.brand_name}
        </span>
        <h1 className="font-brand" style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
          {isFlagged ? 'SESSION FLAGGED' : 'SESSION COMPLETE'}
        </h1>
        {isFlagged && (
          <div className="alert alert-error" style={{ marginTop: 12, maxWidth: 600 }}>
            This session was flagged for review: {session.flag_reason}. Points are held pending admin review.
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #000', marginBottom: 24 }}>
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
              <div style={{ fontFamily: 'Arial', fontSize: 9, color: 'var(--grey-mid)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {stat.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      {accuracySamples.length > 1 && (
        <ResultsCharts samples={accuracySamples} />
      )}

      {/* Completed ad image full reveal */}
      {campaign?.image_url && (
        <div style={{ marginTop: 24 }}>
          <div className="label-sm" style={{ marginBottom: 8 }}>FULL AD CREATIVE</div>
          <div style={{ border: '3px solid #000', overflow: 'hidden', maxHeight: 300 }}>
            <img
              src={campaign.image_url}
              alt={`${campaign.brand_name} ad creative`}
              style={{ width: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}

      {/* Session details */}
      <div style={{ marginTop: 24, border: '3px solid #000' }}>
        <div className="section-header">SESSION DETAILS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            ['TOTAL KEYSTROKES', session.total_keystrokes],
            ['CORRECT KEYSTROKES', session.correct_keystrokes],
            ['DURATION', `${session.duration_seconds}s`],
            ['WORDS TYPED', Math.round((session.total_keystrokes) / 5)],
          ].map(([label, val], i) => (
            <div key={String(label)} style={{
              padding: '12px 16px',
              borderBottom: i < 2 ? '2px solid #000' : 'none',
              borderRight: i % 2 === 0 ? '2px solid #000' : 'none',
            }}>
              <div className="label-sm">{label}</div>
              <div style={{ fontFamily: 'Arial Black', fontSize: 18, fontWeight: 900, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <Link href="/dashboard" className="btn btn-lg">
          ← BACK TO QUEUE
        </Link>
        <Link href="/rewards" className="btn btn-lg btn-inverted">
          REDEEM POINTS →
        </Link>
        <Link href="/leaderboard" className="btn btn-lg">
          VIEW LEADERBOARD
        </Link>
      </div>
    </div>
  )
}
