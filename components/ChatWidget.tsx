'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { PropPreview } from '@/lib/types'

type ExtendedMessage = {
  role: 'user' | 'assistant'
  content: string
  propiedades?: PropPreview[]
}

const QUICK_SUGGESTIONS = [
  '¿Qué propiedades tienen disponibles?',
  '¿Tienen departamentos en alquiler?',
  '¿Cómo agendo una visita?',
  '¿Aceptan crédito hipotecario?',
]

const GREETING: ExtendedMessage = {
  role: 'assistant',
  content: '¡Hola! Soy el asistente virtual de ventas. Podés preguntarme por propiedades, precios y visitas. ¿Qué estás buscando?',
}

const operacionLabel: Record<string, string> = { venta: 'Venta', alquiler: 'Alquiler', temporada: 'Temporada' }

function PropCard({ prop }: { prop: PropPreview }) {
  return (
    <a
      href={`/propiedades/${prop.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 bg-white border border-crema-dark rounded-xl p-2 hover:border-dorado/50 hover:shadow-md transition-all group"
    >
      {/* Foto */}
      <div className="shrink-0 w-16 h-14 rounded-lg overflow-hidden bg-crema">
        {prop.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prop.foto_url} alt={prop.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-dorado/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-dorado font-semibold uppercase tracking-wide mb-0.5">
          {operacionLabel[prop.operacion] ?? prop.operacion}
        </p>
        <p className="text-oscuro font-semibold text-xs leading-tight line-clamp-2 mb-1">{prop.titulo}</p>
        {prop.zona && <p className="text-oscuro/50 text-xs truncate">{prop.zona}</p>}
      </div>

      {/* Precio */}
      <div className="shrink-0 text-right">
        <p className="text-dorado font-bold text-xs leading-tight whitespace-nowrap">{prop.precio}</p>
        <p className="text-oscuro/40 text-xs mt-1 group-hover:text-dorado transition-colors">Ver →</p>
      </div>
    </a>
  )
}

function SendIcon() {
  return (
    <svg className="w-4 h-4 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

export default function ChatWidget() {
  const MAX_USER_MESSAGES = 20
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ExtendedMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return `sess_${Math.random().toString(36).slice(2)}`
    const stored = sessionStorage.getItem('inmobot_session')
    if (stored) return stored
    const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('inmobot_session', newId)
    return newId
  })

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const limitReached = userMessageCount >= MAX_USER_MESSAGES
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim()
      if (!text || isTyping) return

      const userMsg: ExtendedMessage = { role: 'user', content: text }
      // Solo enviamos texto plano al API (sin propiedades)
      const historyForApi = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const newMessages: ExtendedMessage[] = [...messages, userMsg]
      setMessages(newMessages)
      setInput('')
      setIsTyping(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyForApi, inmobiliariaId, sessionId }),
        })

        const data = await res.json()
        const reply: ExtendedMessage = {
          role: 'assistant',
          content: data.reply ?? 'Hubo un problema, intentá de nuevo.',
          propiedades: data.propiedades?.length > 0 ? data.propiedades : undefined,
        }
        setMessages([...newMessages, reply])
      } catch {
        setMessages([...newMessages, { role: 'assistant', content: 'No pude procesar tu consulta. Intentá de nuevo o contactanos por WhatsApp.' }])
      } finally {
        setIsTyping(false)
      }
    },
    [messages, isTyping, inmobiliariaId, sessionId]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const showSuggestions = messages.length <= 1

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-dorado text-oscuro rounded-full shadow-xl flex items-center justify-center hover:bg-dorado-light hover:scale-105 transition-all duration-200 animate-fade-in"
          aria-label="Abrir chat"
        >
          <ChatIcon />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100dvh-4rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="bg-oscuro px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-dorado flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-crema font-semibold text-sm truncate">Asistente Virtual</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                <span className="text-crema/60 text-xs">En línea · Responde al instante</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-crema/50 hover:text-crema transition-colors shrink-0" aria-label="Cerrar chat">
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-crema/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in gap-2`}>
                {/* Burbuja de texto */}
                {msg.content && (
                  <div
                    className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-dorado text-oscuro font-medium rounded-2xl rounded-br-sm'
                        : 'bg-white text-oscuro rounded-2xl rounded-bl-sm shadow-sm border border-crema-dark'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Mini-cards de propiedades */}
                {msg.propiedades && msg.propiedades.length > 0 && (
                  <div className="w-full max-w-[90%] flex flex-col gap-2">
                    {msg.propiedades.map((prop) => (
                      <PropCard key={prop.id} prop={prop} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-crema-dark px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center h-3">
                    <span className="typing-dot w-2 h-2 bg-dorado rounded-full block" />
                    <span className="typing-dot w-2 h-2 bg-dorado rounded-full block" />
                    <span className="typing-dot w-2 h-2 bg-dorado rounded-full block" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {showSuggestions && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-crema-dark bg-white shrink-0">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-crema border border-dorado/25 text-oscuro/80 px-2.5 py-1 rounded-full hover:border-dorado hover:bg-dorado/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Límite alcanzado */}
          {limitReached && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 shrink-0">
              <p className="text-xs text-amber-800 font-medium text-center">
                Límite de consultas alcanzado.{' '}
                <a href={`https://wa.me/`} className="underline text-amber-900">Contactanos por WhatsApp</a>
              </p>
            </div>
          )}

          {/* Input */}
          {!limitReached && (
            <form onSubmit={handleSubmit} className="p-3 border-t border-crema-dark bg-white flex gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu consulta..."
                className="flex-1 bg-crema border border-crema-dark rounded-full px-4 py-2 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado transition-colors"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 bg-dorado rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-dorado-light transition-all"
                aria-label="Enviar"
              >
                <SendIcon />
              </button>
            </form>
          )}

          {!limitReached && userMessageCount >= 15 && (
            <p className="text-center text-oscuro/30 text-xs pb-1 shrink-0">
              {MAX_USER_MESSAGES - userMessageCount} consulta{MAX_USER_MESSAGES - userMessageCount !== 1 ? 's' : ''} restante{MAX_USER_MESSAGES - userMessageCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </>
  )
}
