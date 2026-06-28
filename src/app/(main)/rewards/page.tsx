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
    <div>
      {/* Stats */}
      <div className="stats-bar">
        <div className="stats-bar-cell">
          <div className="label-sm">POINTS BALANCE</div>
          <div className="stat-number">{(profile?.points_balance ?? 0).toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">= INR VALUE</div>
          <div className="stat-number">₹{Math.floor((profile?.points_balance ?? 0) / 10)}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">MIN TO REDEEM</div>
          <div className="stat-number">500 pts</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">ADS COMPLETED</div>
          <div className="stat-number">{profile?.total_completions ?? 0}/10</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '3px solid #000' }}>
        <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>REDEEM REWARDS</h1>
        <p style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', marginTop: 2 }}>
          100 points = ₹10 gift card value. Minimum redemption: 500 points.
        </p>
      </div>

      <RewardsClient
        giftCards={giftCards ?? []}
        pointsBalance={profile?.points_balance ?? 0}
        eligible={eligible}
        eligibilityReason={eligibilityReason}
      />

      {/* My redemptions */}
      <div style={{ margin: '0 24px 24px', border: '3px solid #000' }}>
        <div className="section-header">MY REDEMPTIONS</div>
        {!redemptions || redemptions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
              No redemptions yet. Complete ads to earn points and redeem above.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>GIFT CARD</th>
                <th>DENOMINATION</th>
                <th>POINTS COST</th>
                <th>STATUS</th>
                <th>CODE</th>
                <th>REQUESTED</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'Arial Black', fontWeight: 900, fontSize: 12 }}>
                    {r.gift_card_type.toUpperCase()}
                  </td>
                  <td style={{ fontFamily: 'Courier New' }}>₹{r.denomination}</td>
                  <td style={{ fontFamily: 'Courier New' }}>{r.points_cost.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status.toUpperCase()}</span>
                  </td>
                  <td style={{ fontFamily: 'Courier New', fontSize: 12 }}>
                    {r.gift_card_code
                      ? <span style={{ fontWeight: 700, background: '#eee', padding: '2px 8px', border: '1px solid #000' }}>{r.gift_card_code}</span>
                      : <span style={{ color: 'var(--grey-mid)' }}>PENDING</span>
                    }
                  </td>
                  <td style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
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
