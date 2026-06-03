import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, inmobiliariaId } = await req.json()

    if (!inmobiliariaId) {
      return NextResponse.json({ error: 'inmobiliariaId requerido' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const [{ data: inmo }, { data: propiedades }] = await Promise.all([
      supabase
        .from('inmobiliaria')
        .select('*')
        .eq('id', inmobiliariaId)
        .single(),
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

    // Verificar límite de 20 mensajes de usuario por sesión
    const userMessageCount = messages.filter((m: { role: string }) => m.role === 'user').length
    if (userMessageCount > 20) {
      return NextResponse.json({
        reply: `Alcanzaste el límite de consultas de esta sesión. Para continuar, contactanos directamente por WhatsApp al ${inmo.whatsapp || inmo.telefono || 'nuestro número'}.`,
      })
    }

    // Contexto compacto: solo campos esenciales para minimizar tokens
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
              ].filter(Boolean).join(' ')
              return `• ${p.titulo} | ${p.operacion} | ${precio} | ${p.zona || p.direccion || 'sin zona'} | ${detalles}`
            })
            .join('\n')
        : 'Sin propiedades disponibles.'

    const systemPrompt = `Asistente de ${inmo.nombre} (${inmo.ciudad}). ${inmo.chatbot_prompt_extra || ''}
PROPIEDADES: ${propContexto}
CONTACTO: WA ${inmo.whatsapp || inmo.telefono} | ${inmo.email || ''}
REGLAS: español rioplatense, máx 3 oraciones, pedí nombre+tel para visitas, derivá casos complejos al WA, no inventes datos.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: systemPrompt,
      // Solo últimos 6 mensajes para minimizar tokens de contexto
      messages: messages.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const reply =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la consulta' },
      { status: 500 }
    )
  }
}
