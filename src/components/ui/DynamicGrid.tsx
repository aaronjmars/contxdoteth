'use client'

import { useEffect, useState } from 'react'

export function DynamicGrid() {
  const [dimensions, setDimensions] = useState({ cols: 25, rows: 30 })

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        // Calculate columns based on viewport width + buffer
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Use responsive tile size like landing page: 36px mobile, 48px desktop
        const tileSize = viewportWidth >= 768 ? 48 : 36
        
        // Much lower density to match landing page (about 20-30 cols normally)
        const cols = Math.max(25, Math.ceil((viewportWidth * 1.5) / tileSize))
        const rows = Math.max(30, Math.ceil((viewportHeight * 1.5) / tileSize))
        
        setDimensions({ cols, rows })
      }
    }

    // Initial calculation
    updateDimensions()

    // Update on resize
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none opacity-15 z-0 overflow-hidden">
      <div 
        className="absolute"
        style={{
          left: '-25vw',
          top: '-25vh',
          width: '150vw',
          height: '150vh'
        }}
      >
        {Array.from({ length: dimensions.rows }, (_, row) => (
          Array.from({ length: dimensions.cols }, (_, col) => {
            // Use responsive tile size like landing page
            const tileSize = typeof window !== 'undefined' && window.innerWidth >= 768 ? 48 : 36
            return (
              <div
                key={`${row}-${col}`}
                className="absolute border border-primary/20 hover:bg-tile transition-colors duration-200 w-9 h-9 md:w-12 md:h-12"
                style={{
                  left: `${col * tileSize}px`,
                  top: `${row * tileSize}px`,
                }}
              />
            )
          })
        )).flat()}
      </div>
    </div>
  )
}