'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { Inmobiliaria, Lead, ChatMessage } from '@/lib/types'

export default function ChatbotConfigPage() {
  const supabase = createClient()
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  const [inmo, setInmo] = useState<Inmobiliaria | null>(null)
  const [nombre, setNombre] = useState('')
  const [promptExtra, setPromptExtra] = useState('')
  const [activo, setActivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)

  // Preview chat state
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?' }
  ])
  const [previewInput, setPreviewInput] = useState('')
  const [previewTyping, setPreviewTyping] = useState(false)
  const previewEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!inmobiliariaId) return
    Promise.all([
      supabase.from('inmobiliaria').select('*').eq('id', inmobiliariaId).single(),
      supabase.from('leads').select('*').eq('inmobiliaria_id', inmobiliariaId).order('created_at', { ascending: false }).limit(50),
    ]).then(([{ data: inmoData }, { data: leadsData }]) => {
      if (inmoData) {
        setInmo(inmoData as Inmobiliaria)
        setNombre(inmoData.chatbot_nombre ?? 'Asistente')
        setPromptExtra(inmoData.chatbot_prompt_extra ?? '')
        setActivo(inmoData.chatbot_activo ?? true)
      }
      setLeads((leadsData ?? []) as Lead[])
      setLoadingLeads(false)
    })
  }, [inmobiliariaId])

  useEffect(() => {
    previewEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [previewMessages])

  const handleSave = async () => {
    if (!inmobiliariaId) return
    setSaving(true)
    await supabase
      .from('inmobiliaria')
      .update({ chatbot_nombre: nombre, chatbot_prompt_extra: promptExtra, chatbot_activo: activo })
      .eq('id', inmobiliariaId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sendPreview = async () => {
    const text = previewInput.trim()
    if (!text || previewTyping) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...previewMessages, userMsg]
    setPreviewMessages(newMessages)
    setPreviewInput('')
    setPreviewTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, inmobiliariaId }),
      })
      const data = await res.json()
      setPreviewMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setPreviewMessages([...newMessages, { role: 'assistant', content: 'Error al conectar con el chatbot.' }])
    } finally {
      setPreviewTyping(false)
    }
  }

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Configuración del Chatbot</h1>
        <p className="text-oscuro/50 text-sm mt-1">Personalizá cómo responde tu asistente virtual</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Config panel */}
        <div className="space-y-5">
          <div className="bg-white border border-crema-dark rounded-2xl p-6">
            <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Personalización</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-oscuro mb-1.5">Nombre del asistente</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Asistente Sur Propiedades"
                  className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-2.5 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-oscuro mb-1.5">
                  Instrucciones adicionales
                </label>
                <textarea
                  value={promptExtra}
                  onChange={(e) => setPromptExtra(e.target.value)}
                  rows={6}
                  placeholder={`Escribí en lenguaje natural cómo querés que responda tu asistente. Por ejemplo:\n\n"Cuando te pregunten por alquileres, siempre mencioná que aceptamos mascotas. Si alguien pregunta por financiación, explicá que trabajamos con Banco Nación. Siempre recordá mencionar que tenemos estacionamiento gratuito para visitas."`}
                  className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado transition-all resize-none"
                />
                <p className="text-oscuro/40 text-xs mt-1.5">
                  Escribí en lenguaje natural. No necesitás saber de programación.
                </p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-crema rounded-xl">
                <div>
                  <p className="text-sm font-medium text-oscuro">Chatbot activo</p>
                  <p className="text-xs text-oscuro/50">Los visitantes pueden chatear en la landing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivo((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${activo ? 'bg-dorado' : 'bg-crema-dark'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${activo ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-crema-dark">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-oscuro text-crema py-2.5 rounded-xl text-sm font-semibold hover:bg-oscuro/90 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
              {saved && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preview chat */}
        <div className="bg-white border border-crema-dark rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '420px' }}>
          <div className="bg-oscuro px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-dorado flex items-center justify-center">
              <svg className="w-4 h-4 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-crema text-sm font-semibold">{nombre || 'Asistente Virtual'}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-crema/50 text-xs">Preview en vivo</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-crema/20">
            {previewMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-dorado text-oscuro font-medium' : 'bg-white text-oscuro border border-crema-dark'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {previewTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-crema-dark px-3 py-2.5 rounded-xl">
                  <div className="flex gap-1">
                    <span className="typing-dot w-1.5 h-1.5 bg-dorado rounded-full block" />
                    <span className="typing-dot w-1.5 h-1.5 bg-dorado rounded-full block" />
                    <span className="typing-dot w-1.5 h-1.5 bg-dorado rounded-full block" />
                  </div>
                </div>
              </div>
            )}
            <div ref={previewEndRef} />
          </div>

          <div className="p-3 border-t border-crema-dark flex gap-2 shrink-0">
            <input
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendPreview())}
              placeholder="Probá el chatbot aquí..."
              className="flex-1 bg-crema border border-crema-dark rounded-full px-3 py-2 text-sm outline-none focus:border-dorado"
              disabled={!inmobiliariaId || previewTyping}
            />
            <button
              onClick={sendPreview}
              disabled={!previewInput.trim() || previewTyping || !inmobiliariaId}
              className="w-8 h-8 bg-dorado rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              <svg className="w-3.5 h-3.5 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Leads table */}
      <div className="bg-white border border-crema-dark rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-crema-dark flex items-center justify-between">
          <div>
            <h2 className="font-playfair text-lg font-semibold text-oscuro">Leads del chatbot</h2>
            <p className="text-oscuro/50 text-xs mt-0.5">{leads.length} contacto{leads.length !== 1 ? 's' : ''} capturado{leads.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loadingLeads ? (
          <div className="p-8 text-center text-oscuro/40 text-sm">Cargando...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-crema rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-oscuro/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-oscuro/50 text-sm">Todavía no hay leads. Cuando alguien deje su nombre y teléfono en el chat, aparecerá acá.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-crema-dark">
                  {['Nombre', 'Teléfono', 'Email', 'Consulta', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-oscuro/50 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-crema-dark/60">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-crema/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-oscuro">{lead.nombre ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      {lead.telefono ? (
                        <a
                          href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-dorado hover:underline"
                        >
                          {lead.telefono}
                        </a>
                      ) : (
                        <span className="text-sm text-oscuro/40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-oscuro/60">{lead.email ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-sm text-oscuro/70 truncate">{lead.consulta ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-oscuro/50">
                        {new Date(lead.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
