'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

interface SessionData {
  id: string
  created_at: string
  wpm: number
  accuracy: number
  test_mode: string | null
  time_limit: number | null
}

interface Props {
  sessions: SessionData[]
}

export default function HistoryGraph({ sessions }: Props) {
  if (!sessions || sessions.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--font-courier)' }}>
        No history available to graph.
      </div>
    )
  }

  // Sort sessions chronologically
  const sorted = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const data = sorted.map((s, i) => ({
    index: i + 1,
    wpm: s.wpm,
    accuracy: s.accuracy,
    date: new Date(s.created_at).toLocaleDateString(),
    mode: `${s.time_limit ? `time ${s.time_limit}` : 'words'} | ${s.test_mode || 'jumbled'}`
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--paper-darker)', padding: '12px', fontFamily: 'var(--font-courier)', fontSize: 13 }}>
          <div style={{ marginBottom: 8, fontWeight: 700, color: 'var(--ink)' }}>Test #{label}</div>
          <div style={{ color: 'var(--stamp-navy)', fontWeight: 700 }}>WPM: {payload[0].value}</div>
          <div style={{ color: 'var(--stamp-red)' }}>ACC: {payload[1].value}%</div>
          <div style={{ color: 'var(--ink-faint)', marginTop: 8, fontSize: 11 }}>{payload[0].payload.date}</div>
          <div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>{payload[0].payload.mode}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: 300, marginTop: 16 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-darker)" vertical={false} />
          <XAxis dataKey="index" stroke="var(--ink-faint)" tick={{ fontFamily: 'var(--font-courier)', fontSize: 12 }} />
          <YAxis yAxisId="left" stroke="var(--stamp-navy)" tick={{ fontFamily: 'var(--font-courier)', fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="var(--stamp-red)" tick={{ fontFamily: 'var(--font-courier)', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="var(--stamp-navy)" strokeWidth={3} dot={{ r: 4, fill: 'var(--stamp-navy)' }} activeDot={{ r: 6 }} />
          <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="var(--stamp-red)" strokeWidth={2} dot={{ r: 3, fill: 'var(--stamp-red)' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
