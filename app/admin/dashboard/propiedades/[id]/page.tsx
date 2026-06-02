import { createServerSupabaseClient } from '@/lib/supabase-server'
import PropForm from '@/components/PropForm'
import { notFound } from 'next/navigation'
import type { Propiedad } from '@/lib/types'

interface PageProps {
  params: { id: string }
}

export default async function EditarPropiedadPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('propiedades')
    .select('*, fotos_propiedad(id, url, es_principal, orden)')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const propiedad = data as Propiedad

  const existingPhotos = (propiedad.fotos_propiedad ?? [])
    .sort((a, b) => a.orden - b.orden)
    .map((f) => ({
      url: f.url,
      esPrincipal: f.es_principal,
    }))

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Editar propiedad</h1>
        <p className="text-oscuro/50 text-sm mt-1 truncate">{propiedad.titulo}</p>
      </div>
      <PropForm
        mode="editar"
        initial={propiedad}
        existingPhotos={existingPhotos}
        propiedadId={propiedad.id}
      />
    </div>
  )
}
