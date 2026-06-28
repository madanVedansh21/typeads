import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 52, borderBottom: '3px solid #222'
      }}>
        <span className="logo" style={{ color: '#fff' }}>TYPEADS</span>
        <div style={{ display: 'flex', gap: 0 }}>
          <Link href="/login" className="btn btn-sm" style={{ borderColor: '#333', color: '#fff', background: 'transparent' }}>
            LOG IN
          </Link>
          <Link href="/signup" className="btn btn-sm btn-inverted" style={{ marginLeft: 8 }}>
            SIGN UP — FREE
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        borderBottom: '3px solid #111',
        padding: '80px 32px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        alignItems: 'center',
        maxWidth: 1200, margin: '0 auto'
      }}>
        <div style={{ borderRight: '3px solid #222', paddingRight: 48 }}>
          <p className="label-sm" style={{ color: '#555', marginBottom: 16 }}>
            THE WORLD&apos;S FIRST AD TYPING PLATFORM
          </p>
          <h1 style={{
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontWeight: 900,
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: 24
          }}>
            TYPE ADS.<br />EARN REAL<br />REWARDS.
          </h1>
          <p style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 16,
            lineHeight: 1.7,
            color: '#888',
            marginBottom: 40,
            maxWidth: 440
          }}>
            Every word you type on TypeAds is a real advertisement.
            As you type, the ad image reveals itself tile by tile.
            Complete ads, earn points, redeem for gift cards.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/signup" className="btn btn-lg btn-inverted">
              START TYPING FREE
            </Link>
            <Link href="/leaderboard" className="btn btn-lg" style={{ borderColor: '#333', color: '#fff', background: 'transparent' }}>
              VIEW LEADERBOARD
            </Link>
          </div>
        </div>

        {/* MOCK DEMO */}
        <div style={{ paddingLeft: 48 }}>
          <div style={{ border: '3px solid #222', background: '#0a0a0a' }}>
            <div style={{ padding: '8px 12px', borderBottom: '2px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Arial Black', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase' }}>AD IN PROGRESS</span>
              <span style={{ fontFamily: 'Arial Black', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase' }}>67% REVEALED</span>
            </div>
            {/* Tile grid demo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(3, 40px)', borderBottom: '2px solid #222' }}>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} style={{
                  background: i < 16 ? '#fff' : '#1a1a1a',
                  borderRight: i % 8 !== 7 ? '1px solid #222' : 'none',
                  borderBottom: i < 16 ? '1px solid #ddd' : '1px solid #222',
                  transition: 'background 0.35s ease'
                }} />
              ))}
            </div>
            <div style={{ padding: '16px 12px' }}>
              <p style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 14,
                lineHeight: 1.9,
                color: '#fff'
              }}>
                <span style={{ color: '#bbb' }}>The future of advertising is </span>
                <span style={{ color: '#bbb' }}>interactive. Every impression </span>
                <span style={{ color: '#bbb' }}>counts when </span>
                <span style={{ background: '#000', color: '#fff', padding: '0 1px' }}>t</span>
                <span>ypists read your brand copy</span>
              </p>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: '2px solid #222'
            }}>
              {[['WPM', '73'], ['ACCURACY', '96%'], ['POINTS', '+100']].map(([label, val]) => (
                <div key={label} style={{
                  padding: '10px 12px',
                  borderRight: '2px solid #222',
                }}>
                  <div className="label-sm" style={{ color: '#555' }}>{label}</div>
                  <div className="stat-number" style={{ color: '#fff', fontSize: 18, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto', borderBottom: '3px solid #111' }}>
        <p className="label-sm" style={{ color: '#555', marginBottom: 40, textAlign: 'center' }}>HOW IT WORKS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { n: '01', title: 'SIGN UP', desc: 'Create your account in seconds. Email or Google OAuth.' },
            { n: '02', title: 'PICK AN AD', desc: 'Browse the ad queue. See brand, points reward, and estimated time.' },
            { n: '03', title: 'TYPE TO REVEAL', desc: 'Type the ad copy. The image progressively reveals as you type.' },
            { n: '04', title: 'EARN & REDEEM', desc: 'Complete ads to earn points. Redeem for Amazon, Flipkart, Swiggy gift cards.' },
          ].map((step, i) => (
            <div key={step.n} style={{
              borderRight: i < 3 ? '3px solid #111' : 'none',
              padding: '24px'
            }}>
              <div style={{
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 48,
                fontWeight: 900,
                color: '#111',
                lineHeight: 1,
                marginBottom: 16
              }}>{step.n}</div>
              <h3 style={{
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '0.08em',
                color: '#fff',
                marginBottom: 10
              }}>{step.title}</h3>
              <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS ROW */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: '3px solid #111',
        maxWidth: 1200, margin: '0 auto'
      }}>
        {[
          ['200+', 'TYPISTS WORLDWIDE'],
          ['1,000+', 'ADS COMPLETED'],
          ['₹50K+', 'REWARDS DISTRIBUTED'],
        ].map(([num, label], i) => (
          <div key={label} style={{
            borderRight: i < 2 ? '3px solid #111' : 'none',
            padding: '32px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Arial Black, Arial, sans-serif',
              fontSize: 42,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1
            }}>{num}</div>
            <div className="label-sm" style={{ color: '#444', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: 40,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 24
        }}>READY TO START EARNING?</h2>
        <Link href="/signup" className="btn btn-lg btn-inverted">
          CREATE FREE ACCOUNT
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '3px solid #111',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span className="logo" style={{ color: '#333', fontSize: 13 }}>TYPEADS</span>
        <span style={{ fontFamily: 'Arial', fontSize: 11, color: '#333' }}>
          © 2026 TypeAds. All rights reserved.
        </span>
      </footer>
    </main>
  )
}
