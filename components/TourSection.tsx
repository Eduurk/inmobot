'use client'

import { useState } from 'react'
import type { Propiedad } from '@/lib/types'

interface Props {
  propiedad: Propiedad
}

export default function TourSection({ propiedad }: Props) {
  const [estado, setEstado] = useState(propiedad.audio_tour_estado ?? 'none')
  const [tourUrl, setTourUrl] = useState(propiedad.audio_tour_url ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cantFotos = propiedad.fotos_propiedad?.length ?? 0

  const generar = async () => {
    if (cantFotos === 0) {
      setError('Agregá al menos una foto antes de generar el tour.')
      return
    }
    setLoading(true)
    setError('')
    setEstado('generating')

    try {
      const res = await fetch(`/api/propiedades/${propiedad.id}/generar-tour`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al generar el tour')
        setEstado('error')
      } else {
        setEstado('done')
        setTourUrl(data.audio_tour_url)
      }
    } catch {
      setError('Error de conexión al generar el tour')
      setEstado('error')
    } finally {
      setLoading(false)
    }
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar el tour virtual de esta propiedad?')) return
    setLoading(true)
    try {
      await fetch(`/api/propiedades/${propiedad.id}/generar-tour`, { method: 'DELETE' })
      setEstado('none')
      setTourUrl(null)
      setError('')
    } catch {
      setError('Error al eliminar el tour')
    } finally {
      setLoading(false)
    }
  }

  const tourPageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tour/${propiedad.id}`
    : `/tour/${propiedad.id}`

  const copyLink = () => {
    navigator.clipboard.writeText(tourPageUrl)
  }

  return (
    <section className="bg-white border border-crema-dark rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-playfair text-lg font-semibold text-oscuro">Tour Virtual IA</h2>
          <p className="text-oscuro/50 text-xs mt-0.5">
            Slideshow narrado por voz IA generado automáticamente
          </p>
        </div>
        {estado === 'done' && (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Activo
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* None / error state */}
      {(estado === 'none' || estado === 'error') && (
        <div className="flex flex-col items-start gap-3">
          {cantFotos === 0 ? (
            <p className="text-oscuro/50 text-sm">Agregá fotos a la propiedad para poder generar el tour.</p>
          ) : (
            <p className="text-oscuro/60 text-sm">
              {cantFotos} foto{cantFotos !== 1 ? 's' : ''} disponible{cantFotos !== 1 ? 's' : ''}.
              Claude escribirá el guión y ElevenLabs narrará el tour (~{cantFotos * 7}s de audio).
            </p>
          )}
          <button
            onClick={generar}
            disabled={loading || cantFotos === 0}
            className="flex items-center gap-2 bg-oscuro text-crema px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-oscuro/90 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 18.364l-2.829-2.828m0 0a5 5 0 010-7.072m2.829 2.828L12 12m0 0l2.829-2.828M12 12l-2.829 2.828" />
            </svg>
            Generar tour virtual
          </button>
        </div>
      )}

      {/* Generating state */}
      {estado === 'generating' && (
        <div className="flex items-center gap-3 text-oscuro/70">
          <svg className="w-5 h-5 animate-spin text-dorado" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-oscuro">Generando tour...</p>
            <p className="text-xs text-oscuro/50">Claude está escribiendo el guión y ElevenLabs narrando el audio. Puede tardar hasta 30 segundos.</p>
          </div>
        </div>
      )}

      {/* Done state */}
      {estado === 'done' && tourUrl && (
        <div className="space-y-4">
          {/* Preview audio */}
          <div className="bg-crema rounded-xl p-4">
            <p className="text-xs text-oscuro/50 mb-2 font-medium">Preview del audio</p>
            <audio controls src={tourUrl} className="w-full h-8" />
          </div>

          {/* Tour link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-crema border border-crema-dark rounded-xl px-3 py-2 text-xs text-oscuro/60 font-mono truncate">
              {tourPageUrl}
            </div>
            <button
              onClick={copyLink}
              title="Copiar link"
              className="p-2 border border-crema-dark rounded-xl hover:border-dorado/50 transition-colors"
            >
              <svg className="w-4 h-4 text-oscuro/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <a
              href={tourPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-crema-dark rounded-xl hover:border-dorado/50 transition-colors"
              title="Abrir tour"
            >
              <svg className="w-4 h-4 text-oscuro/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Regenerate / Delete */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={generar}
              disabled={loading}
              className="text-sm text-oscuro/60 hover:text-oscuro transition-colors underline underline-offset-2"
            >
              Regenerar tour
            </button>
            <span className="text-oscuro/20">·</span>
            <button
              onClick={eliminar}
              disabled={loading}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
