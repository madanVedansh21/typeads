'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
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
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', position: 'relative' }}>
      
      {/* Typing text section */}
      <div style={{ flex: 1, padding: '64px 48px', overflowY: 'auto', paddingRight: '400px' }}>
        <div 
          className="typing-canvas" 
          onClick={() => inputRef.current?.focus()}
          style={{ opacity: started ? 1 : 0.4, transition: 'opacity 0.2s', cursor: 'text' }}
        >
          {chars.map((char, i) => {
            const status = typed[i] || (i === currentIndex ? 'cursor' : 'pending')
            return (
              <span
                key={i}
                className={`char char-${status === 'correct' ? 'correct' : status === 'error' ? 'error' : status === 'cursor' ? 'cursor' : 'pending'}`}
              >
                {char === ' ' && status === 'error' ? '·' : char === '\n' ? (
                  <>↵<br /></>
                ) : char}
              </span>
            )
          })}
        </div>
      </div>

      {/* Ad Image Placeholder */}
      <div style={{ position: 'absolute', bottom: 48, right: 48, width: 320, height: 240, border: '2px dashed var(--paper-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-dark)' }}>
        <div className="label-sm" style={{ color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          AD IMAGE<br/>PLACEHOLDER
        </div>
      </div>

      {!started && !completed && (
        <div style={{ position: 'absolute', bottom: 48, left: 48 }} className="label-sm">
          CLICK OR START TYPING TO BEGIN
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onKeyDown={handleKeyDown}
        onPaste={e => e.preventDefault()}
        onChange={() => {}}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        disabled={completed}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Completion overlay */}
      {completed && (
        <div className="completion-overlay" style={{ 
          position: 'absolute', inset: 0, 
          background: 'var(--paper)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 
        }}>
          <div className="font-headline" style={{ fontSize: 32, marginBottom: 24, textTransform: 'uppercase' }}>
            {submitting ? 'RECORDING SESSION...' : 'REDIRECTING...'}
          </div>
          <div style={{ width: 48, height: 48, border: '2px solid var(--paper-darker)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
        </div>
      )}
    </div>
  )
}
