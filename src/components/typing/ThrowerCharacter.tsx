'use client'

import { useEffect, useRef, useState } from 'react'

type ThrowState = 'idle' | 'windup' | 'throw'

interface Props {
  /** Fires every time a throw should happen — controlled by parent */
  triggerThrow?: number  // increment this to trigger a throw
  /** Ref callback so parent can measure thrower position */
  onPositionReady?: (x: number, y: number) => void
}

export default function ThrowerCharacter({ triggerThrow = 0, onPositionReady }: Props) {
  const [state, setState] = useState<ThrowState>('idle')
  const containerRef = useRef<SVGSVGElement>(null)
  const prevTrigger = useRef(0)

  // Report position whenever we mount or resize
  useEffect(() => {
    const report = () => {
      if (!containerRef.current || !onPositionReady) return
      const rect = containerRef.current.getBoundingClientRect()
      onPositionReady(rect.left + rect.width / 2, rect.top + rect.height)
    }
    report()
    window.addEventListener('resize', report)
    return () => window.removeEventListener('resize', report)
  }, [onPositionReady])

  // React to throw triggers
  useEffect(() => {
    if (triggerThrow === 0 || triggerThrow === prevTrigger.current) return
    prevTrigger.current = triggerThrow

    setState('windup')
    const windupTimer = setTimeout(() => {
      setState('throw')
      const throwTimer = setTimeout(() => {
        setState('idle')
      }, 300)
      return () => clearTimeout(throwTimer)
    }, 150)
    return () => clearTimeout(windupTimer)
  }, [triggerThrow])

  return (
    <div className={`thrower-character state-${state}`} title="Word thrower" style={{ width: 44, height: 44, flexShrink: 0 }}>
      <svg
        ref={containerRef}
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="thrower-body" style={{ transformOrigin: '22px 36px' }}>
          {/* Head — circle */}
          <circle cx="22" cy="9" r="6" fill="var(--ink)" />

          {/* Eyes — tiny dots */}
          <circle cx="20" cy="8.5" r="1" fill="var(--paper)" />
          <circle cx="24" cy="8.5" r="1" fill="var(--paper)" />

          {/* Body */}
          <line x1="22" y1="15" x2="22" y2="30" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Left arm — resting */}
          <line x1="22" y1="19" x2="14" y2="25" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />

          {/* Right arm — changes with state via SVG animate */}
          {state === 'idle' && (
            <line x1="22" y1="19" x2="30" y2="25" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
          )}
          {state === 'windup' && (
            /* Arm raised back */
            <line x1="22" y1="19" x2="31" y2="12" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
          )}
          {state === 'throw' && (
            /* Arm snapped forward+down */
            <>
              <line x1="22" y1="19" x2="34" y2="22" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
              {/* little motion lines */}
              <line x1="35" y1="19" x2="38" y2="18" stroke="var(--ink-faint)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
              <line x1="36" y1="23" x2="40" y2="23" stroke="var(--ink-faint)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            </>
          )}

          {/* Legs */}
          <line x1="22" y1="30" x2="17" y2="39" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="22" y1="30" x2="27" y2="39" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />

          {/* Hat / cap (editorial newsboy feel) */}
          <path d="M16 9 Q22 4 28 9" stroke="var(--ink)" strokeWidth="2" fill="var(--ink)" opacity="0.85" />
          <rect x="14" y="8.5" width="16" height="2" rx="1" fill="var(--ink)" opacity="0.6" />
        </g>
      </svg>
    </div>
  )
}
