// @ts-nocheck
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
    <div className="page-wrapper" style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 16, marginBottom: 32 }}>
        <div className="label-sm">ACCOUNTING</div>
        <h1 className="font-headline" style={{ fontSize: 42, marginTop: 12 }}>
          POINTS WALLET
        </h1>
        <p className="font-body" style={{ color: 'var(--ink-light)', marginTop: 8 }}>
          Transaction history. 100 POINTS = ₹10 GIFT CARD VALUE.
        </p>
      </div>

      <div className="editorial-box" style={{ padding: 0, marginBottom: 32 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'CURRENT BALANCE', value: (profile?.points_balance ?? 0).toLocaleString() },
            { label: 'TOTAL EARNED', value: totalEarned.toLocaleString() },
            { label: 'TOTAL REDEEMED', value: totalRedeemed.toLocaleString() },
            { label: 'INR VALUE', value: `₹${Math.floor((profile?.points_balance ?? 0) / 10)}` },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '24px 16px', borderRight: i < 3 ? '1px solid var(--paper-darker)' : 'none', textAlign: 'center' }}>
              <div className="label-sm" style={{ marginBottom: 12 }}>{stat.label}</div>
              <div className="stat-number">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="editorial-box" style={{ padding: 0 }}>
        <div className="box-label" style={{ padding: '16px 24px', margin: 0, borderBottom: '2px solid var(--ink)' }}>LEDGER ENTRIES</div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ borderRight: '1px solid var(--paper-darker)', paddingLeft: 24 }}>TYPE</th>
              <th style={{ borderRight: '1px solid var(--paper-darker)' }}>DESCRIPTION</th>
              <th style={{ textAlign: 'right', borderRight: '1px solid var(--paper-darker)' }}>AMOUNT</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 60 }}>
                  <span className="font-body" style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                    No transactions yet. Start typing ads to earn points.
                  </span>
                </td>
              </tr>
            )}
            {transactions?.map(tx => (
              <tr key={tx.id}>
                <td style={{ borderRight: '1px solid var(--paper-darker)', paddingLeft: 24 }}>
                  <span className={`badge ${tx.type === 'earned' ? 'badge-solid' : 'badge-stamp'}`}>
                    {tx.type}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-im-fell)', fontSize: 16, borderRight: '1px solid var(--paper-darker)' }}>{tx.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontSize: 16, fontWeight: 700, color: 'var(--ink)', borderRight: '1px solid var(--paper-darker)' }}>
                  {tx.type === 'earned' ? '+' : '-'}{tx.amount.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-courier)', fontSize: 13, color: 'var(--ink-faint)', paddingRight: 24 }}>
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
