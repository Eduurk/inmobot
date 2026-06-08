import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { AudioTourScript } from '@/lib/types'

// Vercel Pro: 60s timeout for heavy generation
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generateScript(propiedad: Record<string, unknown>, cantFotos: number): Promise<AudioTourScript> {
  const totalSegundos = Math.max(cantFotos * 7, 20)

  const detalles = [
    propiedad.tipo && `Tipo: ${propiedad.tipo}`,
    propiedad.operacion && `Operación: ${propiedad.operacion}`,
    propiedad.metros_cuadrados && `${propiedad.metros_cuadrados}m²`,
    propiedad.ambientes && `${propiedad.ambientes} ambientes`,
    propiedad.dormitorios && `${propiedad.dormitorios} dormitorios`,
    propiedad.banos && `${propiedad.banos} baños`,
    propiedad.cochera && 'cochera',
    propiedad.apto_credito && 'apto crédito',
    propiedad.zona && `Zona: ${propiedad.zona}`,
    propiedad.direccion && `Dirección: ${propiedad.direccion}`,
    propiedad.precio && `Precio: ${propiedad.moneda} ${propiedad.precio}`,
    propiedad.descripcion && `Descripción: ${propiedad.descripcion}`,
    propiedad.caracteristicas && `Características: ${(propiedad.caracteristicas as string[]).join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Sos un locutor inmobiliario profesional argentino. Generá un guión de narración para un tour virtual de esta propiedad.

PROPIEDAD:
Título: ${propiedad.titulo}
${detalles}

INSTRUCCIONES:
- El tour dura aproximadamente ${totalSegundos} segundos con ${cantFotos} foto(s)
- Usá español rioplatense, tono cálido y profesional
- Distribuí la narración en secciones, una por foto
- Cada sección debe durar entre 5 y 10 segundos de habla

Respondé SOLO con un JSON válido con esta estructura exacta (sin texto extra):
{
  "narracion": "texto completo de la narración sin pausas ni indicaciones",
  "slides": [
    { "indice": 0, "inicio": 0, "duracion": 7 },
    { "indice": 1, "inicio": 7, "duracion": 6 }
  ],
  "total_segundos": ${totalSegundos}
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude no devolvió JSON válido')

  return JSON.parse(jsonMatch[0]) as AudioTourScript
}

async function generateAudio(narracion: string): Promise<Buffer> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: narracion,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.80 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs error ${response.status}: ${err}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient()
    const propiedadId = params.id

    // 1. Load property + photos
    const { data: propiedad, error: propError } = await supabase
      .from('propiedades')
      .select('*, fotos_propiedad(url, orden)')
      .eq('id', propiedadId)
      .single()

    if (propError || !propiedad) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const fotos = (propiedad.fotos_propiedad ?? []).sort(
      (a: { orden: number }, b: { orden: number }) => a.orden - b.orden
    )

    if (fotos.length === 0) {
      return NextResponse.json({ error: 'La propiedad no tiene fotos' }, { status: 400 })
    }

    // 2. Mark as generating
    await supabase
      .from('propiedades')
      .update({ audio_tour_estado: 'generating' })
      .eq('id', propiedadId)

    // 3. Generate script with Claude
    const script = await generateScript(propiedad, fotos.length)

    // Ensure slide count matches actual photos
    script.slides = script.slides.slice(0, fotos.length)
    while (script.slides.length < fotos.length) {
      const last = script.slides[script.slides.length - 1]
      script.slides.push({
        indice: script.slides.length,
        inicio: (last?.inicio ?? 0) + (last?.duracion ?? 7),
        duracion: 7,
      })
    }

    // 4. Generate audio with ElevenLabs
    const audioBuffer = await generateAudio(script.narracion)

    // 5. Upload audio to Supabase Storage
    const audioPath = `${propiedadId}/${Date.now()}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('tours-propiedades')
      .upload(audioPath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) throw new Error(`Storage upload: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('tours-propiedades')
      .getPublicUrl(audioPath)

    // 6. Save to property
    const { error: updateError } = await supabase
      .from('propiedades')
      .update({
        audio_tour_url: publicUrl,
        audio_tour_script: script,
        audio_tour_estado: 'done',
      })
      .eq('id', propiedadId)

    if (updateError) throw new Error(`DB update: ${updateError.message}`)

    return NextResponse.json({ audio_tour_url: publicUrl, script })
  } catch (error) {
    console.error('generar-tour error:', error)

    // Mark as error in DB
    try {
      const supabase = createServiceRoleClient()
      await supabase
        .from('propiedades')
        .update({ audio_tour_estado: 'error' })
        .eq('id', params.id)
    } catch { /* ignore */ }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el tour' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient()

    await supabase
      .from('propiedades')
      .update({ audio_tour_url: null, audio_tour_script: null, audio_tour_estado: 'none' })
      .eq('id', params.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el tour' }, { status: 500 })
  }
}
