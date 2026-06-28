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
        <div style={{ border: '1px solid var(--paper-darker)', background: 'var(--paper-dark)', marginBottom: 24, padding: '12px 16px' }}>
          <span className="font-body" style={{ fontStyle: 'italic', color: 'var(--ink)' }}>
            Note: {eligibilityReason}
          </span>
        </div>
      )}

      {success && (
        <div style={{ border: '1px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)', marginBottom: 24, padding: '12px 16px' }}>
          <span className="font-body" style={{ fontWeight: 700 }}>
            Redemption request submitted. Your gift card will appear in the ledger below once fulfilled.
          </span>
        </div>
      )}

      {error && (
        <div style={{ border: '1px solid var(--stamp-red)', background: 'var(--paper)', color: 'var(--stamp-red)', marginBottom: 24, padding: '12px 16px' }}>
          <span className="font-body" style={{ fontWeight: 700 }}>{error}</span>
        </div>
      )}

      {/* Gift card options */}
      <div className="editorial-box" style={{ padding: 0 }}>
        <div className="box-label" style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--paper-darker)' }}>SELECT GIFT CARD</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0, padding: 24 }}>
          {giftCards.map((card, i) => (
            <div key={card.id} style={{
              border: '1px solid var(--ink)',
              marginRight: -1, marginBottom: -1,
            }}>
              <div style={{ background: 'var(--ink)', padding: '10px 16px' }}>
                <span style={{ fontFamily: 'var(--font-libre)', fontSize: 13, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {card.name}
                </span>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--paper)' }}>
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
                        border: isSelected ? '1px solid var(--ink)' : '1px solid var(--paper-darker)',
                        background: isSelected ? 'var(--paper-dark)' : 'var(--paper)',
                        color: isSelected ? 'var(--ink)' : canAfford ? 'var(--ink)' : 'var(--ink-faint)',
                        padding: '8px 12px',
                        cursor: eligible && canAfford ? 'pointer' : 'not-allowed',
                        transition: 'all 0.1s',
                        fontFamily: 'var(--font-libre)',
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-im-fell)', fontSize: 16 }}>₹{denom}</span>
                      <span style={{ fontFamily: 'var(--font-courier)', fontSize: 11 }}>{cost.toLocaleString()} pts</span>
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
          position: 'sticky', bottom: 0, borderTop: '2px solid var(--ink)',
          background: 'var(--paper)', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderLeft: '1px solid var(--ink)', borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)',
          marginTop: 24, zIndex: 10
        }}>
          <div>
            <div className="label-sm" style={{ marginBottom: 4 }}>SELECTED</div>
            <div className="font-headline" style={{ fontSize: 20 }}>
              {selected.card.name} ₹{selected.denomination}
            </div>
            <div style={{ fontFamily: 'var(--font-courier)', fontSize: 12, color: 'var(--ink-light)', marginTop: 4 }}>
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
