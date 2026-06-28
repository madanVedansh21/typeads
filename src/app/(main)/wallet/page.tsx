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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div className="section-box">
        <div style={{ padding: '16px 24px', borderBottom: '3px solid #000' }}>
          <h1 className="font-brand" style={{ fontSize: 24, fontWeight: 900 }}>POINTS WALLET</h1>
          <p style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', marginTop: 4 }}>
            TRANSACTION HISTORY. 100 POINTS = ₹10 GIFT CARD VALUE.
          </p>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'CURRENT BALANCE', value: (profile?.points_balance ?? 0).toLocaleString() },
            { label: 'TOTAL EARNED', value: totalEarned.toLocaleString() },
            { label: 'TOTAL REDEEMED', value: totalRedeemed.toLocaleString() },
            { label: 'INR VALUE', value: `₹${Math.floor((profile?.points_balance ?? 0) / 10)}` },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '24px 16px', borderRight: i < 3 ? '3px solid #000' : 'none', textAlign: 'center' }}>
              <div className="label-sm" style={{ marginBottom: 8 }}>{stat.label}</div>
              <div className="stat-number">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="section-box">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ borderRight: '3px solid #000' }}>TYPE</th>
              <th style={{ borderRight: '3px solid #000' }}>DESCRIPTION</th>
              <th style={{ textAlign: 'right', borderRight: '3px solid #000' }}>AMOUNT</th>
              <th style={{ textAlign: 'right' }}>DATE</th>
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
                <td style={{ borderRight: '3px solid #000' }}>
                  <span className={`badge ${tx.type === 'earned' ? 'badge-solid' : ''}`}>
                    {tx.type}
                  </span>
                </td>
                <td style={{ fontFamily: 'Arial', fontSize: 12, borderRight: '3px solid #000' }}>{tx.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'Courier New', fontSize: 14, fontWeight: 900, color: '#000', borderRight: '3px solid #000' }}>
                  {tx.type === 'earned' ? '+' : '-'}{tx.amount.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
                  {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
