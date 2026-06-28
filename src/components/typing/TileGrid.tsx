'use client'

import { useEffect, useState } from 'react'

interface Props {
  imageUrl: string | null
  progress: number  // 0 to 1
  tileColor: string
}

const COLS = 8
const ROWS = 3
const TOTAL = COLS * ROWS

export default function TileGrid({ imageUrl, progress, tileColor }: Props) {
  const revealedCount = Math.round(progress * TOTAL)

  return (
    <div
      className="tile-grid"
      style={{
        width: '100%',
        aspectRatio: '8/3',
        position: 'relative',
        border: '3px solid #000',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Ad creative"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Tiles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          zIndex: 1,
        }}
      >
        {Array.from({ length: TOTAL }, (_, i) => {
          const revealed = i < revealedCount
          return (
            <div
              key={i}
              style={{
                background: revealed ? 'transparent' : tileColor,
                borderRight: i % COLS !== COLS - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                borderBottom: i < TOTAL - COLS ? '1px solid rgba(0,0,0,0.2)' : 'none',
                transition: 'background 0.35s ease',
              }}
            />
          )
        })}
      </div>

      {/* No image fallback */}
      {!imageUrl && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `linear-gradient(135deg, ${tileColor} 0%, #000 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{
            fontFamily: 'Arial Black', fontSize: 11, fontWeight: 900,
            letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase'
          }}>
            IMAGE REVEALS AS YOU TYPE
          </span>
        </div>
      )}
    </div>
  )
}
