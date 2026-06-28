'use client'

import { useEffect, useRef } from 'react'

const SCRAMBLE_CHARS = '@#$%!*&^~?≠∂∆Ω'

function scramble(word: string, progress: number): string {
  return word
    .split('')
    .map((letter, i) => {
      // Each letter resolves left-to-right during last 20% of fall
      // Letter i fully reveals when progress >= 0.80 + (i/word.length)*0.20
      const revealAt = 0.80 + (i / Math.max(word.length - 1, 1)) * 0.20
      if (progress >= revealAt) return letter
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    })
    .join('')
}

interface Props {
  word: string
  startX: number   // px — fixed position where character stands
  startY: number   // px — fixed position (bottom of thrower)
  targetY: number  // px — the typing line Y coordinate
  fallDuration: number  // ms — controlled by WPM
  onLanded: () => void
}

export default function FallingWord({ word, startX, startY, targetY, fallDuration, onLanded }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const landedRef = useRef(false)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    // Position at thrower origin
    el.style.left = `${startX - el.offsetWidth / 2}px`
    el.style.top = `${startY}px`

    const totalDistance = targetY - startY

    // Start the Web Animations API fall with gravity easing
    const anim = el.animate(
      [
        { transform: `translateY(0px)`, opacity: '0.9' },
        { transform: `translateY(${totalDistance}px)`, opacity: '1' },
      ],
      {
        duration: fallDuration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      }
    )

    startTimeRef.current = performance.now()

    // rAF loop for scramble effect
    const tick = (now: number) => {
      if (landedRef.current) return
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / fallDuration, 1)

      if (el) {
        if (progress < 0.80) {
          el.className = 'falling-word scrambling'
          el.textContent = scramble(word, progress)
        } else {
          el.className = 'falling-word'
          el.textContent = scramble(word, progress)
        }
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Landed!
        if (el && !landedRef.current) {
          landedRef.current = true
          el.textContent = word
          el.className = 'falling-word landing'
          // Remove after landing animation
          setTimeout(() => {
            el.style.opacity = '0'
            el.style.transition = 'opacity 0.2s'
            setTimeout(() => onLanded(), 220)
          }, 280)
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      anim.cancel()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={elRef}
      className="falling-word scrambling"
      style={{
        position: 'fixed',
        left: startX,
        top: startY,
        zIndex: 200,
      }}
    >
      {scramble(word, 0)}
    </div>
  )
}
