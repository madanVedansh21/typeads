import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: 'var(--font-im-fell), Georgia, serif',
      }}
    >
      {/* Editorial Telegram Box */}
      <div
        className="editorial-box"
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--paper-dark)',
          border: '2px solid var(--ink)',
          padding: '48px 36px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
        }}
      >
        {/* Label block */}
        <div className="box-label" style={{ letterSpacing: '0.2em', margin: '-48px -36px 32px -36px' }}>
          OFFICIAL DISPATCH • STATUS: 404
        </div>

        {/* Vintage Sloth Image */}
        <div style={{ margin: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/sloth.png"
            alt="Confused Sloth Mascot"
            width={120}
            height={120}
            style={{
              filter: 'grayscale(0.3) contrast(1.1) sepia(0.2)',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Headline */}
        <h1
          className="font-headline"
          style={{
            fontSize: 42,
            margin: '24px 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}
        >
          DISPATCH LOST IN TRANSIT
        </h1>

        {/* Description */}
        <p
          className="font-body"
          style={{
            color: 'var(--ink-light)',
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 36,
          }}
        >
          The archive document you requested could not be retrieved. It may have been retired from our active campaign registers, or the routing address was mistyped.
        </p>

        {/* Vintage Style "RETURN TO SENDER" Stamp */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            border: '3px double var(--stamp-red)',
            color: 'var(--stamp-red)',
            fontFamily: 'var(--font-courier)',
            fontSize: 13,
            fontWeight: 900,
            padding: '8px 16px',
            transform: 'rotate(-12deg)',
            opacity: 0.8,
            letterSpacing: '0.1em',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          RETURN TO SENDER
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            className="btn btn-inverted"
            style={{
              width: 280,
              padding: '16px',
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ← BACK TO HOME
          </Link>
          <Link
            href="/typing"
            className="btn"
            style={{
              width: 280,
              padding: '16px',
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            START TYPING DISPATCHES →
          </Link>
        </div>
      </div>
    </div>
  )
}
