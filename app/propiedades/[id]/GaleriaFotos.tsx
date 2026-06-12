'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { FotoPropiedad } from '@/lib/types'

interface Props {
  fotos: FotoPropiedad[]
  titulo: string
}

export default function GaleriaFotos({ fotos, titulo }: Props) {
  const [selected, setSelected] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (fotos.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-crema to-crema-dark rounded-3xl flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center">
          <svg className="w-10 h-10 text-dorado/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
          </svg>
        </div>
        <p className="text-oscuro/40 text-sm font-medium">Sin fotografías cargadas</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Foto principal */}
        <div
          className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-oscuro/5 cursor-zoom-in"
          onClick={() => setLightbox(true)}
        >
          <Image
            src={fotos[selected].url}
            alt={`${titulo} — foto ${selected + 1}`}
            fill
            className="object-cover transition-all duration-500"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-oscuro/30 via-transparent to-transparent pointer-events-none" />

          {/* Contador y botón expandir */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {fotos.length > 1 && (
              <span className="bg-oscuro/70 backdrop-blur-sm text-crema text-xs font-semibold px-3 py-1.5 rounded-full">
                {selected + 1} / {fotos.length}
              </span>
            )}
            <span className="bg-oscuro/70 backdrop-blur-sm text-crema text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Ver grande
            </span>
          </div>

          {/* Flechas navegación */}
          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s - 1 + fotos.length) % fotos.length) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-oscuro/60 backdrop-blur-sm rounded-full flex items-center justify-center text-crema hover:bg-oscuro/80 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s + 1) % fotos.length) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-oscuro/60 backdrop-blur-sm rounded-full flex items-center justify-center text-crema hover:bg-oscuro/80 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {fotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fotos.map((foto, i) => (
              <button
                key={`${foto.url}-${i}`}
                onClick={() => setSelected(i)}
                className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selected
                    ? 'border-dorado shadow-md shadow-dorado/20'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <Image src={foto.url} alt={`miniatura ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative max-w-5xl w-full max-h-[85vh] aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={fotos[selected].url}
              alt={titulo}
              fill
              className="object-contain"
            />
          </div>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s - 1 + fotos.length) % fotos.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s + 1) % fotos.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
