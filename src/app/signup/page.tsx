'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) setError(authError.message)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ border: '3px solid #000', padding: 40, maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Arial Black', fontSize: 40, fontWeight: 900, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontFamily: 'Arial Black', fontSize: 20, fontWeight: 900, marginBottom: 12 }}>CHECK YOUR EMAIL</h2>
          <p style={{ fontFamily: 'Arial', fontSize: 13, color: 'var(--grey-mid)', lineHeight: 1.6 }}>
            We sent a verification link to <strong>{email}</strong>. Click the link to activate your account and start earning.
          </p>
          <Link href="/login" className="btn" style={{ marginTop: 24, display: 'inline-block' }}>
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link href="/" className="logo" style={{ textDecoration: 'none', color: '#000', display: 'block', marginBottom: 48 }}>
          TYPEADS
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 className="font-brand" style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
            CREATE ACCOUNT
          </h1>
          <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
            Free. No credit card required. Start earning immediately.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input-brutal"
              placeholder="typist_pro"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-z0-9_]+$"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="input-brutal"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE FREE ACCOUNT'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: 'var(--grey-mid)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--grey-light)' }} />
          <span style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--grey-light)' }} />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="btn"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          SIGN UP WITH GOOGLE
        </button>

        <p style={{ marginTop: 24, fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', lineHeight: 1.5, textAlign: 'center' }}>
          By signing up you agree to our terms of service. No spam, ever.
        </p>

        <p style={{ marginTop: 16, fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#000', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.1em' }}>
            LOG IN
          </Link>
        </p>
      </div>

      <div className="auth-brand">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Arial Black', fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>500</div>
          <div className="label-sm" style={{ color: '#333', marginTop: 8 }}>POINTS = ₹50 GIFT CARD</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          {[
            ['AMAZON', '100–1000'],
            ['FLIPKART', '100–1000'],
            ['SWIGGY', '100–500'],
            ['ZOMATO', '100–500'],
            ['MYNTRA', '250–1000'],
          ].map(([brand, range]) => (
            <div key={brand} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: '2px solid #111', padding: '10px 16px'
            }}>
              <span style={{ fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>
                {brand}
              </span>
              <span style={{ fontFamily: 'Courier New', fontSize: 12, color: '#555' }}>₹{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
