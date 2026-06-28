'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) setError(authError.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link href="/" className="logo" style={{ textDecoration: 'none', color: '#000', display: 'block', marginBottom: 48 }}>
          TYPEADS
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 className="font-brand" style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
            WELCOME BACK
          </h1>
          <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
            Log in to continue earning rewards.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-brutal"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-brutal"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div style={{ textAlign: 'right' }}>
              <Link href="/forgot-password" style={{
                fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)',
                textDecoration: 'none', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em'
              }}>
                FORGOT PASSWORD?
              </Link>
            </div>
          </div>

          <button type="submit" className="btn btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '24px 0', color: 'var(--grey-mid)'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--grey-light)' }} />
          <span style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--grey-light)' }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="btn"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <p style={{
          marginTop: 32, fontFamily: 'Arial', fontSize: 12,
          color: 'var(--grey-mid)', textAlign: 'center'
        }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#000', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.1em' }}>
            SIGN UP FREE
          </Link>
        </p>
      </div>

      <div className="auth-brand">
        <p className="label-sm" style={{ color: '#333', marginBottom: 24 }}>WHY TYPEADS?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
          {[
            ['TYPE TO REVEAL', 'As you type each ad, its image progressively reveals itself on screen.'],
            ['REAL REWARDS', 'Earn gift cards from Amazon, Flipkart, Swiggy — real monetary value.'],
            ['TRACK YOUR STATS', 'Monitor your WPM, accuracy, and earnings with live analytics.'],
          ].map(([title, desc]) => (
            <div key={title}>
              <h3 style={{ fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', marginBottom: 6 }}>
                {title}
              </h3>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#555', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
