// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const navItems = [
    { href: '/admin/campaigns', label: 'CAMPAIGNS' },
    { href: '/admin/redemptions', label: 'REDEMPTIONS' },
    { href: '/admin/users', label: 'USERS' },
  ]

  return (
    <div style={{ paddingTop: 52 }}>
      {/* Admin topbar */}
      <div style={{
        background: '#000', color: '#fff',
        borderBottom: '3px solid #000',
        padding: '0 24px', height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', color: '#fff' }}>
            ADMIN PANEL
          </span>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              fontFamily: 'Arial', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#888', textDecoration: 'none',
              padding: '0 12px', height: 44, display: 'flex', alignItems: 'center'
            }}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link href="/dashboard" style={{
          fontFamily: 'Arial', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#555', textDecoration: 'none'
        }}>
          ← USER DASHBOARD
        </Link>
      </div>
      {children}
    </div>
  )
}
