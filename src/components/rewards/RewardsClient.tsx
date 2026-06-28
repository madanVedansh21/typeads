'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { GiftCardOption } from '@/lib/supabase/types'

interface Props {
  giftCards: GiftCardOption[]
  pointsBalance: number
  eligible: boolean
  eligibilityReason?: string
}

export default function RewardsClient({ giftCards, pointsBalance, eligible, eligibilityReason }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [selected, setSelected] = useState<{ card: GiftCardOption; denomination: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const POINTS_PER_INR = 10  // 100 pts = ₹10

  const pointsCost = (denomination: number) => denomination * POINTS_PER_INR

  const handleRedeem = async () => {
    if (!selected) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const cost = pointsCost(selected.denomination)

    const response = await fetch('/api/redemptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gift_card_type: selected.card.slug,
        denomination: selected.denomination,
        points_cost: cost,
      }),
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      setError(result.error ?? 'Failed to submit redemption request.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setSelected(null)
    router.refresh()
  }

  return (
    <div>
      {!eligible && eligibilityReason && (
        <div className="alert" style={{ border: '3px solid #000', background: '#eee', margin: '16px 24px', padding: '12px 16px' }}>
          <span style={{ fontFamily: 'Arial', fontSize: 12, fontWeight: 700 }}>
            ⚠ {eligibilityReason}
          </span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ margin: '16px 24px' }}>
          ✓ Redemption request submitted! Your gift card will appear in &ldquo;My Redemptions&rdquo; once fulfilled.
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ margin: '16px 24px' }}>
          {error}
        </div>
      )}

      {/* Gift card options */}
      <div style={{ padding: 24 }}>
        <div className="label-sm" style={{ marginBottom: 16 }}>SELECT GIFT CARD</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 }}>
          {giftCards.map((card, i) => (
            <div key={card.id} style={{
              border: '3px solid #000',
              marginRight: -3, marginBottom: -3,
            }}>
              <div style={{ background: '#000', padding: '10px 16px' }}>
                <span style={{ fontFamily: 'Arial Black', fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.08em' }}>
                  {card.name.toUpperCase()}
                </span>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {card.denominations.map(denom => {
                  const cost = pointsCost(denom)
                  const canAfford = pointsBalance >= cost
                  const isSelected = selected?.card.id === card.id && selected?.denomination === denom

                  return (
                    <button
                      key={denom}
                      onClick={() => {
                        if (!eligible || !canAfford) return
                        setSelected({ card, denomination: denom })
                      }}
                      disabled={!eligible || !canAfford}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: isSelected ? '3px solid #000' : '2px solid #ddd',
                        background: isSelected ? '#000' : '#fff',
                        color: isSelected ? '#fff' : canAfford ? '#000' : '#bbb',
                        padding: '8px 12px',
                        cursor: eligible && canAfford ? 'pointer' : 'not-allowed',
                        transition: 'all 0.1s',
                        fontFamily: 'Arial Black',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      <span>₹{denom}</span>
                      <span style={{ fontFamily: 'Courier New', fontSize: 11 }}>{cost.toLocaleString()} pts</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm redemption */}
      {selected && (
        <div style={{
          position: 'sticky', bottom: 0, borderTop: '3px solid #000',
          background: '#fff', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div className="label-sm">SELECTED</div>
            <div style={{ fontFamily: 'Arial Black', fontSize: 16, fontWeight: 900 }}>
              {selected.card.name} ₹{selected.denomination}
            </div>
            <div style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
              Cost: {pointsCost(selected.denomination).toLocaleString()} pts · Remaining: {(pointsBalance - pointsCost(selected.denomination)).toLocaleString()} pts
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setSelected(null)} className="btn">CANCEL</button>
            <button onClick={handleRedeem} className="btn btn-inverted" disabled={loading}>
              {loading ? 'SUBMITTING...' : 'CONFIRM REDEMPTION'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
