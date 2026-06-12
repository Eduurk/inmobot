'use client'

import { useRef, useState } from 'react'

interface Props {
  src: string
  width?: number
  height?: number
  strength?: number
}

export default function MagneticVideo({ src, width = 420, height = 420, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    })
  }

  const handleMouseLeave = () => setPos({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-none select-none"
      style={{ width, height }}
    >
      <div
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: pos.x === 0 && pos.y === 0 ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)' : 'transform 0.1s ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 30px 60px rgba(184,134,11,0.25))' }}
        />
      </div>
    </div>
  )
}
