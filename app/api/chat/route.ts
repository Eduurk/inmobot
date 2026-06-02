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

    const propContexto =
      propiedades && propiedades.length > 0
        ? propiedades
            .map(
              (p) => `
• ${p.titulo} | ${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} en ${p.operacion}
  Precio: ${p.moneda} ${p.precio?.toLocaleString('es-AR') ?? 'Consultar'}${p.precio_periodo ? '/' + p.precio_periodo : ''}
  Zona: ${p.zona || p.direccion || 'Sin especificar'}
  ${p.metros_cuadrados ? p.metros_cuadrados + 'm²' : ''} ${p.ambientes ? '| ' + p.ambientes + ' amb.' : ''} ${p.dormitorios ? '| ' + p.dormitorios + ' dorm.' : ''} ${p.banos ? '| ' + p.banos + ' baños' : ''}
  ${p.cochera ? '✓ Cochera ' : ''}${p.apto_credito ? '✓ Apto crédito' : ''}
  ${p.descripcion ? p.descripcion.slice(0, 150) : ''}
  ID: ${p.id}`
            )
            .join('\n')
        : 'No hay propiedades cargadas en este momento.'

    const systemPrompt = `Sos ${inmo.chatbot_nombre || 'el asistente virtual'} de ${inmo.nombre}, una inmobiliaria de ${inmo.ciudad || 'Argentina'}.
${inmo.chatbot_prompt_extra ? '\n' + inmo.chatbot_prompt_extra + '\n' : ''}
PROPIEDADES DISPONIBLES HOY:
${propContexto}

DATOS DE CONTACTO:
- WhatsApp: ${inmo.whatsapp || inmo.telefono || 'Consultar'}
- Email: ${inmo.email || 'Consultar'}
- Dirección: ${inmo.direccion || 'Consultar'}

INSTRUCCIONES:
- Hablá en español rioplatense (vos, hacés, tenés)
- Respondé en máximo 3-4 oraciones, de forma clara y directa
- Si el cliente pregunta por una propiedad específica, describila con sus características principales
- Si el cliente quiere visitar una propiedad, pedile nombre y teléfono amablemente
- Si la consulta es compleja o urgente, derivá al WhatsApp
- Nunca inventes propiedades, precios ni datos que no estén en la lista de arriba
- Sé cálido, profesional y conciso`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
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
