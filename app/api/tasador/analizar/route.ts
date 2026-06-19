import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const APIFY_TOKEN = process.env.APIFY_TOKEN
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { runId, datasetId, form } = await req.json()

    if (!runId || !datasetId || !form) {
      return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 })
    }

    // Verificar estado del run
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
    )

    if (!statusRes.ok) {
      return NextResponse.json({ status: 'running' })
    }

    const statusData = await statusRes.json()
    const status: string = statusData.data?.status ?? 'UNKNOWN'

    if (['RUNNING', 'READY', 'ABORTING', 'TIMING-OUT'].includes(status)) {
      return NextResponse.json({ status: 'running' })
    }

    if (['ABORTED', 'TIMED-OUT', 'FAILED'].includes(status)) {
      // En vez de fallar, seguimos con análisis sin datos de Zonaprop
      return analizarSinComparables(form)
    }

    // SUCCEEDED — traer markdown del dataset
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
    )

    let markdownContent = ''
    if (itemsRes.ok) {
      const items = await itemsRes.json()
      if (Array.isArray(items) && items.length > 0) {
        markdownContent = items[0]?.markdown ?? ''
      }
    }

    return analizarConMarkdown(form, markdownContent)
  } catch (error) {
    console.error('Tasador analizar error:', error)
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 })
  }
}

async function analizarConMarkdown(form: Record<string, string>, markdown: string) {
  // Tomar solo los primeros 3000 chars del markdown para no exceder tokens
  const extracto = markdown.slice(0, 3000)
  const tieneComparables = extracto.length > 200

  const prompt = `Sos un tasador inmobiliario experto en el mercado argentino, especializado en ${form.ciudad}.

PROPIEDAD A TASAR:
- Tipo: ${form.tipo}
- Operación: ${form.operacion ?? 'venta'}
- Ubicación: ${form.zona ? form.zona + ', ' : ''}${form.ciudad}
- Superficie cubierta: ${form.metros}m²
${form.ambientes ? `- Ambientes: ${form.ambientes}` : ''}
${form.dormitorios ? `- Dormitorios: ${form.dormitorios}` : ''}
${form.estado ? `- Estado: ${form.estado}` : ''}

${tieneComparables ? `DATOS DE ZONAPROP (página de búsqueda):
${extracto}

Analizá las propiedades que aparecen en esa página y compará con la propiedad a tasar.` : `No hay datos en tiempo real de Zonaprop para esta búsqueda. Usá tu conocimiento del mercado inmobiliario de ${form.ciudad} para hacer la tasación.`}

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

  // Extraer comparables del markdown si hay
  const comparables: { titulo: string; precio: string; metros: string | null; zona: string; url: string | null }[] = []

  return NextResponse.json({
    status: 'done',
    valuacion,
    comparables,
    sinDatos: !tieneComparables,
  })
}

async function analizarSinComparables(form: Record<string, string>) {
  return analizarConMarkdown(form, '')
}
