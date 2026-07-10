// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import RewardsClient from '@/components/rewards/RewardsClient'

export const dynamic = 'force-dynamic'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: giftCards } = await supabase
    .from('gift_card_options')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: redemptions } = await supabase
    .from('redemption_requests')
    .select('*')
    .eq('user_id', user!.id)
    .order('requested_at', { ascending: false })

  // Eligibility checks
  const accountAgeDays = Math.floor((Date.now() - new Date(profile?.created_at ?? 0).getTime()) / (1000 * 60 * 60 * 24))
  const eligible = accountAgeDays >= 7 && (profile?.total_completions ?? 0) >= 10 && (profile?.points_balance ?? 0) >= 500

  let eligibilityReason: string | undefined
  if (accountAgeDays < 7) {
    eligibilityReason = `Account must be at least 7 days old to redeem. ${7 - accountAgeDays} day(s) remaining.`
  } else if ((profile?.total_completions ?? 0) < 10) {
    eligibilityReason = `Complete at least 10 ads to unlock redemption. ${10 - (profile?.total_completions ?? 0)} more needed.`
  } else if ((profile?.points_balance ?? 0) < 500) {
    eligibilityReason = `Minimum 500 points needed to redeem. You have ${profile?.points_balance ?? 0} points.`
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 32 }}>
        <div className="label-sm">TREASURY</div>
        <h1 className="font-headline" style={{ fontSize: 42, marginTop: 12 }}>
          REDEEM REWARDS
        </h1>
        <p className="font-body" style={{ color: 'var(--ink-light)', marginTop: 8 }}>
          100 POINTS = ₹10 GIFT CARD VALUE. MINIMUM REDEMPTION: 500 POINTS.
        </p>
      </div>

      <div className="editorial-box" style={{ padding: 0, marginBottom: 32 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'POINTS BALANCE', value: (profile?.points_balance ?? 0).toLocaleString() },
            { label: 'INR VALUE', value: `₹${Math.floor((profile?.points_balance ?? 0) / 10)}` },
            { label: 'MIN TO REDEEM', value: '500 PTS' },
            { label: 'ADS COMPLETED', value: `${profile?.total_completions ?? 0}/10` },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '24px 16px', borderRight: i < 3 ? '1px solid var(--paper-darker)' : 'none', textAlign: 'center' }}>
              <div className="label-sm" style={{ marginBottom: 12 }}>{stat.label}</div>
              <div className="stat-number">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <RewardsClient
        giftCards={giftCards ?? []}
        pointsBalance={profile?.points_balance ?? 0}
        eligible={eligible}
        eligibilityReason={eligibilityReason}
      />

      {/* My redemptions */}
      <div className="editorial-box" style={{ marginTop: 40, padding: 0 }}>
        <div className="box-label" style={{ padding: '16px 24px', margin: 0, borderBottom: '2px solid var(--ink)' }}>MY REDEMPTIONS</div>
        {!redemptions || redemptions.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p className="font-body" style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              No redemptions yet. Complete ads to earn points and redeem above.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ borderRight: '1px solid var(--paper-darker)', paddingLeft: 24 }}>GIFT CARD</th>
                <th style={{ borderRight: '1px solid var(--paper-darker)' }}>DENOMINATION</th>
                <th style={{ textAlign: 'right', borderRight: '1px solid var(--paper-darker)' }}>POINTS COST</th>
                <th style={{ borderRight: '1px solid var(--paper-darker)' }}>STATUS</th>
                <th style={{ borderRight: '1px solid var(--paper-darker)' }}>CODE</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>REQUESTED</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 16, borderRight: '1px solid var(--paper-darker)', paddingLeft: 24 }}>
                    {r.gift_card_type.toUpperCase()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-courier)', borderRight: '1px solid var(--paper-darker)', fontWeight: 700 }}>₹{r.denomination}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', borderRight: '1px solid var(--paper-darker)', fontWeight: 700 }}>{r.points_cost.toLocaleString()}</td>
                  <td style={{ borderRight: '1px solid var(--paper-darker)' }}>
                    <span className={`badge ${r.status === 'fulfilled' ? 'badge-solid' : ''}`}>{r.status.toUpperCase()}</span>
                  </td>
                  <td style={{ borderRight: '1px solid var(--paper-darker)' }}>
                    <div style={{ fontFamily: 'var(--font-courier)', fontSize: 13 }}>
                      {r.status === 'fulfilled'
                        ? <span style={{ fontWeight: 700, background: 'var(--ink)', color: 'var(--white)', padding: '4px 8px' }}>{r.gift_card_code}</span>
                        : <span style={{ color: 'var(--ink-faint)' }}>Processing...</span>
                      }
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontSize: 13, color: 'var(--ink-faint)', paddingRight: 24 }}>
                    {new Date(r.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
