'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { ChatMessage } from '@/lib/types'

interface Conversacion {
  id: string
  session_id: string
  messages: ChatMessage[]
  tiene_lead: boolean
  lead_id: string | null
  created_at: string
  updated_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getLeadName(messages: ChatMessage[]): string | null {
  const namePattern = /(?:me llamo|soy|mi nombre es|llamame)\s+([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúüÜñÑ]{2,})?)/i
  const genericPattern = /^([A-Z][a-záéíóúüñ]{2,}(?:\s[A-Z][a-záéíóúüñ]{2,})?)[\s,!.]*$/
  for (const msg of messages.filter(m => m.role === 'user')) {
    const m = msg.content.match(namePattern) ?? msg.content.match(genericPattern)
    if (m) return (m[1] ?? m[0]).trim()
  }
  return null
}

function getFirstUserMessage(messages: ChatMessage[]): string {
  const first = messages.find(m => m.role === 'user')
  if (!first) return '—'
  return first.content.length > 80 ? first.content.slice(0, 80) + '…' : first.content
}

export default function ConversacionesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todas' | 'con_lead' | 'sin_lead'>('todas')

  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  useEffect(() => {
    if (!inmobiliariaId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('conversaciones')
      .select('*')
      .eq('inmobiliaria_id', inmobiliariaId)
      .order('updated_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setConversaciones((data as Conversacion[]) ?? [])
        setLoading(false)
      })
  }, [inmobiliariaId])

  const filtered = conversaciones.filter(c => {
    if (filter === 'con_lead') return c.tiene_lead
    if (filter === 'sin_lead') return !c.tiene_lead
    return true
  })

  const userMsgCount = (msgs: ChatMessage[]) => msgs.filter(m => m.role === 'user').length

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Conversaciones</h1>
        <p className="text-oscuro/50 text-sm mt-1">Historial completo de charlas con el chatbot</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: conversaciones.length, color: 'text-oscuro', bg: 'bg-crema' },
          { label: 'Con lead', value: conversaciones.filter(c => c.tiene_lead).length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Sin lead', value: conversaciones.filter(c => !c.tiene_lead).length, color: 'text-oscuro/60', bg: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-crema-dark rounded-2xl p-4 text-center`}>
            <p className={`font-playfair text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-oscuro/60 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['todas', 'con_lead', 'sin_lead'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-oscuro text-crema' : 'bg-white border border-crema-dark text-oscuro/70 hover:border-oscuro/40'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'con_lead' ? 'Con lead' : 'Sin lead'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-oscuro/40 text-sm">Cargando conversaciones…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-crema-dark rounded-2xl p-12 text-center">
          <p className="text-oscuro/40 text-sm">No hay conversaciones todavía.</p>
          <p className="text-oscuro/30 text-xs mt-1">Aparecerán cuando alguien use el chatbot en la web.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conv => {
            const nombre = getLeadName(conv.messages)
            const isExpanded = expanded === conv.id
            const msgCount = userMsgCount(conv.messages)

            return (
              <div key={conv.id} className="bg-white border border-crema-dark rounded-2xl overflow-hidden">
                {/* Fila resumen */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : conv.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-crema/20 transition-colors text-left"
                >
                  {/* Indicador lead */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${conv.tiene_lead ? 'bg-green-400' : 'bg-oscuro/20'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-oscuro text-sm">
                        {nombre ?? 'Visitante anónimo'}
                      </span>
                      {conv.tiene_lead && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Lead</span>
                      )}
                    </div>
                    <p className="text-oscuro/50 text-xs truncate mt-0.5">{getFirstUserMessage(conv.messages)}</p>
                  </div>

                  {/* Metadata */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-oscuro/60">{formatDate(conv.updated_at)}</p>
                    <p className="text-xs text-oscuro/40 mt-0.5">{msgCount} mensaje{msgCount !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-oscuro/40 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Chat expandido */}
                {isExpanded && (
                  <div className="border-t border-crema-dark bg-crema/20 px-5 py-4 space-y-2 max-h-96 overflow-y-auto">
                    {conv.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 text-xs rounded-xl ${
                          msg.role === 'user'
                            ? 'bg-dorado text-oscuro font-medium rounded-br-sm'
                            : 'bg-white text-oscuro border border-crema-dark rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
