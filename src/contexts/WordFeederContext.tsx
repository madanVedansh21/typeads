'use client'

import {
  createContext, useCallback, useContext, useRef,
  useState, useEffect, ReactNode,
} from 'react'

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
const SCRAMBLE_CHARS = '@#$%!*&^~?≠∂∆Ω'
let _gid = 0

interface FallingEntry {
  id: number
  word: string
  startX: number
  startY: number
  targetX: number  // center-X of the active word in the lane
  targetY: number  // top-Y of the active word in the lane
  fallDuration: number
}

interface CtxValue {
  /** Feed current live WPM → adjusts throw interval */
  setWpm: (wpm: number) => void
  /** Toggle the feeder on/off */
  setIsActive: (active: boolean) => void
  /** Replace word pool */
  setWords: (words: string[]) => void
  /** Set the live X,Y of the active word in the typing lane */
  setTypingTarget: (x: number, y: number) => void
  /** Register callback that fires each time a word lands */
  setOnWordLanded: (cb: ((word: string) => void) | null) => void
  /** Incremented every throw — drives ThrowerCharacter animation */
  throwTrigger: number
  /** Called by ThrowerCharacter once its coords are known */
  throwerReady: (x: number, y: number) => void
}

const Ctx = createContext<CtxValue | null>(null)

export function useWordFeeder() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWordFeeder must be inside WordFeederProvider')
  return ctx
}

/* ─────────────────────────────────────────────────────────────
   FallingWordEl — self-contained gravity + scramble element
───────────────────────────────────────────────────────────── */
function FallingWordEl({
  entry,
  onDone,
}: {
  entry: FallingEntry
  onDone: (id: number, word: string) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const landedRef = useRef(false)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const { word, fallDuration, startX, startY, targetX, targetY } = entry
    const dx = targetX - startX
    const dy = targetY - startY

    // Guard: skip bad geometry
    if (dy <= 0) { onDone(entry.id, word); return }

    const startTime = performance.now()

    // Animate from thrower position → active word position (diagonal arc)
    const anim = el.animate(
      [
        { transform: `translate(0px, 0px)`, opacity: '0.9' },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: '1' },
      ],
      { duration: fallDuration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    )

    const tick = (now: number) => {
      if (landedRef.current) return
      const progress = Math.min((now - startTime) / fallDuration, 1)

      // Scramble 0–80%, resolve L→R 80–100%
      const display = word
        .split('')
        .map((ch, i) => {
          const revealAt = 0.80 + (i / Math.max(word.length - 1, 1)) * 0.20
          return progress >= revealAt
            ? ch
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        })
        .join('')

      if (el) {
        el.textContent = display
        el.className = progress < 0.80 ? 'falling-word scrambling' : 'falling-word'
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!landedRef.current) {
        landedRef.current = true
        el.textContent = word
        el.className = 'falling-word landing'
        // Deliver word to typing queue
        onDone(entry.id, word)
        // Fade out after landing pulse
        setTimeout(() => {
          if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.2s' }
        }, 320)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); anim.cancel() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={elRef}
      className="falling-word scrambling"
      // Position at thrower origin; transform animates to target
      style={{ left: entry.startX, top: entry.startY }}
    >
      {'?'.repeat(entry.word.length)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Provider
───────────────────────────────────────────────────────────── */
export function WordFeederProvider({ children }: { children: ReactNode }) {
  // All mutable config lives in refs to avoid re-renders on every tick
  const wpmRef             = useRef(0)
  const isActiveRef        = useRef(false)
  const wordsRef           = useRef<string[]>([])
  const wordIdxRef         = useRef(0)
  const typingTargetRef    = useRef({ x: 0, y: 0 })  // live position of active word
  const throwerPosRef      = useRef({ x: 0, y: 0 })
  const onWordLandedRef    = useRef<((w: string) => void) | null>(null)
  const burstFiredRef      = useRef(false)
  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null)

  const [throwTrigger, setThrowTrigger] = useState(0)
  const [fallingWords, setFallingWords] = useState<FallingEntry[]>([])

  /* Dequeue next word from pool (loops infinitely) */
  const dequeue = useCallback((): string => {
    const pool = wordsRef.current
    if (!pool.length) return 'the'
    if (wordIdxRef.current >= pool.length) wordIdxRef.current = 0
    return pool[wordIdxRef.current++]
  }, [])

  /* Launch one word from the thrower toward the active word position */
  const fire = useCallback(() => {
    if (throwerPosRef.current.x === 0) return
    if (typingTargetRef.current.y === 0) return

    const effectiveWpm = Math.max(wpmRef.current, 20)
    const throwMs      = (60 / effectiveWpm) * 1000
    const fallDuration = Math.max(380, Math.min(900, throwMs * 0.72))

    setFallingWords(prev => [
      ...prev.slice(-14), // cap simultaneous falling words
      {
        id: ++_gid,
        word: dequeue(),
        startX: throwerPosRef.current.x,
        startY: throwerPosRef.current.y,
        targetX: typingTargetRef.current.x,
        targetY: typingTargetRef.current.y,
        fallDuration,
      },
    ])
    setThrowTrigger(t => t + 1)
  }, [dequeue])

  /* (Re)start the throw interval based on current WPM */
  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!isActiveRef.current) return

    const effectiveWpm = Math.max(wpmRef.current, 20)
    const throwMs      = Math.round((60 / effectiveWpm) * 1000)
    fire()
    intervalRef.current = setInterval(fire, throwMs)
  }, [fire])

  /* Pre-fill queue with a burst once all coords are ready */
  const tryBurst = useCallback(() => {
    if (burstFiredRef.current)              return
    if (!isActiveRef.current)               return
    if (throwerPosRef.current.x === 0)     return
    if (typingTargetRef.current.y === 0)   return

    burstFiredRef.current = true
    // Fire 4 words staggered — user always has something to type
    fire()
    setTimeout(fire, 380)
    setTimeout(fire, 760)
    setTimeout(fire, 1140)
    resetInterval()
  }, [fire, resetInterval])

  /* ── Public API ── */

  const setWpm = useCallback((wpm: number) => {
    const prev = wpmRef.current
    wpmRef.current = wpm
    if (Math.abs(wpm - prev) >= 5) resetInterval()
  }, [resetInterval])

  const setIsActive = useCallback((active: boolean) => {
    isActiveRef.current = active
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setFallingWords([])
      return
    }
    tryBurst()
  }, [tryBurst])

  const setWords = useCallback((words: string[]) => {
    wordsRef.current  = words
    wordIdxRef.current = 0
    burstFiredRef.current = false  // allow new burst on next activation
  }, [])

  const setTypingTarget = useCallback((x: number, y: number) => {
    const prevY = typingTargetRef.current.y
    typingTargetRef.current = { x, y }
    // Trigger burst now that we have a valid target position
    if (prevY === 0 && y > 0) tryBurst()
  }, [tryBurst])

  const setOnWordLanded = useCallback((cb: ((w: string) => void) | null) => {
    onWordLandedRef.current = cb
  }, [])

  const throwerReady = useCallback((x: number, y: number) => {
    throwerPosRef.current = { x, y }
    tryBurst()
    if (isActiveRef.current && !burstFiredRef.current) resetInterval()
  }, [tryBurst, resetInterval])

  /* Word lands → deliver to typing queue */
  const handleWordLanded = useCallback((id: number, word: string) => {
    onWordLandedRef.current?.(word)
    setFallingWords(prev => prev.filter(fw => fw.id !== id))
  }, [])

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return (
    <Ctx.Provider value={{ setWpm, setIsActive, setWords, setTypingTarget, setOnWordLanded, throwTrigger, throwerReady }}>
      {children}
      {fallingWords.map(fw =>
        fw.startX > 0 && fw.targetY > fw.startY ? (
          <FallingWordEl key={fw.id} entry={fw} onDone={handleWordLanded} />
        ) : null
      )}
    </Ctx.Provider>
  )
}
