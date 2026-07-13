'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUserAccount } from '@/app/(main)/profile/actions'

interface Props {
  username: string
}

export default function DeleteAccountButton({ username }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (confirmationInput !== username) {
      setError('Username does not match.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await deleteUserAccount()
      if (res.success) {
        setIsOpen(false)
        router.push('/login?message=account_deleted')
        router.refresh()
      } else {
        setError(res.message || 'Failed to delete account.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  const isConfirmed = confirmationInput === username

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true)
          setConfirmationInput('')
          setError('')
        }}
        className="btn"
        style={{
          borderColor: 'var(--stamp-red)',
          color: 'var(--stamp-red)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--stamp-red)'
          e.currentTarget.style.color = 'var(--white)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--stamp-red)'
        }}
      >
        TERMINATE CREDENTIALS
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 17, 8, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="editorial-box" style={{
            maxWidth: 500,
            width: '100%',
            backgroundColor: 'var(--paper)',
            padding: 0,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}>
            <div className="box-label" style={{
              backgroundColor: 'var(--stamp-red)',
              color: 'var(--white)',
              borderColor: 'var(--stamp-red)',
              margin: 0,
              padding: '12px 24px',
              textAlign: 'center',
              fontWeight: 700,
              letterSpacing: '0.15em'
            }}>
              DESTRUCTION CONFIRMATION
            </div>

            <div style={{ padding: '24px 20px' }}>
              <h2 className="font-headline" style={{ fontSize: 24, marginBottom: 16, color: 'var(--stamp-red)' }}>
                Irreversible Action
              </h2>
              
              <p className="font-body" style={{ fontSize: 16, lineHeight: '1.6', color: 'var(--ink)', marginBottom: 20 }}>
                This will permanently delete your account, your points balance, and all associated typing history. It cannot be undone.
              </p>

              <div style={{
                background: 'rgba(139, 32, 32, 0.08)',
                borderLeft: '4px solid var(--stamp-red)',
                padding: '12px 16px',
                marginBottom: 20,
              }}>
                <span className="label-sm" style={{ color: 'var(--stamp-red)', display: 'block', marginBottom: 4 }}>
                  REQUIRED PROTOCOL
                </span>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
                  Please type <strong style={{ color: 'var(--stamp-red)' }}>{username}</strong> below to authorize termination:
                </span>
              </div>

              {error && (
                <div style={{
                  background: 'var(--stamp-red)',
                  color: 'var(--white)',
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-courier)'
                }}>
                  ERROR: {error}
                </div>
              )}

              <input
                type="text"
                className="input-editorial"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={username}
                disabled={loading}
                style={{ marginBottom: 24 }}
              />

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  ABORT
                </button>
                <button
                  type="button"
                  className="btn btn-inverted"
                  disabled={!isConfirmed || loading}
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    backgroundColor: isConfirmed && !loading ? 'var(--stamp-red)' : undefined,
                    borderColor: isConfirmed && !loading ? 'var(--stamp-red)' : undefined,
                    color: isConfirmed && !loading ? 'var(--white)' : undefined,
                  }}
                >
                  {loading ? 'PURGING...' : 'CONFIRM TERMINATION'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
