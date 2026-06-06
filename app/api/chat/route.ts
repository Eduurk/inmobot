import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Msg = { role: string; content: string }

function detectLead(messages: Msg[]) {
  const phonePattern = /(?:\+?54\s?)?(?:11|(?:2|3)\d{2,3})[\s-]?\d{3,4}[\s-]?\d{4}/
  // Frase explícita: "me llamo X", "soy X", etc.
  const namePattern = /(?:me llamo|soy|mi nombre es|llamame)\s+([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúüÜñÑ]{2,})?)/i
  // Dos palabras que parecen nombre completo (cualquier capitalización)
  const fullNamePattern = /^([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,}(?:\s[A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,})+)[\s,!.]*$/
  // Nombre simple (solo cuando el bot lo pidió)
  const singleNamePattern = /^([A-Za-záéíóúÁÉÍÓÚüÜñÑ]{2,})[\s,!.]*$/
  const botAskedName = /tu nombre|cómo te llamás|cuál es tu nombre|nombre para|podés dar.*nombre/i

  let nombre: string | undefined
  let telefono: string | undefined

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== 'user') continue

    const phoneMatch = msg.content.match(phonePattern)
    const nameMatch = msg.content.match(namePattern) ?? msg.content.match(fullNamePattern)

    if (phoneMatch) telefono = phoneMatch[0].replace(/\s/g, '')
    if (nameMatch) nombre = (nameMatch[1] ?? nameMatch[0])?.trim()

    // Contexto: si el bot preguntó el nombre, la respuesta del usuario es el nombre
    if (!nameMatch && i > 0) {
      const prevBot = messages[i - 1]
      if (prevBot?.role === 'assistant' && botAskedName.test(prevBot.content)) {
        const single = msg.content.trim().match(singleNamePattern)
        if (single) nombre = single[1].trim()
      }
    }
  }

  return { nombre, telefono }
}

function extractQualification(messages: Msg[]) {
  const text = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')
    .toLowerCase()

  let presupuesto: string | null = null
  const budgetMatch = text.match(
    /(?:presupuesto|hasta|tengo|cuento con)[^.]*?(\$?\s*\d[\d.,]*\s*(?:k|mil(?:lones?)?|m(?:illones?)?)?(?:\s*(?:pesos|dolares|dólares|usd))?)/i
  )
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
  if (/crédito|hipotecario|financiación|financiamiento|préstamo|banco|cuotas/.test(text))
    necesita_financiacion = true
  else if (/contado|efectivo|no necesito crédito/.test(text)) necesita_financiacion = false

  return { presupuesto, plazo, tipo_busqueda, necesita_financiacion }
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
        .select('*, fotos_propiedad(url, es_principal)')
        .eq('inmobiliaria_id', inmobiliariaId)
        .eq('estado', 'disponible')
        .order('destacada', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (!inmo) {
      return NextResponse.json({ error: 'Inmobiliaria no encontrada' }, { status: 404 })
    }

    if (!inmo.chatbot_activo) {
      return NextResponse.json({
        reply: 'El chatbot está temporalmente desactivado. Por favor, contactanos por teléfono.',
      })
    }

    const userMessageCount = messages.filter((m: Msg) => m.role === 'user').length
    if (userMessageCount > 20) {
      return NextResponse.json({
        reply: `Alcanzaste el límite de consultas de esta sesión. Para continuar, contactanos directamente por WhatsApp al ${inmo.whatsapp || inmo.telefono || 'nuestro número'}.`,
      })
    }

    const propContexto =
      propiedades && propiedades.length > 0
        ? propiedades
            .map((p) => {
              const precio = p.precio
                ? `${p.moneda} ${p.precio.toLocaleString('es-AR')}${p.precio_periodo ? '/' + p.precio_periodo : ''}`
                : 'Consultar'
              const detalles = [
                p.metros_cuadrados && `${p.metros_cuadrados}m²`,
                p.ambientes && `${p.ambientes}amb`,
                p.dormitorios && `${p.dormitorios}dorm`,
                p.cochera && 'cochera',
                p.apto_credito && 'crédito',
              ]
                .filter(Boolean)
                .join(' ')
              return `• ${p.titulo} | ${p.operacion} | ${precio} | ${p.zona || p.direccion || 'sin zona'} | ${detalles}`
            })
            .join('\n')
        : 'Sin propiedades disponibles.'

    const systemPrompt = `Asistente de ${inmo.nombre} (${inmo.ciudad}). ${inmo.chatbot_prompt_extra || ''}
PROPIEDADES: ${propContexto}
CONTACTO: WA ${inmo.whatsapp || inmo.telefono} | ${inmo.email || ''}
REGLAS: español rioplatense, máx 3 oraciones, no inventes datos, derivá casos complejos al WA.
CALIFICACIÓN: si el visitante muestra interés concreto, preguntá de a una por turno (de forma natural): presupuesto aproximado, plazo de búsqueda (urgente / 3-6 meses / explorando), si necesita crédito hipotecario. Si pide visita, pedí nombre y teléfono.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: systemPrompt,
      messages: messages.slice(-6).map((m: Msg) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Guardar conversación y lead en background (no bloquea la respuesta)
    if (sessionId) {
      const fullMessages = [...messages, { role: 'assistant', content: reply }]
      const { nombre, telefono } = detectLead(messages)
      const tiene_lead = !!(nombre && telefono)
      const qualification = extractQualification(messages)

      const saveConversation = supabase
        .from('conversaciones')
        .upsert(
          {
            inmobiliaria_id: inmobiliariaId,
            session_id: sessionId,
            messages: fullMessages,
            tiene_lead,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'inmobiliaria_id,session_id' }
        )

      const saveLead = tiene_lead
        ? (async () => {
            const qualFields = Object.fromEntries(
              Object.entries(qualification).filter(([, v]) => v !== null)
            )
            const consulta = messages
              .filter((m: Msg) => m.role === 'user')
              .slice(-4)
              .map((m: Msg) => m.content)
              .join(' | ')
              .slice(0, 500)

            // Verificar si ya existe un lead para esta sesión
            const { data: existing } = await supabase
              .from('leads')
              .select('id')
              .eq('inmobiliaria_id', inmobiliariaId)
              .eq('session_id', sessionId)
              .single()

            if (existing) {
              await supabase
                .from('leads')
                .update({ nombre, telefono, ...qualFields, consulta })
                .eq('id', existing.id)
            } else {
              const { data: newLead } = await supabase
                .from('leads')
                .insert({
                  inmobiliaria_id: inmobiliariaId,
                  session_id: sessionId,
                  nombre,
                  telefono,
                  canal: 'chatbot',
                  consulta,
                  ...qualFields,
                })
                .select('id')
                .single()

              // Vincular lead a la conversación
              if (newLead) {
                await supabase
                  .from('conversaciones')
                  .update({ lead_id: newLead.id })
                  .eq('inmobiliaria_id', inmobiliariaId)
                  .eq('session_id', sessionId)
              }
            }
          })()
        : Promise.resolve()

      Promise.all([saveConversation, saveLead]).catch(console.error)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }
}
