import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const APIFY_TOKEN = process.env.APIFY_TOKEN
const ACTOR_ID = 'solidcode~zonaprop-scraper'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ApifyItem {
  title?: string
  propertyType?: string
  coveredArea?: number
  totalArea?: number
  address?: string
  location?: string
  priceUsd?: number
  priceArs?: number
  url?: string
}

function formatPrecioComparable(item: ApifyItem): string {
  if (item.priceUsd) return `USD ${item.priceUsd.toLocaleString('es-AR')}`
  if (item.priceArs) return `ARS ${item.priceArs.toLocaleString('es-AR')}`
  return 'Sin precio'
}

export async function POST(req: NextRequest) {
  try {
    const { runId, datasetId, form } = await req.json()

    if (!runId || !datasetId || !form) {
      return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })
    }

    // Verificar estado del run en Apify
    const statusRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
    )
    const statusData = await statusRes.json()
    const status: string = statusData.data?.status ?? 'UNKNOWN'

    if (status === 'RUNNING' || status === 'READY' || status === 'ABORTING') {
      return NextResponse.json({ status: 'running' })
    }

    if (status === 'ABORTED' || status === 'TIMED-OUT' || status === 'FAILED') {
      return NextResponse.json({ status: 'failed', error: 'El scraping no pudo completarse' })
    }

    // Run terminó con SUCCEEDED — traer items
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?limit=15`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
    )
    const items: ApifyItem[] = await itemsRes.json()

    if (!Array.isArray(items) || items.length === 0) {
      // Sin comparables: Claude estima igual con info de mercado general
      return NextResponse.json({
        status: 'done',
        valuacion: null,
        comparables: [],
        sinDatos: true,
      })
    }

    // Armar texto de comparables para Claude
    const comparablesTexto = items
      .slice(0, 12)
      .map((p, i) => {
        const precio = formatPrecioComparable(p)
        const m2 = p.coveredArea ?? p.totalArea
        const zona = p.address ?? p.location ?? ''
        return `${i + 1}. ${p.propertyType ?? ''} ${m2 ? m2 + 'm²' : ''} — ${zona} — ${precio}`
      })
      .join('\n')

    const prompt = `Sos un tasador inmobiliario experto en el mercado argentino, especializado en ${form.ciudad}.

PROPIEDAD A TASAR:
- Tipo: ${form.tipo}
- Operación: ${form.operacion ?? 'venta'}
- Ubicación: ${form.zona ? form.zona + ', ' : ''}${form.ciudad}
- Superficie cubierta: ${form.metros}m²
${form.ambientes ? `- Ambientes: ${form.ambientes}` : ''}
${form.dormitorios ? `- Dormitorios: ${form.dormitorios}` : ''}
${form.estado ? `- Estado: ${form.estado}` : ''}

PROPIEDADES COMPARABLES ACTUALES EN ZONAPROP (zona similar, m² similares):
${comparablesTexto}

Analizá los comparables y calculá la tasación. Considerá estado del mercado, m² y ubicación.
Respondé ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "precio_min": 85000,
  "precio_max": 98000,
  "precio_recomendado": 91000,
  "moneda": "USD",
  "precio_m2": 1100,
  "analisis": "2-3 oraciones explicando la tasación y el estado del mercado en la zona",
  "factores_positivos": ["factor positivo 1", "factor positivo 2"],
  "factores_negativos": ["factor que podría bajar el precio"],
  "confianza": "alta"
}`

    const aiRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = aiRes.content[0].type === 'text' ? aiRes.content[0].text : '{}'
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    let valuacion = null
    if (jsonMatch) {
      try { valuacion = JSON.parse(jsonMatch[0]) } catch { valuacion = null }
    }

    const comparables = items.slice(0, 5).map((p) => ({
      titulo: p.title ?? `${p.propertyType ?? ''} en ${p.address ?? p.location ?? ''}`,
      precio: formatPrecioComparable(p),
      metros: p.coveredArea ?? p.totalArea ?? null,
      zona: p.address ?? p.location ?? '',
      url: p.url ?? null,
    }))

    return NextResponse.json({ status: 'done', valuacion, comparables })
  } catch (error) {
    console.error('Tasador analizar error:', error)
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 })
  }
}
