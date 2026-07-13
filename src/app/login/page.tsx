'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('message') === 'account_deleted') {
      setNotice('Your account credentials and history have been successfully terminated from the ledger.')
    }
  }, [])

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

    router.push('/')
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
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 8vw, 64px) clamp(16px, 4vw, 24px)' }}>
      
      <div style={{ width: '100%', maxWidth: 500 }}>
        
        {/* LOGO & TITLE */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Link href="/" className="font-headline" style={{ textDecoration: 'none', fontSize: 'clamp(24px, 5vw, 32px)', letterSpacing: '0.05em' }}>
            TYPEADS
          </Link>
          <div className="label-sm" style={{ marginTop: 8 }}>
            AUTHORIZATION LEDGER
          </div>
        </div>

        <div className="editorial-box">
          <div className="box-label" style={{ textAlign: 'center' }}>
            LOG IN TO CONTINUE
          </div>

          <div style={{ padding: '24px 16px' }}>
            <h1 className="font-headline" style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 8, textAlign: 'center' }}>
              Welcome Back
            </h1>
            <p className="font-subheadline" style={{ fontSize: 18, color: 'var(--ink-faint)', textAlign: 'center', marginBottom: 32 }}>
              Present your credentials to access the dispatch.
            </p>

            {notice && (
              <div style={{ background: 'var(--stamp-navy)', color: 'var(--white)', padding: 12, marginBottom: 24, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-courier)' }}>
                NOTICE: {notice}
              </div>
            )}

            {error && (
              <div style={{ background: 'var(--stamp-red)', color: 'var(--white)', padding: 12, marginBottom: 24, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-courier)' }}>
                ERROR: {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div>
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input-editorial"
                  placeholder="typist@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input-editorial"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'AUTHENTICATING...' : 'LOG IN TO DASHBOARD'}
              </button>
            </form>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              margin: '32px 0'
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--paper-darker)' }} />
              <span className="label-sm" style={{ color: 'var(--ink-faint)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--paper-darker)' }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="btn btn-inverted"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              CONTINUE WITH GOOGLE
            </button>
          </div>
        </div>

        <p className="font-body" style={{
          marginTop: 32,
          color: 'var(--ink-faint)', textAlign: 'center'
        }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}>
            Request Assignment
          </Link>
        </p>

      </div>
    </div>
  )
}
