'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import type { Campaign } from '@/lib/supabase/types'
import WordFeederProvider, { useWordFeeder } from '@/contexts/WordFeederContext'
import SlothCharacter from '@/components/typing/SlothCharacter'

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
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

type CharState = 'correct' | 'error'

interface Props {
  campaign: Campaign
  userId: string
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function TypingInterface({ campaign, userId }: Props) {
  const router    = useRouter()
  const rawText   = campaign.ad_text

  const {
    setWpm: feedWpm,
    setIsActive,
    setWords,
    setTypingTarget,
    setOnWordLanded,
    throwTrigger,
    throwerReady,
  } = useWordFeeder()

  const typingCanvasRef = useRef<HTMLDivElement>(null)
  const activeWordRef   = useRef<HTMLSpanElement>(null)

  /* ── Settings ── */
  const [usePunctuation, setUsePunctuation] = useState(true)
  const [useLowercase,   setUseLowercase]   = useState(false)
  const [mode,           setMode]           = useState<'jumbled' | 'exact'>('jumbled')
  const [timeLimit,      setTimeLimit]      = useState<number | null>(null)

  /* ── Campaign word pool (derived from settings) ── */
  const campaignWordCountRef = useRef(0)
  const timeLimitRef         = useRef<number | null>(null)

  /* ── Word queue: grows as words land ── */
  const [typingWords, setTypingWords]         = useState<string[]>([])
  const [activeWordIdx, setActiveWordIdx]     = useState(0)
  const [charIdx, setCharIdx]                 = useState(0)
  const [wordCharStates, setWordCharStates]   = useState<Record<number, CharState[]>>({})

  /* ── Session lifecycle ── */
  const [started,    setStarted]    = useState(false)
  const [completed,  setCompleted]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [discarded,  setDiscarded]  = useState(false)

  /* ── Stats ── */
  const [wpm,              setWpm]              = useState(0)
  const [accuracy,         setAccuracy]         = useState(100)
  const [totalKeystrokes,  setTotalKeystrokes]  = useState(0)
  const [correctKeystrokes,setCorrectKeystrokes]= useState(0)
  const [elapsedSeconds,   setElapsedSeconds]   = useState(0)

  const correctCharsRef = useRef(0)   // for WPM calculation

  /* ── Anti-fraud refs ── */
  const keystrokesRef        = useRef<KeystrokeRecord[]>([])
  const accuracySamplesRef   = useRef<AccuracySample[]>([])
  const lastKeystrokeTimeRef = useRef(0)
  const startTimeRef         = useRef(0)
  const sessionIdRef         = useRef(uuidv4())

  const inputRef = useRef<HTMLInputElement>(null)

  /* ═══════════════════════════════════════════════════════════
     SETTINGS → derive campaign word list
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    timeLimitRef.current = timeLimit

    let text = rawText
    if (mode === 'jumbled') {
      const ws = text.split(/\s+/)
      for (let i = ws.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ws[i], ws[j]] = [ws[j], ws[i]]
      }
      text = ws.join(' ')
    }
    if (!usePunctuation) text = text.replace(/[^\w\s\d]/g, '')
    if (useLowercase)    text = text.toLowerCase()
    text = text.replace(/\s+/g, ' ').trim()

    const wordList = text.split(/\s+/).filter(Boolean)
    campaignWordCountRef.current = wordList.length
    setWords(wordList)

    // Full reset and pre-load all words for optimal typing UX
    setTypingWords(wordList)
    setActiveWordIdx(0)
    setCharIdx(0)
    setWordCharStates({})
    setStarted(false)
    setCompleted(false)
    setDiscarded(false)
    setElapsedSeconds(0)
    setWpm(0)
    setAccuracy(100)
    setTotalKeystrokes(0)
    setCorrectKeystrokes(0)
    correctCharsRef.current         = 0
    keystrokesRef.current           = []
    accuracySamplesRef.current      = []
    lastKeystrokeTimeRef.current    = 0
    startTimeRef.current            = 0
    sessionIdRef.current            = uuidv4()
  }, [usePunctuation, useLowercase, mode, rawText, setWords]) // setTimeLimit kept out intentionally

  // Keep timeLimitRef in sync separately (doesn't need a full reset)
  useEffect(() => { timeLimitRef.current = timeLimit }, [timeLimit])

  /* ═══════════════════════════════════════════════════════════
     WORD LANDED CALLBACK — unused now that words are preloaded
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    setOnWordLanded(() => {
      // Intentionally empty: words are now pre-loaded for better UX
    })
    return () => setOnWordLanded(null)
  }, [setOnWordLanded])

  /* ═══════════════════════════════════════════════════════════
     FEEDER — starts only when user begins typing, stops on end
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (started && !completed && !discarded) {
      setIsActive(true)
    } else if (completed || discarded) {
      setIsActive(false)
    }
  }, [started, completed, discarded, setIsActive])

  // Cleanup feeder on unmount
  useEffect(() => () => setIsActive(false), [setIsActive])

  /* ═══════════════════════════════════════════════════════════
     ACTIVE WORD TARGET — measure the live position of the word
     the feeder should aim at, update whenever word changes
  ═══════════════════════════════════════════════════════════ */
  const measureTarget = useCallback(() => {
    if (activeWordRef.current) {
      const r = activeWordRef.current.getBoundingClientRect()
      setTypingTarget(r.left + r.width / 2, r.top)
    } else if (typingCanvasRef.current) {
      // Fallback: aim at canvas top-left
      const r = typingCanvasRef.current.getBoundingClientRect()
      setTypingTarget(r.left + 80, r.top + 24)
    }
  }, [setTypingTarget])

  // Re-measure on every word advance and whenever the word list grows
  useEffect(() => { measureTarget() }, [activeWordIdx, typingWords.length, measureTarget])

  // Also re-measure on scroll/resize
  useEffect(() => {
    window.addEventListener('resize', measureTarget)
    return () => window.removeEventListener('resize', measureTarget)
  }, [measureTarget])

  /* ═══════════════════════════════════════════════════════════
     FOCUS INPUT
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => { inputRef.current?.focus() }, [])

  /* ═══════════════════════════════════════════════════════════
     WPM TICKER + INACTIVITY + TIME LIMIT
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!started || completed || discarded) return
    const iv = setInterval(() => {
      const now        = Date.now()
      const elapsedMs  = now - startTimeRef.current
      const elapsedMin = elapsedMs / 60000
      const liveWpm    = elapsedMin > 0
        ? Math.round((correctCharsRef.current / 5) / elapsedMin)
        : 0

      setElapsedSeconds(Math.floor(elapsedMs / 1000))
      setWpm(liveWpm)
      feedWpm(liveWpm)

      const secs = Math.floor(elapsedMs / 1000)
      if (timeLimitRef.current && secs >= timeLimitRef.current) {
        setCompleted(true)
        // Capture final values via functional updates can't work in timeout — use current values
        handleCompleteRef.current?.()
        return
      }
      if (now - lastKeystrokeTimeRef.current > 15000) {
        setDiscarded(true)
        setCompleted(true)
      }
    }, 500)
    return () => clearInterval(iv)
  }, [started, completed, discarded]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ═══════════════════════════════════════════════════════════
     SCROLL active word into view
  ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeWordIdx])

  /* ═══════════════════════════════════════════════════════════
     SESSION SUBMIT
  ═══════════════════════════════════════════════════════════ */
  // Keep a stable ref to handleComplete so the ticker interval can call it
  const handleCompleteRef = useRef<(() => void) | null>(null)

  const handleComplete = useCallback(async (
    finalTotal: number,
    finalCorrect: number,
    finalAccuracy: number,
    finalSecs: number | null,
  ) => {
    setCompleted(true)
    setSubmitting(true)

    const duration    = finalSecs ?? Math.round((Date.now() - startTimeRef.current) / 1000)
    const elapsedMin  = duration / 60
    const finalWpm    = elapsedMin > 0
      ? Math.round((correctCharsRef.current / 5) / elapsedMin)
      : 0

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:        sessionIdRef.current,
          user_id:           userId,
          campaign_id:       campaign.id,
          wpm:               finalWpm,
          accuracy:          finalAccuracy,
          keystrokes_data:   keystrokesRef.current,
          accuracy_samples:  accuracySamplesRef.current,
          total_keystrokes:  finalTotal,
          correct_keystrokes:finalCorrect,
          duration_seconds:  duration,
          test_mode:         mode,
          time_limit:        timeLimitRef.current,
          use_punctuation:   usePunctuation,
          use_lowercase:     useLowercase,
        }),
      })
    } catch (err) {
      console.error('Session submit error:', err)
    } finally {
      setSubmitting(false)
      router.push(`/results/${sessionIdRef.current}`)
    }
  }, [campaign.id, mode, userId, usePunctuation, useLowercase, router])

  // Wire up the ref used by the timer
  const totalKeystrokesRef  = useRef(0)
  const correctKeystrokesRef= useRef(0)
  const accuracyRef         = useRef(100)

  useEffect(() => {
    totalKeystrokesRef.current   = totalKeystrokes
    correctKeystrokesRef.current = correctKeystrokes
    accuracyRef.current          = accuracy
  }, [totalKeystrokes, correctKeystrokes, accuracy])

  useEffect(() => {
    handleCompleteRef.current = () => {
      const secs = Math.round((Date.now() - startTimeRef.current) / 1000)
      handleComplete(
        totalKeystrokesRef.current,
        correctKeystrokesRef.current,
        accuracyRef.current,
        secs,
      )
    }
  }, [handleComplete])

  /* ═══════════════════════════════════════════════════════════
     KEYBOARD HANDLER
  ═══════════════════════════════════════════════════════════ */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === 'v') { e.preventDefault(); return }

    const now      = Date.now()
    const interval = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0
    lastKeystrokeTimeRef.current = now

    // Start session timer on first keystroke
    if (!started) {
      setStarted(true)
      startTimeRef.current = now
    }

    const currentWord = typingWords[activeWordIdx]
    if (!currentWord) return  // queue empty — wait for next word

    /* ── Backspace ── */
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (charIdx > 0) {
        const newCi = charIdx - 1
        setCharIdx(newCi)
        setWordCharStates(prev => {
          const ws = [...(prev[activeWordIdx] ?? [])]
          ws.splice(newCi)
          return { ...prev, [activeWordIdx]: ws }
        })
      }
      return
    }

    /* ── Space (Advance Word) ── */
    if (e.key === ' ') {
      e.preventDefault()
      const nextWi = activeWordIdx + 1
      setActiveWordIdx(nextWi)
      setCharIdx(0)
      
      // Non-timed: complete when all campaign words are typed
      if (!timeLimitRef.current && nextWi >= campaignWordCountRef.current) {
        setCompleted(true)
        const secs = (now - startTimeRef.current) / 1000
        handleComplete(
          totalKeystrokes,
          correctKeystrokes,
          accuracyRef.current,
          secs,
        )
      }
      return
    }

    /* ── Ignore non-printable or extra characters ── */
    if (e.key.length !== 1) return
    if (charIdx >= currentWord.length) return // Stop typing at end of word until space is pressed
    e.preventDefault()

    /* ── Record keystroke for anti-fraud ── */
    keystrokesRef.current.push({ key: e.key, timestamp: now, interval_ms: interval })
    const isCorrect  = e.key === currentWord[charIdx]
    const newTotal   = totalKeystrokes + 1
    const newCorrect = correctKeystrokes + (isCorrect ? 1 : 0)
    if (isCorrect) correctCharsRef.current += 1

    setTotalKeystrokes(newTotal)
    setCorrectKeystrokes(newCorrect)
    const newAcc = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100
    setAccuracy(newAcc)

    // Accuracy sample every 5 keystrokes
    if (newTotal % 5 === 0) {
      const min = (now - startTimeRef.current) / 60000
      accuracySamplesRef.current.push({
        char_index: newTotal,
        accuracy:   newAcc,
        wpm:        min > 0 ? Math.round((correctCharsRef.current / 5) / min) : 0,
      })
    }

    /* ── Update char state ── */
    setWordCharStates(prev => {
      const ws = [...(prev[activeWordIdx] ?? [])]
      ws[charIdx] = isCorrect ? 'correct' : 'error'
      return { ...prev, [activeWordIdx]: ws }
    })

    setCharIdx(charIdx + 1)
  }, [
    started, activeWordIdx, charIdx, typingWords,
    totalKeystrokes, correctKeystrokes, handleComplete,
  ])

  /* ═══════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════ */
  const formatTime = (secs: number) => {
    const display = timeLimit ? Math.max(0, timeLimit - secs) : secs
    const m = Math.floor(display / 60)
    const s = display % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
    {/* ── Settings Sub-bar — fixed below topbar ── */}
    <div style={{
      position: 'fixed',
      top: 60,          /* topbar height */
      left: 0,
      right: 0,
      zIndex: 90,
      background: 'var(--paper-dark)',
      borderBottom: '2px solid var(--paper-darker)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 40,
      height: 52,
      paddingInline: 32,
    }}>
      <SlothCharacter triggerThrow={throwTrigger} onPositionReady={throwerReady} />
      {/* Punctuation */}
      <button
        onClick={() => setUsePunctuation(p => !p)}
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-courier)', fontSize: 16, fontWeight: 700, color: usePunctuation ? 'var(--ink)' : 'var(--ink-faint)', letterSpacing: '0.04em', transition: 'color 0.15s' }}
      >
        <span style={{ color: 'var(--stamp-navy)', fontSize: 18 }}>@</span> punctuation
      </button>

      {/* Case */}
      <button
        onClick={() => setUseLowercase(l => !l)}
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-courier)', fontSize: 16, fontWeight: 700, color: useLowercase ? 'var(--ink)' : 'var(--ink-faint)', letterSpacing: '0.04em', transition: 'color 0.15s' }}
      >
        <span style={{ color: 'var(--stamp-navy)', fontSize: 18 }}>Aa</span> case
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--paper-darker)' }} />

      {/* Mode */}
      {(['jumbled', 'exact'] as const).map(m => (
        <button
          key={m} onClick={() => setMode(m)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-courier)', fontSize: 16, fontWeight: 700, color: mode === m ? 'var(--stamp-navy)' : 'var(--ink-faint)', letterSpacing: '0.04em', transition: 'color 0.15s', borderBottom: mode === m ? '2px solid var(--stamp-navy)' : '2px solid transparent', paddingBottom: 2 }}
        >
          {m}
        </button>
      ))}

      <div style={{ width: 1, height: 24, background: 'var(--paper-darker)' }} />

      {/* Time limits */}
      {[15, 30, 60, 120].map(val => (
        <button
          key={val} onClick={() => setTimeLimit(tl => tl === val ? null : val)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-courier)', fontSize: 16, fontWeight: 700, color: timeLimit === val ? 'var(--stamp-navy)' : 'var(--ink-faint)', letterSpacing: '0.04em', transition: 'color 0.15s', borderBottom: timeLimit === val ? '2px solid var(--stamp-navy)' : '2px solid transparent', paddingBottom: 2 }}
        >
          {val}
        </button>
      ))}
    </div>

    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', position: 'relative' }}>

      {/* ── Typing area ── */}
      <div style={{ flex: 1, padding: '40px 48px 64px 48px', paddingRight: '380px', paddingTop: '56px', display: 'flex', flexDirection: 'column' }}>

        {/* Timer */}
        {started && !completed && !discarded && (
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 36, fontWeight: 900, color: timeLimit && (timeLimit - elapsedSeconds) <= 5 ? 'var(--stamp-red)' : 'var(--stamp-navy)', marginBottom: 16, transition: 'color 0.3s' }}>
            {formatTime(elapsedSeconds)}
          </div>
        )}

        {/* Live stats */}
        {started && !completed && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, fontFamily: 'var(--font-courier)', fontSize: 13, color: 'var(--ink-faint)' }}>
            <span><strong style={{ color: 'var(--stamp-navy)', fontSize: 16 }}>{wpm}</strong> wpm</span>
            <span><strong style={{ color: accuracy >= 90 ? 'var(--ink)' : 'var(--stamp-red)', fontSize: 16 }}>{accuracy}%</strong> acc</span>
            <span style={{ color: 'var(--paper-darker)' }}>|</span>
            <span>{activeWordIdx} / {campaignWordCountRef.current > 0 ? (timeLimit ? '∞' : campaignWordCountRef.current) : '…'} words</span>
          </div>
        )}

        {/* ── Word Lane ── */}
        <div
          ref={typingCanvasRef}
          className="word-lane"
          onClick={() => inputRef.current?.focus()}
        >
          {typingWords.length === 0 ? (
            <span className="word-lane-waiting">
              {started ? '⬇ next word on its way…' : 'Click or start typing to begin'}
            </span>
          ) : (
            typingWords.map((word, wi) => {
              const states    = wordCharStates[wi] ?? []
              const isActive  = wi === activeWordIdx
              const isDone    = wi < activeWordIdx
              const isFuture  = wi > activeWordIdx

              return (
                <span
                  key={wi}
                  ref={isActive ? activeWordRef : undefined}
                  className={`wl-word ${isDone ? 'wl-done' : ''} ${isActive ? 'wl-active' : ''} ${isFuture ? 'wl-future' : ''}`}
                >
                  {word.split('').map((ch, ci) => {
                    const st      = states[ci]
                    const isCaret = isActive && ci === charIdx
                    return (
                      <span
                        key={ci}
                        className={`wl-ch ${st ?? ''} ${isCaret ? 'wl-caret' : ''}`}
                      >
                        {ch}
                      </span>
                    )
                  })}

                  {/* Caret past last char */}
                  {isActive && charIdx >= word.length && (
                    <span className="wl-ch wl-caret" style={{ width: 2, display: 'inline-block' }}> </span>
                  )}
                </span>
              )
            })
          )}
        </div>

        {/* Incoming word hint */}
        {started && typingWords.length > 0 && activeWordIdx >= typingWords.length && !completed && (
          <div style={{ marginTop: 12, fontFamily: 'var(--font-courier)', fontSize: 13, color: 'var(--ink-faint)' }}>
            ⬇ next word incoming…
          </div>
        )}
      </div>

      {/* ── Ad Image ── */}
      <div style={{ position: 'absolute', bottom: 8, right: 48, width: 320, height: 240, border: '2px dashed var(--paper-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-dark)' }}>
        <div className="label-sm" style={{ color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          AD IMAGE<br />PLACEHOLDER
        </div>
      </div>

      {/* ── Start hint ── */}
      {!started && !completed && !discarded && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }} className="label-sm">
          CLICK OR START TYPING TO BEGIN
        </div>
      )}

      {/* ── Hidden input ── */}
      <input
        ref={inputRef}
        type="text"
        value=""
        onKeyDown={handleKeyDown}
        onPaste={e => e.preventDefault()}
        onChange={() => {}}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        disabled={completed || discarded}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* ── Completion overlay ── */}
      {completed && !discarded && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="font-headline" style={{ fontSize: 32, marginBottom: 24, textTransform: 'uppercase' }}>
            {submitting ? 'RECORDING SESSION…' : 'REDIRECTING…'}
          </div>
          <div style={{ width: 48, height: 48, border: '2px solid var(--paper-darker)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* ── Discarded overlay ── */}
      {discarded && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="font-headline" style={{ fontSize: 32, marginBottom: 16, textTransform: 'uppercase' }}>
            TEST DISCARDED
          </div>
          <p className="font-body" style={{ color: 'var(--ink-faint)', marginBottom: 32 }}>
            The session was abandoned due to inactivity.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-inverted">
            START NEW TEST
          </button>
        </div>
      )}
    </div>
    </>
  )
}
