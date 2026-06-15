import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { PropPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Msg = { role: string; content: string }

function detectLead(messages: Msg[]) {
  const phonePattern = /(?:\+?54\s?)?(?:11|(?:2|3)\d{1,3})[\s-]?\d{3,4}[\s-]?\d{3,4}/
  const inlinePhonePattern = /(?:numero|n[uú]mero|tel[eé]fono|tel|celular)[^\d]*(\d{7,11})/i
  const nameExplicit = /(?:me llamo|soy|mi nombre es|llamame)\s+([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúüÜñÑ]{2,})?)/i
  const nameBeforePhone = /^([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,})+)\s+y\s+/i
  const fullName = /^([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,})+)[\s,!.]*$/
  const singleName = /^([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,})[\s,!.]*$/
  const botAskedName = /tu nombre|cómo te llamás|cuál es tu nombre|nombre para|podés dar.*nombre/i
  const botAskedContact = /nombre.*tel[eé]fono|tel[eé]fono.*nombre|nombre y.*n[uú]mero|contactarte|contactar/i

  let nombre: string | undefined
  let telefono: string | undefined

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== 'user') continue
    const phoneMatch = msg.content.match(phonePattern) ?? msg.content.match(inlinePhonePattern)
    if (phoneMatch) telefono = (phoneMatch[1] ?? phoneMatch[0]).replace(/[\s-]/g, '')
    const nameMatch = msg.content.match(nameExplicit) ?? msg.content.match(nameBeforePhone) ?? msg.content.match(fullName)
    if (nameMatch) nombre = (nameMatch[1] ?? nameMatch[0])?.trim()
    if (i > 0) {
      const prev = messages[i - 1]
      if (prev?.role === 'assistant') {
        if (!nombre && botAskedName.test(prev.content)) {
          const m = msg.content.trim().match(singleName)
          if (m) nombre = m[1].trim()
        }
        if (!telefono && botAskedContact.test(prev.content)) {
          const m = msg.content.match(/\d{7,11}/)
          if (m) telefono = m[0]
        }
      }
    }
  }

  return { nombre, telefono }
}

function extractQualification(messages: Msg[]) {
  const text = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ').toLowerCase()
  let presupuesto: string | null = null
  const budgetMatch = text.match(/(?:presupuesto|hasta|tengo|cuento con)[^.]*?(\$?\s*\d[\d.,]*\s*(?:k|mil(?:lones?)?|m(?:illones?)?)?(?:\s*(?:pesos|dolares|dólares|usd))?)/i)
  if (budgetMatch) presupuesto = budgetMatch[1]?.trim().slice(0, 80) ?? null
  let plazo: string | null = null
  if (/urgente|ya mismo|inmediato|lo antes posible|cuanto antes/.test(text)) plazo = 'urgente'
  else if (/\b\d+\s*meses?\b|corto plazo|pronto|este mes/.test(text)) plazo = '1-3 meses'
  else if (/fin de año|largo plazo|explorando|mirando|no hay apuro|sin apuro/.test(text)) plazo = 'explorando'
  let tipo_busqueda: string | null = null
  if (/comprar|compra|adquirir/.test(text)) tipo_busqueda = 'compra'
  else if (/temporada|verano|vacacion/.test(text)) tipo_busqueda = 'temporada'
  else if (/alquil/.test(text)) tipo_busqueda = 'alquiler'
  let necesita_financiacion: boolean | null = null
  if (/crédito|hipotecario|financiación|financiamiento|préstamo|banco|cuotas/.test(text)) necesita_financiacion = true
  else if (/contado|efectivo|no necesito crédito/.test(text)) necesita_financiacion = false
  return { presupuesto, plazo, tipo_busqueda, necesita_financiacion }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPrecio(p: any): string {
  if (!p.precio) return 'Consultar'
  const n = p.precio.toLocaleString('es-AR')
  const symbol = p.moneda === 'USD' ? 'USD' : '$'
  const period = p.precio_periodo === 'mensual' ? '/mes' : p.precio_periodo === 'semanal' ? '/sem' : ''
  return `${symbol} ${n}${period}`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, inmobiliariaId, sessionId } = await req.json()

    if (!inmobiliariaId) {
      return NextResponse.json({ error: 'inmobiliariaId requerido' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const [{ data: inmo }, { data: propiedades }] = await Promise.all([
      supabase.from('inmobiliaria').select('*').eq('id', inmobiliariaId).single(),
      supabase
        .from('propiedades')
        .select('*, fotos_propiedad(url, es_principal, orden)')
        .eq('inmobiliaria_id', inmobiliariaId)
        .eq('estado', 'disponible')
        .order('destacada', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (!inmo) return NextResponse.json({ error: 'Inmobiliaria no encontrada' }, { status: 404 })
    if (!inmo.chatbot_activo) {
      return NextResponse.json({ reply: 'El chatbot está temporalmente desactivado. Contactanos por teléfono.' })
    }

    const userMessageCount = messages.filter((m: Msg) => m.role === 'user').length
    if (userMessageCount > 20) {
      return NextResponse.json({
        reply: `Alcanzaste el límite de consultas. Contactanos por WhatsApp al ${inmo.whatsapp || inmo.telefono || 'nuestro número'}.`,
      })
    }

    // Contexto de propiedades con IDs para que Claude pueda referenciarlas
    const propContexto =
      propiedades && propiedades.length > 0
        ? propiedades
            .map((p) => {
              const precio = formatPrecio(p)
              const detalles = [
                p.metros_cuadrados && `${p.metros_cuadrados}m²`,
                p.ambientes && `${p.ambientes}amb`,
                p.dormitorios && `${p.dormitorios}dorm`,
                p.cochera && 'cochera',
                p.apto_credito && 'crédito',
              ].filter(Boolean).join(' ')
              return `[ID:${p.id}] ${p.titulo} | ${p.operacion} | ${precio} | ${p.zona || p.direccion || 'sin zona'} | ${detalles}`
            })
            .join('\n')
        : 'Sin propiedades disponibles.'

    const systemPrompt = `Sos el asistente de ventas de ${inmo.nombre}, inmobiliaria en ${inmo.ciudad}. ${inmo.chatbot_prompt_extra || ''}

PROPIEDADES DISPONIBLES (cada una tiene un ID único):
${propContexto}

CONTACTO: WhatsApp ${inmo.whatsapp || inmo.telefono} | ${inmo.email || ''}

CÓMO MOSTRAR PROPIEDADES VISUALMENTE:
Cuando quieras que el usuario vea las fotos de propiedades, agregá al FINAL de tu mensaje este tag: [PROPS:id1,id2,id3]
Usá los IDs exactos de la lista de arriba. Máximo 3 propiedades por vez. El tag es invisible para el usuario.

CUÁNDO MOSTRAR PROPIEDADES:
- Siempre que menciones una propiedad específica → [PROPS:id]
- Cuando el usuario pida ver opciones o qué tienen disponible → mostrá las 2-3 más relevantes
- Cuando el usuario dé pistas de qué busca → sugerí las que mejor encajan
- Al inicio si el usuario dice "qué tienen" → mostrá las destacadas

TONO Y VENTAS:
- Español rioplatense, cercano y profesional
- Máximo 2-3 oraciones de texto (las fotos hablan solas)
- Destacá el beneficio principal: vista al mar, pileta, ubicación, precio
- Creá urgencia genuina cuando aplique: "esta propiedad tiene varias consultas esta semana"
- Si el usuario muestra interés, preguntá de forma natural: presupuesto, plazo, si necesita crédito
- Si pide visita, pedí nombre y teléfono
- Derivá casos complejos al WhatsApp`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.slice(-6).map((m: Msg) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const rawReply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parsear el tag [PROPS:id1,id2,...]
    const propsTagMatch = rawReply.match(/\[PROPS:([\w,\-]+)\]/)
    const reply = rawReply.replace(/\[PROPS:[^\]]+\]/g, '').trim()

    let propsPreviews: PropPreview[] = []
    if (propsTagMatch && propiedades) {
      const ids = propsTagMatch[1].split(',').map((id) => id.trim()).filter(Boolean).slice(0, 3)
      for (const id of ids) {
        const p = propiedades.find((pr) => pr.id === id)
        if (!p) continue
        const fotos = (p.fotos_propiedad ?? []) as { url: string; es_principal: boolean; orden: number }[]
        const sorted = [...fotos].sort((a, b) => a.orden - b.orden)
        const fotoUrl = fotos.find((f) => f.es_principal)?.url ?? sorted[0]?.url ?? null
        propsPreviews.push({
          id: p.id,
          titulo: p.titulo,
          precio: formatPrecio(p),
          zona: p.zona ?? p.direccion ?? null,
          foto_url: fotoUrl,
          operacion: p.operacion,
          tipo: p.tipo,
        })
      }
    }

    // Guardar conversación y lead en background
    if (sessionId) {
      const fullMessages = [...messages, { role: 'assistant', content: reply }]
      const { nombre, telefono } = detectLead(messages)
      const tiene_lead = !!(nombre && telefono)
      const qualification = extractQualification(messages)

      const saveConversation = supabase
        .from('conversaciones')
        .upsert(
          { inmobiliaria_id: inmobiliariaId, session_id: sessionId, messages: fullMessages, tiene_lead, updated_at: new Date().toISOString() },
          { onConflict: 'inmobiliaria_id,session_id' }
        )

      const saveLead = tiene_lead
        ? (async () => {
            const qualFields = Object.fromEntries(Object.entries(qualification).filter(([, v]) => v !== null))
            const consulta = messages.filter((m: Msg) => m.role === 'user').slice(-4).map((m: Msg) => m.content).join(' | ').slice(0, 500)
            const { data: existing } = await supabase.from('leads').select('id').eq('inmobiliaria_id', inmobiliariaId).eq('session_id', sessionId).single()
            if (existing) {
              await supabase.from('leads').update({ nombre, telefono, ...qualFields, consulta }).eq('id', existing.id)
            } else {
              const { data: newLead } = await supabase.from('leads').insert({ inmobiliaria_id: inmobiliariaId, session_id: sessionId, nombre, telefono, canal: 'chatbot', consulta, ...qualFields }).select('id').single()
              if (newLead) await supabase.from('conversaciones').update({ lead_id: newLead.id }).eq('inmobiliaria_id', inmobiliariaId).eq('session_id', sessionId)
            }
          })()
        : Promise.resolve()

      Promise.all([saveConversation, saveLead]).catch(console.error)
    }

    return NextResponse.json({ reply, propiedades: propsPreviews })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }
}
