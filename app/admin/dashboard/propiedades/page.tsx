import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Propiedad } from '@/lib/types'

const estadoColors: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  reservada: 'bg-amber-100 text-amber-700',
  vendida: 'bg-gray-100 text-gray-600',
}

const operacionLabels: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  temporada: 'Temporada',
}

export default async function PropiedadesPage() {
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID
  const supabase = createServerSupabaseClient()

  const { data: propiedades } = inmobiliariaId
    ? await supabase
        .from('propiedades')
        .select('*, fotos_propiedad(url, es_principal)')
        .eq('inmobiliaria_id', inmobiliariaId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const props = (propiedades ?? []) as Propiedad[]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Propiedades</h1>
          <p className="text-oscuro/50 text-sm mt-1">{props.length} propiedad{props.length !== 1 ? 'es' : ''} en total</p>
        </div>
        <Link
          href="/admin/dashboard/propiedades/nueva"
          className="flex items-center gap-2 bg-oscuro text-crema px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-oscuro/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva propiedad
        </Link>
      </div>

      {props.length === 0 ? (
        <div className="bg-white border border-crema-dark rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-crema rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-oscuro/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="font-playfair text-xl font-semibold text-oscuro mb-2">Sin propiedades</p>
          <p className="text-oscuro/50 text-sm mb-6">Cargá tu primera propiedad para que el chatbot pueda ofrecerla.</p>
          <Link
            href="/admin/dashboard/propiedades/nueva"
            className="inline-flex items-center gap-2 bg-dorado text-oscuro px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-dorado-light transition-colors"
          >
            Cargar primera propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-crema-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-crema-dark">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider">Propiedad</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider hidden sm:table-cell">Operación</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider hidden md:table-cell">Precio</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider hidden lg:table-cell">Zona</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold text-oscuro/50 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crema-dark/60">
                {props.map((prop) => {
                  const mainPhoto = prop.fotos_propiedad?.find((f) => f.es_principal) ?? prop.fotos_propiedad?.[0]
                  return (
                    <tr key={prop.id} className="hover:bg-crema/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-crema-dark shrink-0">
                            {mainPhoto ? (
                              <img src={mainPhoto.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-oscuro/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-oscuro text-sm truncate max-w-[180px]">{prop.titulo}</p>
                            <p className="text-oscuro/45 text-xs capitalize">{prop.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-sm text-oscuro/70">{operacionLabels[prop.operacion] ?? prop.operacion}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm font-semibold text-oscuro">
                          {prop.precio
                            ? `${prop.moneda} ${prop.precio.toLocaleString('es-AR')}`
                            : 'Consultar'}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-oscuro/60">{prop.zona ?? prop.direccion ?? '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estadoColors[prop.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {prop.estado.charAt(0).toUpperCase() + prop.estado.slice(1)}
                        </span>
                        {prop.destacada && (
                          <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-dorado/15 text-dorado-dark font-medium">
                            Dest.
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/dashboard/propiedades/${prop.id}`}
                          className="text-sm text-dorado hover:text-dorado-dark font-medium transition-colors"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
