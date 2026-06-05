import { createServiceRoleClient } from '@/lib/supabase-server'
import type { ChatMessage } from '@/lib/types'

interface ConvRow {
  messages: ChatMessage[]
  created_at: string
}

function buildDailyChart(convs: ConvRow[]) {
  const days: Record<string, number> = {}
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days[d.toISOString().slice(0, 10)] = 0
  }
  for (const c of convs) {
    const key = c.created_at.slice(0, 10)
    if (key in days) days[key]++
  }
  return Object.entries(days).map(([date, count]) => ({
    label: new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    count,
  }))
}

function buildHourChart(convs: ConvRow[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, count: 0 }))
  for (const c of convs) {
    const h = new Date(c.created_at).getHours()
    hours[h].count++
  }
  return hours
}

function buildTopQuestions(convs: ConvRow[]) {
  const msgMap = new Map<string, number>()
  for (const c of convs) {
    for (const msg of c.messages.filter(m => m.role === 'user')) {
      const key = msg.content.trim().toLowerCase().slice(0, 120)
      if (key.length < 5) continue
      msgMap.set(key, (msgMap.get(key) ?? 0) + 1)
    }
  }
  return Array.from(msgMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count]) => ({ text, count }))
}

function buildZoneChart(convs: ConvRow[], zones: string[]) {
  const zoneMap = new Map<string, number>()
  for (const z of zones) zoneMap.set(z.toLowerCase(), 0)

  for (const c of convs) {
    const userText = c.messages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase())
      .join(' ')
    for (const z of zones) {
      if (userText.includes(z.toLowerCase())) {
        zoneMap.set(z.toLowerCase(), (zoneMap.get(z.toLowerCase()) ?? 0) + 1)
      }
    }
  }
  return Array.from(zoneMap.entries())
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([zone, count]) => ({ zone, count }))
}

function BarChart({ data, max, labelKey, valueKey }: {
  data: Record<string, string | number>[]
  max: number
  labelKey: string
  valueKey: string
}) {
  if (max === 0) return <p className="text-oscuro/40 text-sm py-4 text-center">Sin datos todavía</p>
  return (
    <div className="space-y-1.5">
      {data.map((item, i) => {
        const val = item[valueKey] as number
        const pct = max > 0 ? Math.round((val / max) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-oscuro/60 w-12 text-right shrink-0">{item[labelKey]}</span>
            <div className="flex-1 bg-crema rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-dorado rounded-full transition-all"
                style={{ width: `${pct}%`, minWidth: val > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-xs font-semibold text-oscuro w-5 shrink-0">{val}</span>
          </div>
        )
      })}
    </div>
  )
}

async function getInsights(inmobiliariaId: string) {
  const supabase = createServiceRoleClient()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: convs30 }, { data: convs7 }, { data: props }] = await Promise.all([
    supabase
      .from('conversaciones')
      .select('messages, created_at')
      .eq('inmobiliaria_id', inmobiliariaId)
      .gte('created_at', since30),
    supabase
      .from('conversaciones')
      .select('messages, created_at')
      .eq('inmobiliaria_id', inmobiliariaId)
      .gte('created_at', since7),
    supabase
      .from('propiedades')
      .select('zona')
      .eq('inmobiliaria_id', inmobiliariaId)
      .not('zona', 'is', null),
  ])

  const allConvs30 = (convs30 ?? []) as ConvRow[]
  const allConvs7 = (convs7 ?? []) as ConvRow[]
  const zonesRaw = (props ?? []).map(p => p.zona).filter(Boolean) as string[]
  const zones = zonesRaw.filter((z, i, arr) => arr.indexOf(z) === i)

  return {
    daily: buildDailyChart(allConvs30),
    hourly: buildHourChart(allConvs30),
    topQuestions: buildTopQuestions(allConvs7),
    zones: buildZoneChart(allConvs30, zones),
    totalConvs: allConvs30.length,
    totalWeek: allConvs7.length,
  }
}

export default async function InteligenciaPage() {
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  if (!inmobiliariaId) {
    return (
      <div className="p-8">
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
          Configurá <code>NEXT_PUBLIC_INMOBILIARIA_ID</code> para ver los insights.
        </p>
      </div>
    )
  }

  const insights = await getInsights(inmobiliariaId)

  const maxDaily = Math.max(...insights.daily.map(d => d.count), 1)
  const maxHourly = Math.max(...insights.hourly.map(h => h.count), 1)
  const maxZone = Math.max(...insights.zones.map(z => z.count), 1)
  const maxQ = Math.max(...insights.topQuestions.map(q => q.count), 1)

  // Compact hourly: group into 2h slots for readability
  const hourlyCompact = Array.from({ length: 12 }, (_, i) => ({
    label: `${i * 2}-${i * 2 + 2}h`,
    count: insights.hourly[i * 2].count + insights.hourly[i * 2 + 1].count,
  }))
  const maxHourlyCompact = Math.max(...hourlyCompact.map(h => h.count), 1)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Inteligencia</h1>
        <p className="text-oscuro/50 text-sm mt-1">Análisis de comportamiento de visitantes</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-crema-dark rounded-2xl p-5">
          <p className="font-playfair text-3xl font-bold text-dorado">{insights.totalConvs}</p>
          <p className="text-sm font-semibold text-oscuro mt-1">Conversaciones (30 días)</p>
        </div>
        <div className="bg-white border border-crema-dark rounded-2xl p-5">
          <p className="font-playfair text-3xl font-bold text-dorado">{insights.totalWeek}</p>
          <p className="text-sm font-semibold text-oscuro mt-1">Esta semana</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Conversaciones por día */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6">
          <h2 className="font-semibold text-oscuro mb-4 text-sm">Conversaciones por día (14 días)</h2>
          <BarChart
            data={insights.daily as Record<string, string | number>[]}
            max={maxDaily}
            labelKey="label"
            valueKey="count"
          />
        </div>

        {/* Horarios pico */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6">
          <h2 className="font-semibold text-oscuro mb-4 text-sm">Horarios pico (30 días)</h2>
          <BarChart
            data={hourlyCompact as Record<string, string | number>[]}
            max={maxHourlyCompact}
            labelKey="label"
            valueKey="count"
          />
        </div>

        {/* Zonas más buscadas */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6">
          <h2 className="font-semibold text-oscuro mb-4 text-sm">Zonas más mencionadas (30 días)</h2>
          {insights.zones.length === 0 ? (
            <p className="text-oscuro/40 text-sm py-4 text-center">Sin datos todavía</p>
          ) : (
            <div className="space-y-1.5">
              {insights.zones.map((z, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-oscuro/60 w-24 truncate shrink-0 capitalize">{z.zone}</span>
                  <div className="flex-1 bg-crema rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-dorado/70 rounded-full"
                      style={{ width: `${Math.round((z.count / maxZone) * 100)}%`, minWidth: '4px' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-oscuro w-5 shrink-0">{z.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top preguntas */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6">
          <h2 className="font-semibold text-oscuro mb-4 text-sm">Top consultas de la semana</h2>
          {insights.topQuestions.length === 0 ? (
            <p className="text-oscuro/40 text-sm py-4 text-center">Sin datos todavía</p>
          ) : (
            <div className="space-y-2">
              {insights.topQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex-1 bg-crema rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-dorado rounded-full"
                        style={{ width: `${Math.round((q.count / maxQ) * 100)}%`, minWidth: '4px' }}
                      />
                    </div>
                    <p className="text-xs text-oscuro/70 mt-1 leading-snug capitalize">{q.text}</p>
                  </div>
                  <span className="text-xs font-bold text-dorado shrink-0 mt-1">{q.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
