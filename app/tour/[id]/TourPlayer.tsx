'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import type { AudioTourScript } from '@/lib/types'

const KEN_BURNS = [
  { from: 'scale(1.08) translate(-2%, -2%)', to: 'scale(1) translate(2%, 2%)' },
  { from: 'scale(1) translate(2%, -2%)', to: 'scale(1.08) translate(-2%, 2%)' },
  { from: 'scale(1.06) translate(0%, -3%)', to: 'scale(1) translate(0%, 1%)' },
  { from: 'scale(1) translate(-3%, 0%)', to: 'scale(1.08) translate(3%, 0%)' },
  { from: 'scale(1.08) translate(2%, 2%)', to: 'scale(1) translate(-2%, -2%)' },
]

interface Props {
  fotos: string[]
  script: AudioTourScript
  audioUrl: string
  titulo: string
  precio: string
  zona: string | null
}

export default function TourPlayer({ fotos, script, audioUrl, titulo, precio, zona }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [progress, setProgress] = useState(0)

  const updateSlide = useCallback(
    (currentTime: number) => {
      for (let i = script.slides.length - 1; i >= 0; i--) {
        if (currentTime >= script.slides[i].inicio) {
          setCurrentSlide(Math.min(script.slides[i].indice, fotos.length - 1))
          break
        }
      }
      const total = script.total_segundos || 1
      setProgress(Math.min((currentTime / total) * 100, 100))
    },
    [script, fotos.length]
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => updateSlide(audio.currentTime)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); setEnded(true) }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [updateSlide])

  const start = () => {
    setStarted(true)
    setEnded(false)
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(console.error)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    playing ? audio.pause() : audio.play().catch(console.error)
  }

  const restart = () => {
    setEnded(false)
    setCurrentSlide(0)
    setProgress(0)
    start()
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Ken Burns keyframes — one per slide so each animation is independent */}
      <style>{fotos
        .map((_, i) => {
          const kb = KEN_BURNS[i % KEN_BURNS.length]
          const dur = script.slides[i]?.duracion ?? 7
          return `@keyframes kb-${i} { from { transform: ${kb.from}; } to { transform: ${kb.to}; } }`
          + `.kb-slide-${i} { animation: kb-${i} ${dur}s ease-in-out forwards; }`
        })
        .join('\n')
      }</style>

      {/* Photo slides */}
      {fotos.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: currentSlide === i ? 1 : 0, zIndex: currentSlide === i ? 1 : 0 }}
        >
          <div
            className={`w-full h-full ${currentSlide === i && started ? `kb-slide-${i}` : ''}`}
          >
            <Image
              src={url}
              alt={`Foto ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Progress bar */}
      {started && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-white/80 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Slide counter */}
      {started && !ended && (
        <div className="absolute top-4 right-4 z-20 flex gap-1.5">
          {fotos.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Property info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
        <div className="max-w-2xl">
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Tour Virtual</p>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-1">{titulo}</h1>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            {zona && <span>{zona}</span>}
            {zona && precio && <span>·</span>}
            {precio && <span className="font-semibold">{precio}</span>}
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center gap-3">
            {!started && !ended && (
              <button
                onClick={start}
                className="flex items-center gap-2.5 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Iniciar tour
              </button>
            )}

            {started && !ended && (
              <button
                onClick={togglePlay}
                className="flex items-center gap-2.5 bg-white/20 backdrop-blur text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors border border-white/20"
              >
                {playing ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                {playing ? 'Pausar' : 'Reproducir'}
              </button>
            )}

            {ended && (
              <button
                onClick={restart}
                className="flex items-center gap-2.5 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
                Ver de nuevo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-white/40 text-xs font-medium tracking-wide">InmoBot</span>
      </div>
    </div>
  )
}
