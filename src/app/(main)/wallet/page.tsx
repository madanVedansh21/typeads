import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('points_balance, total_completions')
    .eq('id', user!.id)
    .single()

  const { data: transactions } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const totalEarned = transactions?.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.amount, 0) ?? 0
  const totalRedeemed = transactions?.filter(t => t.type === 'redeemed').reduce((sum, t) => sum + t.amount, 0) ?? 0

  return (
    <div>
      {/* Stats */}
      <div className="stats-bar">
        <div className="stats-bar-cell">
          <div className="label-sm">CURRENT BALANCE</div>
          <div className="stat-number">{(profile?.points_balance ?? 0).toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">TOTAL EARNED</div>
          <div className="stat-number">{totalEarned.toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">TOTAL REDEEMED</div>
          <div className="stat-number">{totalRedeemed.toLocaleString()}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">INR VALUE</div>
          <div className="stat-number">₹{Math.floor((profile?.points_balance ?? 0) / 10)}</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '3px solid #000' }}>
        <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>POINTS WALLET</h1>
        <p style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', marginTop: 2 }}>
          Full transaction history. 100 points = ₹10 gift card value.
        </p>
      </div>

      {/* Transactions table */}
      <div style={{ padding: 24 }}>
        <div style={{ border: '3px solid #000' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--grey-mid)', fontFamily: 'Arial', fontSize: 12 }}>
                    No transactions yet. Start typing ads to earn points.
                  </td>
                </tr>
              )}
              {transactions?.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <span className={`badge ${tx.type === 'earned' ? 'badge-fulfilled' : 'badge-pending'}`}>
                      {tx.type === 'earned' ? 'EARNED' : 'REDEEMED'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Arial', fontSize: 12 }}>{tx.description}</td>
                  <td style={{
                    fontFamily: 'Courier New', fontSize: 14, fontWeight: 700,
                    color: tx.type === 'earned' ? '#000' : 'var(--grey-mid)'
                  }}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
                    {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
