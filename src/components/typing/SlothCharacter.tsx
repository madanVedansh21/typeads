'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  triggerThrow: number
  onPositionReady: (x: number, y: number) => void
}

export default function SlothCharacter({ triggerThrow, onPositionReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animating, setAnimating] = useState(false)

  // Send hand coordinates to context
  useEffect(() => {
    const report = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        // Hand is roughly at the center-bottom of the sloth image
        onPositionReady(rect.left + rect.width * 0.5, rect.bottom)
      }
    }
    report()
    window.addEventListener('resize', report)
    return () => window.removeEventListener('resize', report)
  }, [onPositionReady])

  // Trigger drop animation
  useEffect(() => {
    if (triggerThrow === 0) return
    setAnimating(true)
    const t = setTimeout(() => setAnimating(false), 300)
    return () => clearTimeout(t)
  }, [triggerThrow])

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        /* topbar (60px) + settings bar (52px) = 112px; shift up so sloth straddles the border */
        top: 95,
        left: '50%',
        transform: `translateX(-50%) ${animating ? 'translateY(3px)' : 'translateY(0)'}`,
        transition: 'transform 0.1s ease',
        width: 110,
        height: 80,
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div 
        style={{
          width: '100%', 
          height: '100%', 
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Image
          src="/sloth.png"
          alt="Sloth Mascot"
          fill
          style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
        />
      </div>
    </div>
  )
}
