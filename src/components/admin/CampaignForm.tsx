'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Campaign } from '@/lib/supabase/types'

const TILE_COLORS = [
  { label: 'CHARCOAL', value: '#222222' },
  { label: 'NAVY', value: '#0a1628' },
  { label: 'FOREST', value: '#0d1f0d' },
  { label: 'BURGUNDY', value: '#1a0008' },
  { label: 'SLATE', value: '#1c1c2e' },
  { label: 'RUST', value: '#1f0a00' },
]

interface Props {
  campaign?: Campaign | null
  onClose: () => void
}

export default function CampaignForm({ campaign, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState({
    brand_name: campaign?.brand_name ?? '',
    ad_text: campaign?.ad_text ?? '',
    points_reward: campaign?.points_reward ?? 100,
    completion_cap: campaign?.completion_cap ?? 500,
    tile_color: campaign?.tile_color ?? '#222222',
    is_active: campaign?.is_active ?? false,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let image_url = campaign?.image_url ?? null

      // Upload image if provided
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('ad-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      // Estimate time: ~60 WPM average
      const wordCount = form.ad_text.trim().split(/\s+/).length
      const estimated_time_seconds = Math.round((wordCount / 60) * 60)

      const payload = {
        brand_name: form.brand_name,
        ad_text: form.ad_text,
        points_reward: Number(form.points_reward),
        completion_cap: Number(form.completion_cap),
        tile_color: form.tile_color,
        is_active: form.is_active,
        image_url,
        estimated_time_seconds,
      }

      if (campaign?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('campaigns')
          .update(payload)
          .eq('id', campaign.id)
        if (updateError) throw updateError
      } else {
        // Insert
        const { data: { user } } = await supabase.auth.getUser()
        const { error: insertError } = await supabase
          .from('campaigns')
          .insert({ ...payload, created_by: user?.id })
        if (insertError) throw insertError
      }

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span>{campaign ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input type="text" className="input-brutal" value={form.brand_name}
              onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Ad Text</label>
            <textarea className="input-brutal" value={form.ad_text}
              onChange={e => setForm(p => ({ ...p, ad_text: e.target.value }))} required rows={5} />
            <span style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>
              {form.ad_text.trim().split(/\s+/).filter(Boolean).length} words · {form.ad_text.length} chars
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Points Reward</label>
              <input type="number" className="input-brutal" value={form.points_reward} min={10} max={1000}
                onChange={e => setForm(p => ({ ...p, points_reward: Number(e.target.value) }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Cap</label>
              <input type="number" className="input-brutal" value={form.completion_cap} min={1}
                onChange={e => setForm(p => ({ ...p, completion_cap: Number(e.target.value) }))} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tile Color (shown before reveal)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TILE_COLORS.map(c => (
                <button type="button" key={c.value}
                  onClick={() => setForm(p => ({ ...p, tile_color: c.value }))}
                  style={{
                    width: 32, height: 32,
                    background: c.value,
                    border: form.tile_color === c.value ? '3px solid #000' : '2px solid #ddd',
                    cursor: 'pointer',
                    title: c.label
                  }}
                />
              ))}
              <input type="color" value={form.tile_color}
                onChange={e => setForm(p => ({ ...p, tile_color: e.target.value }))}
                style={{ width: 32, height: 32, border: '2px solid #000', cursor: 'pointer', padding: 0 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ad Image (optional)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              style={{ fontFamily: 'Arial', fontSize: 12 }} />
            {campaign?.image_url && !imageFile && (
              <span style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
                Current: {campaign.image_url.split('/').pop()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="is_active" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
              ACTIVE (visible to typists)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '2px solid #eee', paddingTop: 16 }}>
            <button type="button" onClick={onClose} className="btn">CANCEL</button>
            <button type="submit" className="btn btn-inverted" disabled={loading}>
              {loading ? 'SAVING...' : campaign ? 'UPDATE CAMPAIGN' : 'CREATE CAMPAIGN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
