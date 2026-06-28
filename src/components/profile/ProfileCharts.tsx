'use client'

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="label-sm" style={{ marginBottom: 8 }}>WPM TREND</div>
        <div style={{ border: '2px solid #eee' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
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
            <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} />
              <YAxis domain={[0, 100]} tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }} tickLine={false} axisLine={{ stroke: '#000' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="accuracy" name="ACCURACY" stroke="#000" strokeWidth={2} dot={{ r: 3, fill: '#000' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
