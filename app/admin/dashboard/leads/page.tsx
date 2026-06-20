'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type EstadoLead = 'nuevo' | 'contactado' | 'visita_agendada' | 'oferta' | 'cerrado' | 'perdido'

interface Lead {
  id: string
  nombre: string | null
  telefono: string | null
  email: string | null
  consulta: string | null
  canal: string
  estado: EstadoLead
  notas: string | null
  proximo_contacto: string | null
  presupuesto: string | null
  plazo: string | null
  tipo_busqueda: string | null
  created_at: string
}

const ESTADOS: { value: EstadoLead; label: string; color: string; bg: string }[] = [
  { value: 'nuevo',           label: 'Nuevo',          color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { value: 'contactado',      label: 'Contactado',     color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'visita_agendada', label: 'Visita agendada',color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { value: 'oferta',          label: 'Oferta',         color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { value: 'cerrado',         label: 'Cerrado',        color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  { value: 'perdido',         label: 'Perdido',        color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
]

const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e => [e.value, e]))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<EstadoLead | 'todos'>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editNotas, setEditNotas] = useState<Record<string, string>>({})
  const [editFecha, setEditFecha] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const supabase = createClient()
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  useEffect(() => {
    if (!inmobiliariaId) { setLoading(false); return }
    supabase
      .from('leads')
      .select('*')
      .eq('inmobiliaria_id', inmobiliariaId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const l = (data ?? []) as Lead[]
        setLeads(l)
        const notas: Record<string, string> = {}
        const fechas: Record<string, string> = {}
        l.forEach(lead => {
          notas[lead.id] = lead.notas ?? ''
          fechas[lead.id] = lead.proximo_contacto ?? ''
        })
        setEditNotas(notas)
        setEditFecha(fechas)
        setLoading(false)
      })
  }, [inmobiliariaId])

  const updateEstado = async (id: string, estado: EstadoLead) => {
    setSaving(id)
    await supabase.from('leads').update({ estado }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, estado } : l))
    setSaving(null)
  }

  const saveNotas = async (id: string) => {
    setSaving(id)
    await supabase.from('leads').update({
      notas: editNotas[id] || null,
      proximo_contacto: editFecha[id] || null,
    }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id
      ? { ...l, notas: editNotas[id] || null, proximo_contacto: editFecha[id] || null }
      : l
    ))
    setSaving(null)
  }

  const filtered = leads.filter(l => filtroEstado === 'todos' || l.estado === filtroEstado)

  const conteo = Object.fromEntries(ESTADOS.map(e => [e.value, leads.filter(l => l.estado === e.value).length]))

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">CRM de Leads</h1>
        <p className="text-oscuro/50 text-sm mt-1">Gestioná el seguimiento de cada contacto</p>
      </div>

      {/* Embudo visual */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(filtroEstado === e.value ? 'todos' : e.value)}
            className={`rounded-2xl p-3 text-center border transition-all ${
              filtroEstado === e.value ? e.bg + ' ring-2 ring-offset-1 ring-dorado' : 'bg-white border-crema-dark hover:border-dorado/40'
            }`}
          >
            <p className={`font-playfair text-2xl font-bold ${filtroEstado === e.value ? e.color : 'text-oscuro'}`}>
              {conteo[e.value] ?? 0}
            </p>
            <p className="text-xs text-oscuro/50 leading-tight mt-0.5">{e.label}</p>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-oscuro/40 text-sm">Cargando leads…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-crema-dark rounded-2xl p-12 text-center">
          <p className="text-oscuro/40 text-sm">No hay leads en este estado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const estado = ESTADO_MAP[lead.estado] ?? ESTADO_MAP['nuevo']
            const isExpanded = expandedId === lead.id
            const isSaving = saving === lead.id

            return (
              <div key={lead.id} className="bg-white border border-crema-dark rounded-2xl overflow-hidden">
                {/* Fila principal */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-crema/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  {/* Estado badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${estado.bg} ${estado.color}`}>
                    {estado.label}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-oscuro text-sm">{lead.nombre ?? 'Sin nombre'}</p>
                    <p className="text-xs text-oscuro/50 truncate mt-0.5">{lead.consulta ?? '—'}</p>
                  </div>

                  {/* Contacto rápido */}
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.telefono && (
                      <a
                        href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.nombre ?? ''}, te contacto por tu consulta inmobiliaria.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                    <span className="text-xs text-oscuro/40">{formatDate(lead.created_at)}</span>
                    <svg className={`w-4 h-4 text-oscuro/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Panel expandido */}
                {isExpanded && (
                  <div className="border-t border-crema-dark bg-crema/20 px-5 py-5 space-y-5">

                    {/* Datos del lead */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Teléfono', value: lead.telefono },
                        { label: 'Email', value: lead.email },
                        { label: 'Presupuesto', value: lead.presupuesto },
                        { label: 'Plazo', value: lead.plazo },
                        { label: 'Busca', value: lead.tipo_busqueda },
                        { label: 'Canal', value: lead.canal },
                      ].filter(d => d.value).map(d => (
                        <div key={d.label} className="bg-white rounded-xl p-3 border border-crema-dark">
                          <p className="text-xs text-oscuro/40 mb-0.5">{d.label}</p>
                          <p className="text-sm font-medium text-oscuro">{d.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cambiar estado */}
                    <div>
                      <p className="text-xs font-semibold text-oscuro/50 uppercase tracking-wider mb-2">Estado del lead</p>
                      <div className="flex flex-wrap gap-2">
                        {ESTADOS.map(e => (
                          <button
                            key={e.value}
                            onClick={() => updateEstado(lead.id, e.value)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              lead.estado === e.value
                                ? `${e.bg} ${e.color} ring-2 ring-offset-1 ring-dorado`
                                : 'bg-white border-crema-dark text-oscuro/60 hover:border-dorado/40'
                            }`}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notas y próximo contacto */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-oscuro/50 uppercase tracking-wider block mb-1">Notas internas</label>
                        <textarea
                          value={editNotas[lead.id] ?? ''}
                          onChange={e => setEditNotas(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          placeholder="Agregá notas sobre este contacto..."
                          rows={3}
                          className="w-full border border-crema-dark rounded-xl px-3 py-2 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-oscuro/50 uppercase tracking-wider block mb-1">Próximo contacto</label>
                        <input
                          type="date"
                          value={editFecha[lead.id] ?? ''}
                          onChange={e => setEditFecha(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          className="w-full border border-crema-dark rounded-xl px-3 py-2 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                        />
                        <button
                          onClick={() => saveNotas(lead.id)}
                          disabled={isSaving}
                          className="mt-2 w-full bg-oscuro text-crema py-2 rounded-xl text-xs font-semibold hover:bg-oscuro/80 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? 'Guardando…' : 'Guardar notas'}
                        </button>
                      </div>
                    </div>

                    {/* Consulta original */}
                    {lead.consulta && (
                      <div className="bg-white rounded-xl p-3 border border-crema-dark">
                        <p className="text-xs text-oscuro/40 mb-1">Consulta original</p>
                        <p className="text-sm text-oscuro/70">{lead.consulta}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
