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
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      // Approximate the sloth's hand position (e.g. bottom right of the image)
      onPositionReady(rect.left + rect.width * 0.8, rect.bottom - 10)
    }
    
    // Re-calculate on resize
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        onPositionReady(rect.left + rect.width * 0.8, rect.bottom - 10)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
        position: 'absolute',
        bottom: '100%', // Sit exactly on the top edge of the container
        right: '25%', // Move it a bit to the right center
        width: 160,
        height: 100,
        zIndex: 100,
        transform: animating ? 'translateY(2px)' : 'translateY(0)',
        transition: 'transform 0.1s ease',
        pointerEvents: 'none',
      }}
    >
      <div 
        style={{
          width: '100%', 
          height: '100%', 
          background: 'var(--paper-darker)', 
          border: '2px dashed var(--ink-faint)', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-faint)',
          fontSize: 12,
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        SLOTH<br/>IMAGE<br/>HERE
      </div>
    </div>
  )
}
