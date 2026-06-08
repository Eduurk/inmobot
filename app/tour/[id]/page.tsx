import { createServiceRoleClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Propiedad } from '@/lib/types'
import TourPlayer from './TourPlayer'

interface PageProps {
  params: { id: string }
}

export default async function TourPage({ params }: PageProps) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('propiedades')
    .select('*, fotos_propiedad(url, orden, es_principal)')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const propiedad = data as Propiedad

  if (propiedad.audio_tour_estado !== 'done' || !propiedad.audio_tour_url || !propiedad.audio_tour_script) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-center px-6">
        <div>
          <p className="text-white/50 text-sm mb-2">Tour no disponible</p>
          <p className="text-white text-lg font-semibold">{propiedad.titulo}</p>
          <p className="text-white/40 text-sm mt-1">El tour de esta propiedad aún no fue generado.</p>
        </div>
      </div>
    )
  }

  const fotos = (propiedad.fotos_propiedad ?? [])
    .sort((a, b) => a.orden - b.orden)
    .map((f) => f.url)

  if (fotos.length === 0) notFound()

  const precio = propiedad.precio
    ? `${propiedad.moneda} ${propiedad.precio.toLocaleString('es-AR')}${propiedad.precio_periodo ? '/' + propiedad.precio_periodo : ''}`
    : 'Consultar precio'

  return (
    <TourPlayer
      fotos={fotos}
      script={propiedad.audio_tour_script}
      audioUrl={propiedad.audio_tour_url}
      titulo={propiedad.titulo}
      precio={precio}
      zona={propiedad.zona}
    />
  )
}
