'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import TileGrid from './TileGrid'
import type { Campaign } from '@/lib/supabase/types'

interface KeystrokeRecord {
  key: string
  timestamp: number
  interval_ms: number
}

interface AccuracySample {
  char_index: number
  accuracy: number
  wpm: number
}

interface Props {
  campaign: Campaign
  userId: string
}

export default function TypingInterface({ campaign, userId }: Props) {
  const router = useRouter()
  const text = campaign.ad_text
  const chars = text.split('')
  const totalChars = chars.length

  // Typing state
  const [typed, setTyped] = useState<string[]>([]) // per-char status: 'correct'|'error'|'pending'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Stats
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0)

  // Anti-fraud / session data
  const keystrokesRef = useRef<KeystrokeRecord[]>([])
  const accuracySamplesRef = useRef<AccuracySample[]>([])
  const lastKeystrokeTimeRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const sessionIdRef = useRef<string>(uuidv4())

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // WPM / accuracy ticker
  useEffect(() => {
    if (!started || completed) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60
      const wordsTyped = currentIndex / 5
      setWpm(elapsed > 0 ? Math.round(wordsTyped / elapsed) : 0)
    }, 500)
    return () => clearInterval(interval)
  }, [started, completed, currentIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Block paste
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        return
      }

      const now = Date.now()
      const interval = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0
      lastKeystrokeTimeRef.current = now

      if (!started) {
        setStarted(true)
        startTimeRef.current = now
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          setCurrentIndex(newIndex)
          setTyped(prev => {
            const next = [...prev]
            next[newIndex] = 'pending'
            return next
          })
          setInputValue(prev => prev.slice(0, -1))
        }
        return
      }

      // Only process printable characters
      if (e.key.length !== 1) return

      e.preventDefault()

      const expectedChar = chars[currentIndex]
      const isCorrect = e.key === expectedChar

      // Record keystroke
      keystrokesRef.current.push({ key: e.key, timestamp: now, interval_ms: interval })
      const newTotal = totalKeystrokes + 1
      const newCorrect = correctKeystrokes + (isCorrect ? 1 : 0)
      setTotalKeystrokes(newTotal)
      setCorrectKeystrokes(newCorrect)

      const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100
      setAccuracy(newAccuracy)

      // Sample accuracy every 5 keystrokes
      if (newTotal % 5 === 0) {
        const elapsed = (now - startTimeRef.current) / 1000 / 60
        const wordsTyped = (currentIndex + 1) / 5
        const currentWpm = elapsed > 0 ? Math.round(wordsTyped / elapsed) : 0
        accuracySamplesRef.current.push({
          char_index: currentIndex,
          accuracy: newAccuracy,
          wpm: currentWpm,
        })
      }

      setTyped(prev => {
        const next = [...prev]
        next[currentIndex] = isCorrect ? 'correct' : 'error'
        return next
      })

      setInputValue(prev => prev + e.key)

      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)

      // Auto-complete on last character
      if (newIndex >= totalChars) {
        handleComplete(newTotal, newCorrect, newAccuracy)
      }
    },
    [started, currentIndex, totalChars, chars, totalKeystrokes, correctKeystrokes]
  )

  const handleComplete = async (
    finalTotal: number,
    finalCorrect: number,
    finalAccuracy: number
  ) => {
    setCompleted(true)
    setSubmitting(true)

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
    const elapsed = durationSeconds / 60
    const wordsTyped = totalChars / 5
    const finalWpm = elapsed > 0 ? Math.round(wordsTyped / elapsed) : 0

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          user_id: userId,
          campaign_id: campaign.id,
          wpm: finalWpm,
          accuracy: finalAccuracy,
          keystrokes_data: keystrokesRef.current,
          accuracy_samples: accuracySamplesRef.current,
          total_keystrokes: finalTotal,
          correct_keystrokes: finalCorrect,
          duration_seconds: durationSeconds,
        }),
      })

      const result = await response.json()
      setSubmitting(false)
      router.push(`/results/${sessionIdRef.current}`)
    } catch (err) {
      console.error('Session submit error:', err)
      setSubmitting(false)
      router.push(`/results/${sessionIdRef.current}`)
    }
  }

  const progress = totalChars > 0 ? currentIndex / totalChars : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-bar-cell">
          <div className="label-sm">WPM</div>
          <div className="stat-number">{wpm}</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">ACCURACY</div>
          <div className="stat-number">{accuracy}%</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">PROGRESS</div>
          <div className="stat-number">{Math.round(progress * 100)}%</div>
        </div>
        <div className="stats-bar-cell">
          <div className="label-sm">REWARD</div>
          <div className="stat-number">+{campaign.points_reward}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Main content: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', flex: 1, overflow: 'hidden', borderBottom: '3px solid #000' }}>
        {/* Left: Ad text */}
        <div style={{
          borderRight: '3px solid #000',
          padding: 32,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          {/* Brand tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="brand-tag">{campaign.brand_name}</span>
            {!started && (
              <span style={{ fontFamily: 'Arial', fontSize: 11, color: 'var(--grey-mid)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CLICK INPUT & START TYPING
              </span>
            )}
          </div>

          {/* Typing canvas */}
          <div className="typing-canvas" onClick={() => inputRef.current?.focus()}>
            {chars.map((char, i) => {
              const status = typed[i] || (i === currentIndex ? 'cursor' : 'pending')
              return (
                <span
                  key={i}
                  className={`char char-${status === 'correct' ? 'correct' : status === 'error' ? 'error' : status === 'cursor' ? 'cursor' : ''}`}
                >
                  {char === ' ' && status === 'error' ? '·' : char === '\n' ? (
                    <>↵<br /></>
                  ) : char}
                </span>
              )
            })}
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            className="input-brutal"
            value={inputValue}
            onKeyDown={handleKeyDown}
            onPaste={e => e.preventDefault()}
            onChange={() => {}}
            placeholder={started ? '' : 'Click here and start typing...'}
            style={{ fontFamily: 'Courier New, monospace', fontSize: 14 }}
            disabled={completed}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Right: Tile grid + ad info */}
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '2px solid #000' }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>
              IMAGE REVEALS AS YOU TYPE — {Math.round(progress * 100)}% REVEALED
            </div>
            <TileGrid
              imageUrl={campaign.image_url}
              progress={progress}
              tileColor={campaign.tile_color}
            />
          </div>

          <div style={{ padding: 16 }}>
            <div className="label-sm" style={{ marginBottom: 8 }}>AD DETAILS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['BRAND', campaign.brand_name],
                ['REWARD', `${campaign.points_reward} POINTS`],
                ['WORDS', `${text.split(' ').length}`],
                ['CHARACTERS', `${totalChars}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  <span className="label-sm">{label}</span>
                  <span style={{ fontFamily: 'Courier New', fontSize: 12, fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="completion-overlay">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="completion-sub" style={{ marginBottom: 16 }}>AD COMPLETED</div>
            <div className="completion-points">
              {submitting ? '...' : `+${campaign.points_reward}`}
            </div>
            <div className="completion-sub" style={{ marginTop: 8 }}>POINTS EARNED</div>
            <div style={{ marginTop: 32, fontFamily: 'Courier New', fontSize: 14, color: '#555' }}>
              {submitting ? 'SAVING SESSION...' : 'LOADING RESULTS...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
