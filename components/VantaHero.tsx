'use client'

import { useEffect, useRef } from 'react'

export default function VantaHero() {
  const mountRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<any>(null)

  useEffect(() => {
    if (effectRef.current || !mountRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Promise.all([
      import('three'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — vanta no tiene tipos declarados
      import('vanta/dist/vanta.waves.min'),
    ]).then(([THREE, VANTA]) => {
      if (!mountRef.current) return
      effectRef.current = (VANTA as any).default({
        el: mountRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        color: 0xb8860b,       // dorado InmoBot
        shininess: 40,
        waveHeight: 18,
        waveSpeed: 0.45,
        zoom: 0.88,
      })
    })

    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" />
}
