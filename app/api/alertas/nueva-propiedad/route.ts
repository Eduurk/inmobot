import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceRoleClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { propiedad, inmobiliariaId } = await req.json()
    if (!propiedad || !inmobiliariaId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Traer leads activos con teléfono
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nombre, telefono, consulta, tipo_busqueda, presupuesto, estado')
      .eq('inmobiliaria_id', inmobiliariaId)
      .in('estado', ['nuevo', 'contactado', 'visita_agendada'])
      .not('telefono', 'is', null)

    if (!leads || leads.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Claude determina cuáles leads hacen match con la propiedad
    const propDesc = [
      `Tipo: ${propiedad.tipo}`,
      `Operación: ${propiedad.operacion}`,
      propiedad.precio ? `Precio: ${propiedad.moneda ?? 'USD'} ${propiedad.precio}` : null,
      propiedad.zona ? `Zona: ${propiedad.zona}` : null,
      propiedad.ambientes ? `Ambientes: ${propiedad.ambientes}` : null,
      propiedad.dormitorios ? `Dormitorios: ${propiedad.dormitorios}` : null,
      propiedad.metros_cuadrados ? `Metros: ${propiedad.metros_cuadrados}m²` : null,
      propiedad.descripcion ? `Descripción: ${propiedad.descripcion}` : null,
    ].filter(Boolean).join('\n')

    const leadsDesc = leads.map((l, i) =>
      `[${i}] ID:${l.id} | Nombre:${l.nombre ?? 'sin nombre'} | Busca:${l.tipo_busqueda ?? '?'} | Presupuesto:${l.presupuesto ?? '?'} | Consulta:"${(l.consulta ?? '').slice(0, 150)}"`
    ).join('\n')

    const prompt = `Sos un asistente inmobiliario. Tenés una propiedad nueva y una lista de leads.
Determiná cuáles leads podrían estar interesados en esta propiedad.

PROPIEDAD NUEVA:
${propDesc}

LEADS ACTIVOS:
${leadsDesc}

Respondé ÚNICAMENTE con un JSON array con los índices de los leads que hacen match (ej: [0, 2, 4]).
Si ninguno hace match, respondé [].
Criterios: operación compatible, presupuesto aproximado, tipo o zona mencionada en la consulta.`

    const aiRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = aiRes.content[0].type === 'text' ? aiRes.content[0].text : '[]'
    const match = raw.match(/\[[\d,\s]*\]/)
    const indices: number[] = match ? JSON.parse(match[0]) : []

    const matches = indices
      .filter(i => i >= 0 && i < leads.length)
      .map(i => leads[i])

    return NextResponse.json({ matches })
  } catch (e) {
    console.error('Alertas error:', e)
    return NextResponse.json({ matches: [] })
  }
}
