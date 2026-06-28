'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  users: Profile[]
  flaggedMap: Record<string, number>
}

export default function UsersClient({ users, flaggedMap }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const toggleBan = async (user: Profile) => {
    const action = user.is_banned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${action} @${user.username}?`)) return

    await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', user.id)

    router.refresh()
  }

  const filtered = users.filter(u =>
    !search ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ padding: '16px 24px', borderBottom: '3px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="font-brand" style={{ fontSize: 20, fontWeight: 900 }}>USER MANAGEMENT</h1>
        <input
          type="text"
          className="input-brutal"
          placeholder="Search username or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <div style={{ padding: 24 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '3px solid #000', marginBottom: 24 }}>
          {[
            ['TOTAL USERS', users.length],
            ['BANNED', users.filter(u => u.is_banned).length],
            ['ADMINS', users.filter(u => u.is_admin).length],
            ['WITH FLAGS', Object.keys(flaggedMap).length],
          ].map(([label, val], i) => (
            <div key={String(label)} style={{ padding: '12px 16px', borderRight: i < 3 ? '3px solid #000' : 'none' }}>
              <div className="label-sm">{label}</div>
              <div className="stat-number">{val}</div>
            </div>
          ))}
        </div>

        <div style={{ border: '3px solid #000' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>POINTS</th>
                <th>COMPLETIONS</th>
                <th>FLAGS</th>
                <th>JOINED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontFamily: 'Arial Black', fontSize: 12, fontWeight: 900 }}>
                      @{user.username}
                      {user.is_admin && (
                        <span className="badge badge-fulfilled" style={{ marginLeft: 6, fontSize: 8 }}>ADMIN</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>{user.email}</div>
                  </td>
                  <td style={{ fontFamily: 'Courier New' }}>{user.points_balance.toLocaleString()}</td>
                  <td style={{ fontFamily: 'Courier New' }}>{user.total_completions}</td>
                  <td>
                    {flaggedMap[user.id] ? (
                      <span className="badge badge-flagged">{flaggedMap[user.id]} FLAGGED</span>
                    ) : (
                      <span style={{ fontFamily: 'Arial', fontSize: 10, color: 'var(--grey-mid)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)' }}>
                    {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`badge ${user.is_banned ? 'badge-flagged' : user.is_admin ? 'badge-fulfilled' : 'badge-pending'}`}>
                      {user.is_banned ? 'BANNED' : user.is_admin ? 'ADMIN' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    {!user.is_admin && (
                      <button
                        onClick={() => toggleBan(user)}
                        className={`btn btn-sm ${user.is_banned ? '' : 'btn-danger'}`}
                      >
                        {user.is_banned ? 'UNBAN' : 'BAN'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
