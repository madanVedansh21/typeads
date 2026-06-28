'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

interface TopbarProps {
  profile: Profile | null
}

export default function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'DASHBOARD' },
    { href: '/leaderboard', label: 'LEADERBOARD' },
    { href: '/rewards', label: 'REWARDS' },
    { href: '/wallet', label: 'WALLET' },
    { href: `/profile/${profile?.username || ''}`, label: 'PROFILE' },
  ]

  return (
    <header className="topbar">
      <Link href="/dashboard" className="logo topbar-logo">TYPEADS</Link>

      <nav className="topbar-nav">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname.startsWith(link.href.split('/').slice(0, 2).join('/')) ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="topbar-points">
          <span>PTS</span>
          {profile?.points_balance?.toLocaleString() ?? '0'}
        </div>

        {profile?.is_admin && (
          <Link href="/admin" className="btn btn-sm" style={{ borderColor: 'var(--grey-dark)', color: '#fff', background: 'transparent' }}>
            ADMIN
          </Link>
        )}

        <button onClick={handleLogout} className="btn btn-sm" style={{ borderColor: 'var(--grey-dark)', color: '#fff', background: 'transparent' }}>
          LOGOUT
        </button>
      </div>
    </header>
  )
}
