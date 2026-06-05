'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '@/lib/types'

const QUICK_SUGGESTIONS = [
  '¿Qué propiedades tienen disponibles?',
  '¿Tienen departamentos en alquiler?',
  '¿Cómo agendo una visita?',
  '¿Aceptan crédito hipotecario?',
]

const GREETING: ChatMessage = {
  role: 'assistant',
  content: '¡Hola! Soy el asistente virtual. Podés consultarme sobre nuestras propiedades disponibles, precios y visitas. ¿En qué te puedo ayudar?',
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
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Session ID persisted en sessionStorage (nueva sesión por pestaña/día)
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

      const userMsg: ChatMessage = { role: 'user', content: text }
      const newMessages: ChatMessage[] = [...messages, userMsg]
      setMessages(newMessages)
      setInput('')
      setIsTyping(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, inmobiliariaId, sessionId }),
        })

        const data = await res.json()
        const reply: ChatMessage = {
          role: 'assistant',
          content: data.reply ?? 'Hubo un problema, intentá de nuevo.',
        }
        setMessages([...newMessages, reply])
      } catch {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'No pude procesar tu consulta. Por favor, intentá de nuevo o contactanos por WhatsApp.',
          },
        ])
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
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100dvh-4rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

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
                <span className="text-crema/60 text-xs">En línea</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-crema/50 hover:text-crema transition-colors shrink-0"
              aria-label="Cerrar chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-crema/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-dorado text-oscuro font-medium rounded-2xl rounded-br-sm'
                      : 'bg-white text-oscuro rounded-2xl rounded-bl-sm shadow-sm border border-crema-dark'
                  }`}
                >
                  {msg.content}
                </div>
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
                {inmobiliariaId && (
                  <a href={`https://wa.me/`} className="underline text-amber-900">
                    Contactanos por WhatsApp
                  </a>
                )}
              </p>
            </div>
          )}

          {/* Input */}
          {!limitReached && (
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-crema-dark bg-white flex gap-2 shrink-0"
            >
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

          {/* Contador discreto */}
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
