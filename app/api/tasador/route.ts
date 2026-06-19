import { NextRequest, NextResponse } from 'next/server'

const APIFY_TOKEN = process.env.APIFY_TOKEN

// Slug para URL de Zonaprop
const TIPO_SLUG: Record<string, string> = {
  casa: 'casas',
  departamento: 'departamentos',
  ph: 'ph',
  lote: 'terrenos',
  local: 'locales',
  campo: 'campos',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json({ error: 'APIFY_TOKEN no configurado' }, { status: 500 })
    }

    const body = await req.json()
    const { tipo, operacion, ciudad } = body

    if (!tipo || !ciudad) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const tipoSlug = TIPO_SLUG[tipo] ?? `${tipo}s`
    const opSlug = operacion === 'alquiler' ? 'alquiler' : 'venta'
    const ciudadSlug = slugify(ciudad)
    const zonapropUrl = `https://www.zonaprop.com.ar/${tipoSlug}-${opSlug}-${ciudadSlug}.html`

    // RAG Web Browser: funciona para ciudades del interior, tarda ~8s
    const res = await fetch(
      'https://api.apify.com/v2/acts/apify~rag-web-browser/runs',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: zonapropUrl, maxResults: 1 }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Apify error:', err)
      return NextResponse.json({ error: 'Error al iniciar scraping' }, { status: 500 })
    }

    const data = await res.json()
    const runId: string = data.data.id
    const datasetId: string = data.data.defaultDatasetId

    return NextResponse.json({ runId, datasetId, zonapropUrl })
  } catch (error) {
    console.error('Tasador start error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
