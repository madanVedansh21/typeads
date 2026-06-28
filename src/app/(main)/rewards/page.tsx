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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div className="section-box">
        <div style={{ padding: '16px 24px', borderBottom: '3px solid #000' }}>
          <h1 className="font-brand" style={{ fontSize: 24, fontWeight: 900 }}>REDEEM REWARDS</h1>
          <p style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', marginTop: 4 }}>
            100 POINTS = ₹10 GIFT CARD VALUE. MINIMUM REDEMPTION: 500 POINTS.
          </p>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'POINTS BALANCE', value: (profile?.points_balance ?? 0).toLocaleString() },
            { label: 'INR VALUE', value: `₹${Math.floor((profile?.points_balance ?? 0) / 10)}` },
            { label: 'MIN TO REDEEM', value: '500 PTS' },
            { label: 'ADS COMPLETED', value: `${profile?.total_completions ?? 0}/10` },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '24px 16px', borderRight: i < 3 ? '3px solid #000' : 'none', textAlign: 'center' }}>
              <div className="label-sm" style={{ marginBottom: 8 }}>{stat.label}</div>
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
      <div className="section-box" style={{ marginTop: 40 }}>
        <div className="section-header">MY REDEMPTIONS</div>
        {!redemptions || redemptions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
              No redemptions yet. Complete ads to earn points and redeem above.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ borderRight: '3px solid #000' }}>GIFT CARD</th>
                <th style={{ borderRight: '3px solid #000' }}>DENOMINATION</th>
                <th style={{ textAlign: 'right', borderRight: '3px solid #000' }}>POINTS COST</th>
                <th style={{ borderRight: '3px solid #000' }}>STATUS</th>
                <th style={{ borderRight: '3px solid #000' }}>CODE</th>
                <th style={{ textAlign: 'right' }}>REQUESTED</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'Arial Black', fontWeight: 900, fontSize: 12, borderRight: '3px solid #000' }}>
                    {r.gift_card_type.toUpperCase()}
                  </td>
                  <td style={{ fontFamily: 'Courier New', borderRight: '3px solid #000', fontWeight: 700 }}>₹{r.denomination}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', borderRight: '3px solid #000', fontWeight: 700 }}>{r.points_cost.toLocaleString()}</td>
                  <td style={{ borderRight: '3px solid #000' }}>
                    <span className={`badge ${r.status === 'fulfilled' ? 'badge-solid' : ''}`}>{r.status.toUpperCase()}</span>
                  </td>
                  <td style={{ borderRight: '3px solid #000' }}>
                    <div style={{ fontFamily: 'Courier New', fontSize: 13 }}>
                      {r.status === 'fulfilled'
                        ? <span style={{ fontWeight: 900, background: '#000', color: '#fff', padding: '4px 8px', border: '3px solid #000' }}>{r.gift_card_code}</span>
                        : <span style={{ color: 'var(--grey-mid)' }}>Processing...</span>
                      }
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
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
