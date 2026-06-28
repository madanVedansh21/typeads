'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  wpm: number
  accuracy: number
  brand: string
  test_mode: string
  time_limit: number | null
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '2px solid #000', padding: '8px 12px' }}>
        <p style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ fontFamily: 'Arial Black', fontSize: 13, fontWeight: 900 }}>
            {entry.name}: {entry.value}{entry.name === 'ACCURACY' ? '%' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ProfileCharts({ data }: { data: DataPoint[] }) {
  const [filterMode, setFilterMode] = useState<string | 'all'>('all')
  const [filterTime, setFilterTime] = useState<number | 'words' | 'all'>('all')

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const modeMatch = filterMode === 'all' || d.test_mode === filterMode
      const timeMatch = filterTime === 'all' || 
                       (filterTime === 'words' && d.time_limit === null) || 
                       (d.time_limit === filterTime)
      return modeMatch && timeMatch
    })
  }, [data, filterMode, filterTime])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--paper-darker)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="label-sm" style={{ marginRight: 8 }}>MODE:</span>
          {['all', 'jumbled', 'exact'].map(m => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              style={{ background: filterMode === m ? 'var(--ink)' : 'transparent', color: filterMode === m ? 'var(--paper)' : 'var(--ink-faint)', border: '1px solid ' + (filterMode === m ? 'var(--ink)' : 'var(--paper-darker)'), padding: '4px 8px', fontFamily: 'var(--font-courier)', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ width: 1, background: 'var(--paper-darker)' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="label-sm" style={{ marginRight: 8 }}>TIME:</span>
          {['all', 15, 30, 60, 120, 'words'].map(t => (
            <button
              key={t}
              onClick={() => setFilterTime(t as any)}
              style={{ background: filterTime === t ? 'var(--ink)' : 'transparent', color: filterTime === t ? 'var(--paper)' : 'var(--ink-faint)', border: '1px solid ' + (filterTime === t ? 'var(--ink)' : 'var(--paper-darker)'), padding: '4px 8px', fontFamily: 'var(--font-courier)', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>WPM TREND</div>
        <div style={{ border: '2px solid #eee' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} />
              <YAxis tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="wpm" name="WPM" stroke="#000" strokeWidth={2} dot={{ r: 3, fill: '#000' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>ACCURACY TREND</div>
        <div style={{ border: '2px solid #eee' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} />
              <YAxis domain={[0, 100]} tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="accuracy" name="ACCURACY" stroke="#000" strokeWidth={2} dot={{ r: 3, fill: '#000' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', fontFamily: 'var(--font-courier)', color: 'var(--ink-faint)', fontSize: 12 }}>
          No data matches the selected filters.
        </div>
      )}
    </div>
  )
}
