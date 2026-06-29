'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Sample {
  char_index: number
  time_sec?: number
  accuracy: number
  wpm: number
}

interface Props {
  samples: Sample[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '2px solid #000', padding: '8px 12px' }}>
        <p style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}S
        </p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ fontFamily: 'Arial Black', fontSize: 13, fontWeight: 900, color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === 'ACCURACY' ? '%' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ResultsCharts({ samples }: Props) {
  const data = samples.map(s => {
    let t = s.time_sec;
    if (t === undefined) {
      // Fallback for older sessions: approximate time based on wpm and char_index
      t = Math.round((s.char_index / 5) / Math.max(s.wpm, 1) * 60);
    }
    return {
      time: t,
      ACCURACY: s.accuracy,
      WPM: s.wpm,
    }
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0, border: '3px solid #000' }}>
      {/* WPM Chart */}
      <div style={{ borderBottom: '2px solid #000', padding: 16 }}>
        <div className="label-sm" style={{ marginBottom: 12 }}>WPM OVER SESSION</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="time"
              tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={{ stroke: '#000' }}
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -15, fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
            />
            <YAxis
              tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={{ stroke: '#000' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="WPM"
              stroke="#000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy Chart */}
      <div style={{ padding: 16 }}>
        <div className="label-sm" style={{ marginBottom: 12 }}>ACCURACY OVER SESSION</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="time"
              tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={{ stroke: '#000' }}
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -15, fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontFamily: 'Arial', fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={{ stroke: '#000' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="ACCURACY"
              stroke="#000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
