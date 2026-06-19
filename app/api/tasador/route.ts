import { NextRequest, NextResponse } from 'next/server'

const APIFY_TOKEN = process.env.APIFY_TOKEN
const ACTOR_ID = 'solidcode~zonaprop-scraper'

const TIPO_MAP: Record<string, string> = {
  casa: 'casa',
  departamento: 'departamento',
  ph: 'ph',
  lote: 'terreno',
  local: 'local',
  campo: 'galpon',
}

export async function POST(req: NextRequest) {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json({ error: 'APIFY_TOKEN no configurado' }, { status: 500 })
    }

    const body = await req.json()
    const { tipo, operacion, ciudad, zona, metros, dormitorios } = body

    if (!tipo || !ciudad || !metros) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const location = zona ? `${zona}, ${ciudad}` : ciudad
    const zonapropTipo = TIPO_MAP[tipo] ?? tipo
    const margin = Math.round(Number(metros) * 0.3)

    const input = {
      location,
      transactionType: operacion === 'alquiler' ? 'alquiler' : 'venta',
      propertyTypes: [zonapropTipo],
      coveredAreaMin: Math.max(1, Number(metros) - margin),
      coveredAreaMax: Number(metros) + margin,
      ...(dormitorios ? { bedroomsMin: Math.max(1, Number(dormitorios) - 1) } : {}),
      maxResults: 15,
    }

    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Apify error:', err)
      return NextResponse.json({ error: 'Error al iniciar scraping en Zonaprop' }, { status: 500 })
    }

    const data = await res.json()
    const runId: string = data.data.id
    const datasetId: string = data.data.defaultDatasetId

    return NextResponse.json({ runId, datasetId })
  } catch (error) {
    console.error('Tasador start error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
