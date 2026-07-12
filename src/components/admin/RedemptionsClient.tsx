// @ts-nocheck
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RedemptionRequest } from '@/lib/supabase/types'

interface RedemptionWithUser extends RedemptionRequest {
  profiles: { username: string | null; email: string } | null
}

interface Props {
  redemptions: RedemptionWithUser[]
}

export default function RedemptionsClient({ redemptions }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [fulfilling, setFulfilling] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFulfill = async (redemption: RedemptionWithUser) => {
    if (!code.trim()) return
    setLoading(true)

    await supabase
      .from('redemption_requests')
      .update({
        status: 'fulfilled',
        gift_card_code: code.trim(),
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', redemption.id)

    setFulfilling(null)
    setCode('')
    setLoading(false)
    router.refresh()
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this redemption request? Points will NOT be refunded automatically.')) return

    await supabase
      .from('redemption_requests')
      .update({ status: 'rejected', admin_notes: 'Rejected by admin' })
      .eq('id', id)

    router.refresh()
  }

  return (
    <div>
      <div style={{ padding: '16px 24px', borderBottom: '3px solid #000' }}>
        <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>REDEMPTION REQUESTS</h1>
      </div>

      <div style={{ padding: '24px clamp(12px, 4vw, 24px)' }}>
        <div className="table-scroll-wrapper" style={{ border: '3px solid #000' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>GIFT CARD</th>
                <th>DENOMINATION</th>
                <th>POINTS COST</th>
                <th>STATUS</th>
                <th>REQUESTED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--grey-mid)' }}>
                    No redemption requests yet.
                  </td>
                </tr>
              )}
              {redemptions.map(r => (
                <>
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900 }}>
                        @{r.profiles?.username}
                      </div>
                      <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>
                        {r.profiles?.email}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Arial Black', fontWeight: 900, fontSize: 12 }}>
                      {r.gift_card_type.toUpperCase()}
                    </td>
                    <td style={{ fontFamily: 'Courier New' }}>₹{r.denomination}</td>
                    <td style={{ fontFamily: 'Courier New' }}>{r.points_cost.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{r.status.toUpperCase()}</span>
                    </td>
                    <td style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
                      {new Date(r.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => { setFulfilling(r.id); setCode('') }}
                            className="btn btn-sm btn-inverted"
                          >
                            FULFILL
                          </button>
                          <button onClick={() => handleReject(r.id)} className="btn btn-sm btn-danger">
                            REJECT
                          </button>
                        </div>
                      )}
                      {r.status === 'fulfilled' && r.gift_card_code && (
                        <span style={{ fontFamily: 'Courier New', fontSize: 11, background: '#eee', padding: '2px 8px', border: '1px solid #000' }}>
                          {r.gift_card_code}
                        </span>
                      )}
                    </td>
                  </tr>
                  {fulfilling === r.id && (
                    <tr key={`fulfill-${r.id}`}>
                      <td colSpan={7} style={{ padding: '12px 16px', background: '#f9f9f9', borderTop: '2px solid #000' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="label-sm">GIFT CARD CODE:</span>
                          <input
                            type="text"
                            className="input-brutal"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="Enter gift card code..."
                            style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
                            autoFocus
                          />
                          <button onClick={() => handleFulfill(r)} className="btn btn-inverted" disabled={loading || !code.trim()}>
                            {loading ? 'SAVING...' : 'MARK FULFILLED'}
                          </button>
                          <button onClick={() => setFulfilling(null)} className="btn">CANCEL</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
