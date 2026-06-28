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
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
        <div className="editorial-box" style={{ maxWidth: 500, textAlign: 'center' }}>
          <div className="box-label">REGISTRATION SUCCESSFUL</div>
          <h2 className="font-headline" style={{ fontSize: 32, margin: '16px 0' }}>Verify Your Identity</h2>
          <p className="font-body" style={{ color: 'var(--ink-faint)', marginBottom: 32 }}>
            A verification dispatch has been sent to <strong>{email}</strong>. 
            Please review the document and follow the enclosed instructions to activate your credentials.
          </p>
          <Link href="/login" className="btn btn-inverted">
            RETURN TO LOG IN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
      
      <div style={{ width: '100%', maxWidth: 500 }}>
        
        {/* LOGO & TITLE */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Link href="/" className="font-headline" style={{ textDecoration: 'none', fontSize: 32, letterSpacing: '0.05em' }}>
            TYPEADS
          </Link>
          <div className="label-sm" style={{ marginTop: 8 }}>
            REGISTRY LEDGER
          </div>
        </div>

        <div className="editorial-box">
          <div className="box-label" style={{ textAlign: 'center' }}>
            NEW TYPIST REGISTRATION
          </div>

          <div style={{ padding: '24px 16px' }}>
            <h1 className="font-headline" style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>
              Create Account
            </h1>
            <p className="font-subheadline" style={{ fontSize: 18, color: 'var(--ink-faint)', textAlign: 'center', marginBottom: 32 }}>
              Join the dispatch. No fees required.
            </p>

            {error && (
              <div style={{ background: 'var(--stamp-red)', color: 'var(--white)', padding: 12, marginBottom: 24, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-courier)' }}>
                ERROR: {error}
              </div>
            )}

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div>
                <label className="form-label" htmlFor="username">Alias (Username)</label>
                <input
                  id="username"
                  type="text"
                  className="input-editorial"
                  placeholder="typist_pro"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="^[a-z0-9_]+$"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
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
                <label className="form-label" htmlFor="signup-password">Passcode (Min 8 Chars)</label>
                <input
                  id="signup-password"
                  type="password"
                  className="input-editorial"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'REGISTERING...' : 'REGISTER CREDENTIALS'}
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
              onClick={handleGoogleSignup}
              className="btn btn-inverted"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              REGISTER WITH GOOGLE
            </button>
          </div>
        </div>

        <p className="font-body" style={{
          marginTop: 32,
          color: 'var(--ink-faint)', textAlign: 'center'
        }}>
          Already a registered typist?{' '}
          <Link href="/login" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}>
            Access Ledger
          </Link>
        </p>

      </div>
    </div>
  )
}
