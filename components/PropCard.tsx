import Image from 'next/image'
import type { Propiedad } from '@/lib/types'

interface PropCardProps {
  propiedad: Propiedad
}

const operacionColors: Record<string, string> = {
  venta: 'bg-dorado text-oscuro',
  alquiler: 'bg-oscuro text-crema',
  temporada: 'bg-oscuro/80 text-crema',
}

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

export default function PropCard({ propiedad }: PropCardProps) {
  const mainPhoto =
    propiedad.fotos_propiedad?.find((f) => f.es_principal) ??
    propiedad.fotos_propiedad?.[0]

  const formatPrice = () => {
    if (!propiedad.precio) return 'Consultar'
    const n = propiedad.precio.toLocaleString('es-AR')
    const symbol = propiedad.moneda === 'USD' ? 'USD' : '$'
    const period = propiedad.precio_periodo === 'mensual'
      ? '/mes'
      : propiedad.precio_periodo === 'semanal'
      ? '/sem'
      : ''
    return `${symbol} ${n}${period}`
  }

  const features = [
    propiedad.metros_cuadrados && `${propiedad.metros_cuadrados} m²`,
    propiedad.ambientes && `${propiedad.ambientes} amb.`,
    propiedad.dormitorios && `${propiedad.dormitorios} dorm.`,
    propiedad.banos && `${propiedad.banos} ${propiedad.banos === 1 ? 'baño' : 'baños'}`,
  ].filter(Boolean) as string[]

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-crema-dark hover:border-dorado/30 flex flex-col">

      {/* Imagen */}
      <div className="relative h-56 bg-oscuro/5 overflow-hidden shrink-0">
        {mainPhoto ? (
          <>
            <Image
              src={mainPhoto.url}
              alt={propiedad.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradiente inferior sobre la foto */}
            <div className="absolute inset-0 bg-gradient-to-t from-oscuro/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-crema to-crema-dark">
            <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center">
              <svg className="w-8 h-8 text-dorado/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <span className="text-xs text-oscuro/40 font-medium">Sin fotografía</span>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${operacionColors[propiedad.operacion] ?? 'bg-dorado text-oscuro'}`}>
            {operacionLabels[propiedad.operacion] ?? propiedad.operacion}
          </span>
          {propiedad.destacada && (
            <span className="bg-white/95 text-oscuro text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              ★ Dest.
            </span>
          )}
        </div>

        {/* Tipo en badge derecho */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-oscuro/80 text-xs font-medium px-2.5 py-1 rounded-full">
            {tipoLabels[propiedad.tipo] ?? propiedad.tipo}
          </span>
        </div>

        {/* Precio sobre foto (si tiene foto) */}
        {mainPhoto && (
          <div className="absolute bottom-3 left-3">
            <span className="font-playfair text-lg font-bold text-white drop-shadow-lg">
              {formatPrice()}
            </span>
          </div>
        )}

        {/* Tour Virtual badge */}
        {propiedad.audio_tour_estado === 'done' && (
          <a
            href={`/tour/${propiedad.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-full hover:bg-dorado hover:text-oscuro transition-colors"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Tour Virtual
          </a>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-playfair text-lg font-bold text-oscuro leading-tight mb-1.5 line-clamp-2">
          {propiedad.titulo}
        </h3>

        {(propiedad.zona || propiedad.direccion) && (
          <p className="text-oscuro/50 text-xs flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5 shrink-0 text-dorado" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433c.118.062.227.116.28.14l.019.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{propiedad.zona ?? propiedad.direccion}</span>
          </p>
        )}

        {/* Features en chips */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {features.map((f) => (
              <span key={f} className="bg-crema text-oscuro/70 text-xs px-2.5 py-1 rounded-full font-medium">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Extras */}
        {(propiedad.cochera || propiedad.apto_credito) && (
          <div className="flex gap-2 mb-3">
            {propiedad.cochera && (
              <span className="text-xs text-dorado font-semibold flex items-center gap-1">
                <span className="text-dorado">✓</span> Cochera
              </span>
            )}
            {propiedad.apto_credito && (
              <span className="text-xs text-dorado font-semibold flex items-center gap-1">
                <span className="text-dorado">✓</span> Crédito
              </span>
            )}
          </div>
        )}

        {/* Precio (solo si no tiene foto, ya que en foto se muestra arriba) */}
        <div className="mt-auto pt-3 border-t border-crema-dark flex items-center justify-between">
          {!mainPhoto ? (
            <span className="font-playfair text-xl font-bold text-dorado">
              {formatPrice()}
            </span>
          ) : (
            <span className="text-xs text-oscuro/40 font-medium">
              {tipoLabels[propiedad.tipo] ?? propiedad.tipo} en {operacionLabels[propiedad.operacion]}
            </span>
          )}
          <span className="text-xs text-dorado font-semibold group-hover:underline cursor-pointer">
            Ver detalles →
          </span>
        </div>
      </div>
    </div>
  )
}
