import { createServerSupabaseClient } from '@/lib/supabase-server'

async function getStats(inmobiliariaId: string | undefined) {
  if (!inmobiliariaId) return null
  const supabase = createServerSupabaseClient()

  const [
    { count: total },
    { count: venta },
    { count: alquiler },
    { count: temporada },
    { count: leadsWeek },
    { data: ultima },
  ] = await Promise.all([
    supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('inmobiliaria_id', inmobiliariaId).eq('estado', 'disponible'),
    supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('inmobiliaria_id', inmobiliariaId).eq('operacion', 'venta').eq('estado', 'disponible'),
    supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('inmobiliaria_id', inmobiliariaId).eq('operacion', 'alquiler').eq('estado', 'disponible'),
    supabase.from('propiedades').select('*', { count: 'exact', head: true }).eq('inmobiliaria_id', inmobiliariaId).eq('operacion', 'temporada').eq('estado', 'disponible'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('inmobiliaria_id', inmobiliariaId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('propiedades').select('titulo, created_at').eq('inmobiliaria_id', inmobiliariaId).order('created_at', { ascending: false }).limit(1),
  ])

  return { total, venta, alquiler, temporada, leadsWeek, ultima: ultima?.[0] ?? null }
}

export default async function DashboardPage() {
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID
  const stats = await getStats(inmobiliariaId)

  const cards = [
    {
      label: 'Propiedades activas',
      value: stats?.total ?? 0,
      sub: 'Estado: disponible',
      color: 'text-dorado',
      bg: 'bg-dorado/10',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'En venta',
      value: stats?.venta ?? 0,
      sub: 'Propiedades activas',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'En alquiler',
      value: (stats?.alquiler ?? 0) + (stats?.temporada ?? 0),
      sub: `${stats?.alquiler ?? 0} perm. + ${stats?.temporada ?? 0} temp.`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Leads esta semana',
      value: stats?.leadsWeek ?? 0,
      sub: 'Desde el chatbot',
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Dashboard</h1>
        <p className="text-oscuro/50 text-sm mt-1">Resumen de tu inmobiliaria</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-crema-dark rounded-2xl p-5">
            <div className={`w-11 h-11 ${card.bg} rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <p className={`font-playfair text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-oscuro text-sm font-semibold mt-1">{card.label}</p>
            <p className="text-oscuro/45 text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Last property */}
      {stats?.ultima && (
        <div className="bg-white border border-crema-dark rounded-2xl p-5">
          <h2 className="font-semibold text-oscuro mb-3 text-sm">Última propiedad cargada</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dorado/10 rounded-xl flex items-center justify-center text-dorado">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-oscuro">{stats.ultima.titulo}</p>
              <p className="text-oscuro/50 text-xs">
                {new Date(stats.ultima.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {!inmobiliariaId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
          <p className="text-amber-800 font-semibold text-sm">Configuración pendiente</p>
          <p className="text-amber-700 text-xs mt-1">
            Agregá <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_INMOBILIARIA_ID</code> en tu <code className="bg-amber-100 px-1 rounded">.env.local</code> para ver las estadísticas.
          </p>
        </div>
      )}
    </div>
  )
}
