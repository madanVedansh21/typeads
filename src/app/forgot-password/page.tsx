'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" className="logo" style={{ textDecoration: 'none', color: '#000', display: 'block', marginBottom: 48 }}>
          TYPEADS
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Arial Black', fontSize: 40, fontWeight: 900, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontFamily: 'Arial Black', fontSize: 20, fontWeight: 900, marginBottom: 12 }}>CHECK YOUR EMAIL</h2>
            <p style={{ fontFamily: 'Arial', fontSize: 13, color: 'var(--grey-mid)', lineHeight: 1.6 }}>
              If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link shortly.
            </p>
            <Link href="/login" className="btn" style={{ marginTop: 24, display: 'inline-block' }}>
              BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 className="font-brand" style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>RESET PASSWORD</h1>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)' }}>
                Enter your email address and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  className="input-brutal"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
            </form>

            <p style={{ marginTop: 24, fontFamily: 'Arial', fontSize: 12, color: 'var(--grey-mid)', textAlign: 'center' }}>
              Remembered?{' '}
              <Link href="/login" style={{ color: '#000', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.1em' }}>
                LOG IN
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
