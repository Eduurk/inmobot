import Image from 'next/image'
import type { Propiedad } from '@/lib/types'

interface PropCardProps {
  propiedad: Propiedad
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
    const period = propiedad.precio_periodo ? `/${propiedad.precio_periodo}` : ''
    return `${symbol} ${n}${period}`
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-52 bg-crema-dark overflow-hidden">
        {mainPhoto ? (
          <Image
            src={mainPhoto.url}
            alt={propiedad.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-oscuro/30">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            <span className="text-sm">Sin foto</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-dorado text-oscuro text-xs font-semibold px-2.5 py-1 rounded-full">
            {operacionLabels[propiedad.operacion] ?? propiedad.operacion}
          </span>
          {propiedad.destacada && (
            <span className="bg-oscuro text-crema text-xs font-semibold px-2.5 py-1 rounded-full">
              Destacada
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 text-oscuro text-xs font-medium px-2.5 py-1 rounded-full">
            {tipoLabels[propiedad.tipo] ?? propiedad.tipo}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-playfair text-lg font-semibold text-oscuro leading-tight mb-1">
          {propiedad.titulo}
        </h3>
        {(propiedad.zona || propiedad.direccion) && (
          <p className="text-oscuro/55 text-sm flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433c.118.062.227.116.28.14l.019.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            {propiedad.zona ?? propiedad.direccion}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-oscuro/60">
          {propiedad.metros_cuadrados && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {propiedad.metros_cuadrados} m²
            </span>
          )}
          {propiedad.ambientes && (
            <span>{propiedad.ambientes} amb.</span>
          )}
          {propiedad.dormitorios && (
            <span>{propiedad.dormitorios} dorm.</span>
          )}
          {propiedad.banos && (
            <span>{propiedad.banos} {propiedad.banos === 1 ? 'baño' : 'baños'}</span>
          )}
          {propiedad.cochera && <span className="text-dorado font-medium">✓ Cochera</span>}
          {propiedad.apto_credito && <span className="text-dorado font-medium">✓ Crédito</span>}
        </div>

        <div className="border-t border-crema-dark pt-3 flex items-center justify-between">
          <span className="font-playfair text-xl font-bold text-dorado">
            {formatPrice()}
          </span>
          <button className="text-xs text-oscuro/50 hover:text-dorado transition-colors font-medium">
            Ver detalles →
          </button>
        </div>
      </div>
    </div>
  )
}
