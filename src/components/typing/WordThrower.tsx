'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ThrowerCharacter from './ThrowerCharacter'
import FallingWord from './FallingWord'

interface FallingWordEntry {
  id: number
  word: string
  fallDuration: number
}

interface Props {
  /** All words from the ad text, pre-split */
  words: string[]
  /** Live WPM from TypingInterface */
  wpm: number
  /** Whether the user has started typing */
  isActive: boolean
  /** The Y coordinate of the typing canvas (the line to target) */
  typingLineY: number
}

let globalId = 0

export default function WordThrower({ words, wpm, isActive, typingLineY }: Props) {
  const [throwerPos, setThrowerPos] = useState({ x: 0, y: 0 })
  const [fallingWords, setFallingWords] = useState<FallingWordEntry[]>([])
  const [throwTrigger, setThrowTrigger] = useState(0)

  // Queue reference — refills from props.words cyclically
  const queueRef = useRef<string[]>([])
  const wordIndexRef = useRef(0)

  // Seed / refill the queue whenever words change
  useEffect(() => {
    queueRef.current = [...words]
    wordIndexRef.current = 0
  }, [words])

  const dequeueWord = useCallback((): string => {
    // Cycle through words infinitely
    if (wordIndexRef.current >= queueRef.current.length) {
      wordIndexRef.current = 0
    }
    return queueRef.current[wordIndexRef.current++] ?? 'the'
  }, [])

  // WPM-based throw interval — floors WPM at 20 so idle never freezes
  const throwIntervalMs = Math.round((60 / Math.max(wpm, 20)) * 1000)

  // Throw timer
  useEffect(() => {
    if (!isActive || throwerPos.x === 0) return

    const fire = () => {
      const word = dequeueWord()
      const duration = Math.max(350, Math.min(800, throwIntervalMs * 0.75))
      setFallingWords(prev => [
        ...prev,
        { id: ++globalId, word, fallDuration: duration },
      ])
      setThrowTrigger(t => t + 1)
    }

    // Fire immediately on start then repeat
    fire()
    const id = setInterval(fire, throwIntervalMs)
    return () => clearInterval(id)
  }, [isActive, throwIntervalMs, throwerPos.x, dequeueWord])

  const handlePositionReady = useCallback((x: number, y: number) => {
    setThrowerPos({ x, y })
  }, [])

  const removeFallingWord = useCallback((id: number) => {
    setFallingWords(prev => prev.filter(w => w.id !== id))
  }, [])

  return (
    <>
      {/* The character — lives inline, parent (Topbar) will render it separately.
          This component just exports the character for wiring.
          We render a hidden anchor here for position tracking. */}
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: 0, pointerEvents: 'none' }}
        data-thrower-anchor="true"
      />

      {/* Render falling words as fixed-position portal elements */}
      {fallingWords.map(fw => (
        throwerPos.x > 0 && typingLineY > 0 ? (
          <FallingWord
            key={fw.id}
            word={fw.word}
            startX={throwerPos.x}
            startY={throwerPos.y}
            targetY={typingLineY}
            fallDuration={fw.fallDuration}
            onLanded={() => removeFallingWord(fw.id)}
          />
        ) : null
      ))}

      {/* Expose ThrowerCharacter separately so Topbar can render it */}
      <ThrowerCharacter
        triggerThrow={throwTrigger}
        onPositionReady={handlePositionReady}
      />
    </>
  )
}

/**
 * Standalone character export — Topbar uses this inside its JSX,
 * while TypingInterface owns the WordThrower logic.
 * We solve the cross-component coordination via a shared context.
 */
