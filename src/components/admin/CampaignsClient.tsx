// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CampaignForm from '@/components/admin/CampaignForm'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/lib/supabase/types'

interface Props {
  campaigns: Campaign[]
}

export default function CampaignsClient({ campaigns }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)

  const toggleActive = async (campaign: Campaign) => {
    await supabase
      .from('campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaign.id)
    router.refresh()
  }

  const downloadCSV = async (campaign: Campaign) => {
    const { data: sessions } = await supabase
      .from('typing_sessions')
      .select('id, user_id, wpm, accuracy, status, points_earned, completed_at')
      .eq('campaign_id', campaign.id)

    if (!sessions?.length) return

    const headers = ['session_id', 'user_id', 'wpm', 'accuracy', 'status', 'points_earned', 'completed_at']
    const rows = sessions.map(s => [s.id, s.user_id, s.wpm, s.accuracy, s.status, s.points_earned, s.completed_at])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.brand_name.replace(/\s/g, '_')}_report.csv`
    a.click()
  }

  return (
    <div>
      <div style={{ padding: '16px 24px', borderBottom: '3px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>CAMPAIGNS</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn btn-inverted">
          + NEW CAMPAIGN
        </button>
      </div>

      <div style={{ padding: '24px clamp(12px, 4vw, 24px)' }}>
        <div className="table-scroll-wrapper" style={{ border: '3px solid #000' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>BRAND</th>
                <th>COMPLETIONS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--grey-mid)' }}>
                    No campaigns yet. Create one above.
                  </td>
                </tr>
              )}
              {campaigns.map(campaign => (
                <tr key={campaign.id}>
                  <td>
                    <div style={{ fontFamily: 'Arial Black', fontSize: 12, fontWeight: 900 }}>{campaign.brand_name}</div>
                    <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {campaign.ad_text}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'Courier New', fontWeight: 700 }}>{campaign.completions_count}</td>
                  <td>
                    <span className={`badge ${campaign.is_active ? 'badge-fulfilled' : 'badge-pending'}`}>
                      {campaign.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditing(campaign); setShowForm(true) }} className="btn btn-sm">
                        EDIT
                      </button>
                      <button onClick={() => toggleActive(campaign)} className="btn btn-sm">
                        {campaign.is_active ? 'PAUSE' : 'ACTIVATE'}
                      </button>
                      <button onClick={() => downloadCSV(campaign)} className="btn btn-sm">
                        CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CampaignForm
          campaign={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
