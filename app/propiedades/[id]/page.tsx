import { createServiceRoleClient } from '@/lib/supabase-server'
import type { Inmobiliaria, Propiedad } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GaleriaFotos from './GaleriaFotos'

export const dynamic = 'force-dynamic'

const operacionLabels: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  temporada: 'Temporada',
}

const tipoLabels: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  lote: 'Lote',
  local: 'Local',
  campo: 'Campo',
  ph: 'PH',
}

const operacionBadge: Record<string, string> = {
  venta: 'bg-dorado text-oscuro',
  alquiler: 'bg-oscuro text-crema',
  temporada: 'bg-oscuro/80 text-crema',
}

async function getData(id: string) {
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID
  if (!inmobiliariaId) return null

  const supabase = createServiceRoleClient()

  const [{ data: inmo }, { data: prop }] = await Promise.all([
    supabase.from('inmobiliaria').select('*').eq('id', inmobiliariaId).single(),
    supabase
      .from('propiedades')
      .select('id, inmobiliaria_id, titulo, tipo, operacion, precio, moneda, precio_periodo, direccion, zona, metros_cuadrados, ambientes, dormitorios, banos, cochera, apto_credito, descripcion, caracteristicas, estado, destacada, audio_tour_url, audio_tour_script, audio_tour_estado, created_at, fotos_propiedad(url, es_principal, orden)')
      .eq('id', id)
      .eq('inmobiliaria_id', inmobiliariaId)
      .single(),
  ])

  if (!prop) return null

  return {
    inmo: inmo as Inmobiliaria | null,
    prop: prop as unknown as Propiedad,
  }
}

export default async function PropiedadPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id)
  if (!data) notFound()

  const { inmo, prop } = data
  const whatsapp = inmo?.whatsapp ?? inmo?.telefono ?? ''
  const waNumber = whatsapp.replace(/\D/g, '')
  const nombre = inmo?.nombre ?? 'InmoBot'
  const ciudad = inmo?.ciudad ?? ''

  const fotos = [...(prop.fotos_propiedad ?? [])].sort((a, b) => {
    if (a.es_principal && !b.es_principal) return -1
    if (!a.es_principal && b.es_principal) return 1
    return a.orden - b.orden
  })

  const formatPrice = () => {
    if (!prop.precio) return 'Consultar'
    const n = prop.precio.toLocaleString('es-AR')
    const symbol = prop.moneda === 'USD' ? 'USD' : '$'
    const period =
      prop.precio_periodo === 'mensual' ? '/mes' :
      prop.precio_periodo === 'semanal' ? '/sem' : ''
    return `${symbol} ${n}${period}`
  }

  const stats = [
    prop.metros_cuadrados ? { label: 'm²', value: prop.metros_cuadrados } : null,
    prop.ambientes ? { label: 'ambientes', value: prop.ambientes } : null,
    prop.dormitorios ? { label: 'dormitorios', value: prop.dormitorios } : null,
    prop.banos ? { label: prop.banos === 1 ? 'baño' : 'baños', value: prop.banos } : null,
  ].filter(Boolean) as { label: string; value: number }[]

  return (
    <div className="min-h-screen bg-crema font-outfit">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-oscuro/95 backdrop-blur-sm border-b border-crema/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {inmo?.logo_url ? (
              <img src={inmo.logo_url} alt={nombre} className="h-9 w-auto" />
            ) : (
              <div className="w-9 h-9 bg-dorado rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
            <span className="font-playfair text-xl font-bold text-crema">{nombre}</span>
          </Link>

          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-dorado text-oscuro px-4 py-2 rounded-full text-sm font-semibold hover:bg-dorado-light transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Breadcrumb / Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <Link
          href="/#propiedades"
          className="inline-flex items-center gap-1.5 text-oscuro/50 hover:text-dorado text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al catálogo
        </Link>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* Galería */}
          <GaleriaFotos fotos={fotos} titulo={prop.titulo} />

          {/* Sidebar */}
          <div className="flex flex-col gap-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${operacionBadge[prop.operacion] ?? 'bg-dorado text-oscuro'}`}>
                {operacionLabels[prop.operacion] ?? prop.operacion}
              </span>
              <span className="bg-crema-dark text-oscuro/70 text-sm font-medium px-3 py-1 rounded-full">
                {tipoLabels[prop.tipo] ?? prop.tipo}
              </span>
              {prop.destacada && (
                <span className="bg-dorado/15 text-dorado text-sm font-semibold px-3 py-1 rounded-full">
                  ★ Destacada
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-oscuro leading-tight">
              {prop.titulo}
            </h1>

            {/* Precio */}
            <div className="bg-oscuro rounded-2xl px-6 py-5">
              <p className="text-crema/40 text-xs uppercase tracking-widest mb-1">Precio</p>
              <p className="font-playfair text-3xl font-bold text-dorado">{formatPrice()}</p>
            </div>

            {/* Ubicación */}
            {(prop.zona || prop.direccion) && (
              <div className="flex items-start gap-2 text-oscuro/60 text-sm">
                <svg className="w-4 h-4 text-dorado shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433c.118.062.227.116.28.14l.019.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                </svg>
                <span>{[prop.zona, prop.direccion].filter(Boolean).join(' — ')}</span>
              </div>
            )}

            {/* Stats grid */}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white border border-crema-dark rounded-2xl p-4 text-center">
                    <p className="font-playfair text-2xl font-bold text-oscuro">{s.value}</p>
                    <p className="text-oscuro/45 text-xs mt-0.5 capitalize">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Extras */}
            {(prop.cochera || prop.apto_credito) && (
              <div className="flex flex-wrap gap-2">
                {prop.cochera && (
                  <span className="inline-flex items-center gap-1.5 bg-dorado/10 text-dorado text-sm font-semibold px-4 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Cochera
                  </span>
                )}
                {prop.apto_credito && (
                  <span className="inline-flex items-center gap-1.5 bg-dorado/10 text-dorado text-sm font-semibold px-4 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Apto crédito
                  </span>
                )}
              </div>
            )}

            {/* Tour Virtual */}
            {prop.audio_tour_estado === 'done' && (
              <a
                href={`/tour/${prop.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-dorado/30 bg-oscuro/5 hover:bg-oscuro hover:text-crema text-oscuro px-6 py-3 rounded-full font-semibold text-sm transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ver Tour Virtual IA
              </a>
            )}

            {/* CTA WhatsApp */}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=Hola%2C%20me%20interesa%20la%20propiedad%3A%20${encodeURIComponent(prop.titulo)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-dorado text-oscuro px-6 py-4 rounded-full font-bold text-base hover:bg-dorado-light transition-colors shadow-lg shadow-dorado/20"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Consultar por WhatsApp
              </a>
            )}

            {/* Contacto alternativo */}
            {inmo?.email && (
              <a
                href={`mailto:${inmo.email}?subject=Consulta sobre ${prop.titulo}`}
                className="text-center text-oscuro/50 hover:text-dorado text-sm transition-colors"
              >
                O escribinos a {inmo.email}
              </a>
            )}
          </div>
        </div>

        {/* Descripción y características — full width */}
        {(prop.descripcion || (prop.caracteristicas && prop.caracteristicas.length > 0)) && (
          <div className="mt-14 pt-10 border-t border-crema-dark grid md:grid-cols-2 gap-10">
            {prop.descripcion && (
              <div>
                <h2 className="font-playfair text-2xl font-bold text-oscuro mb-5">Descripción</h2>
                <p className="text-oscuro/65 leading-relaxed whitespace-pre-line">{prop.descripcion}</p>
              </div>
            )}
            {prop.caracteristicas && prop.caracteristicas.length > 0 && (
              <div>
                <h2 className="font-playfair text-2xl font-bold text-oscuro mb-5">Características</h2>
                <ul className="flex flex-wrap gap-2">
                  {prop.caracteristicas.map((c, i) => (
                    <li
                      key={i}
                      className="inline-flex items-center gap-2 bg-white border border-crema-dark text-oscuro/70 text-sm px-4 py-2 rounded-full"
                    >
                      <span className="text-dorado text-xs">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-14 bg-oscuro rounded-3xl px-8 py-10 text-center">
          <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-3">¿Te interesa esta propiedad?</p>
          <h3 className="font-playfair text-3xl font-bold text-crema mb-4">
            Hablá con un asesor{ciudad ? ` en ${ciudad}` : ''}
          </h3>
          <p className="text-crema/50 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Nuestro equipo te acompaña en cada paso: visita, oferta, escrituración y entrega de llaves.
          </p>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=Hola%2C%20me%20interesa%20la%20propiedad%3A%20${encodeURIComponent(prop.titulo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-dorado text-oscuro px-8 py-4 rounded-full font-bold text-base hover:bg-dorado-light transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Quiero esta propiedad
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
