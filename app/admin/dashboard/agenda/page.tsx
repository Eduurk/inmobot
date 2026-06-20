'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type EstadoVisita = 'pendiente' | 'realizada' | 'cancelada'

interface Visita {
  id: string
  lead_id: string | null
  propiedad_id: string | null
  fecha_hora: string
  estado: EstadoVisita
  notas: string | null
  created_at: string
  leads?: { nombre: string | null; telefono: string | null } | null
  propiedades?: { titulo: string } | null
}

interface Lead {
  id: string
  nombre: string | null
  telefono: string | null
}

interface Propiedad {
  id: string
  titulo: string
}

const ESTADO_VISITA: Record<EstadoVisita, { label: string; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  realizada:  { label: 'Realizada',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  cancelada:  { label: 'Cancelada',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
}

function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function isHoy(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  return d.toDateString() === hoy.toDateString()
}

function isProximas(iso: string) {
  return new Date(iso) >= new Date()
}

export default function AgendaPage() {
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtro, setFiltro] = useState<'proximas' | 'todas'>('proximas')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    lead_id: '',
    propiedad_id: '',
    fecha: '',
    hora: '',
    notas: '',
  })

  const supabase = createClient()
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  useEffect(() => {
    if (!inmobiliariaId) { setLoading(false); return }
    Promise.all([
      supabase.from('visitas').select('*, leads(nombre, telefono), propiedades(titulo)')
        .eq('inmobiliaria_id', inmobiliariaId)
        .order('fecha_hora', { ascending: true }),
      supabase.from('leads').select('id, nombre, telefono')
        .eq('inmobiliaria_id', inmobiliariaId)
        .not('nombre', 'is', null),
      supabase.from('propiedades').select('id, titulo')
        .eq('inmobiliaria_id', inmobiliariaId)
        .eq('estado', 'disponible'),
    ]).then(([v, l, p]) => {
      setVisitas((v.data ?? []) as Visita[])
      setLeads((l.data ?? []) as Lead[])
      setPropiedades((p.data ?? []) as Propiedad[])
      setLoading(false)
    })
  }, [inmobiliariaId])

  const updateEstadoVisita = async (id: string, estado: EstadoVisita) => {
    await supabase.from('visitas').update({ estado }).eq('id', id)
    setVisitas(prev => prev.map(v => v.id === id ? { ...v, estado } : v))
  }

  const crearVisita = async () => {
    if (!form.fecha || !form.hora) return
    setSaving(true)
    const fecha_hora = `${form.fecha}T${form.hora}:00`
    const { data } = await supabase.from('visitas').insert({
      inmobiliaria_id: inmobiliariaId,
      lead_id: form.lead_id || null,
      propiedad_id: form.propiedad_id || null,
      fecha_hora,
      notas: form.notas || null,
      estado: 'pendiente',
    }).select('*, leads(nombre, telefono), propiedades(titulo)').single()

    if (data) {
      setVisitas(prev => [...prev, data as Visita].sort((a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      ))
    }
    setForm({ lead_id: '', propiedad_id: '', fecha: '', hora: '', notas: '' })
    setShowForm(false)
    setSaving(false)
  }

  const filtered = visitas.filter(v =>
    filtro === 'proximas' ? isProximas(v.fecha_hora) : true
  )

  const proximas = visitas.filter(v => isProximas(v.fecha_hora) && v.estado === 'pendiente')
  const hoy = visitas.filter(v => isHoy(v.fecha_hora) && v.estado === 'pendiente')

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Agenda de visitas</h1>
          <p className="text-oscuro/50 text-sm mt-1">Coordiná y gestioná las visitas a propiedades</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-dorado text-oscuro px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-dorado-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva visita
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-crema-dark rounded-2xl p-4 text-center">
          <p className="font-playfair text-3xl font-bold text-dorado">{hoy.length}</p>
          <p className="text-xs text-oscuro/50 mt-0.5">Visitas hoy</p>
        </div>
        <div className="bg-white border border-crema-dark rounded-2xl p-4 text-center">
          <p className="font-playfair text-3xl font-bold text-oscuro">{proximas.length}</p>
          <p className="text-xs text-oscuro/50 mt-0.5">Próximas pendientes</p>
        </div>
      </div>

      {/* Formulario nueva visita */}
      {showForm && (
        <div className="bg-white border border-dorado/40 rounded-2xl p-5 mb-6 shadow-sm">
          <p className="font-semibold text-oscuro mb-4">Agendar nueva visita</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-oscuro/50 block mb-1">Lead / Comprador</label>
              <select
                value={form.lead_id}
                onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
                className="w-full border border-crema-dark rounded-xl px-3 py-2.5 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              >
                <option value="">Sin lead asociado</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre} {l.telefono ? `— ${l.telefono}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-oscuro/50 block mb-1">Propiedad</label>
              <select
                value={form.propiedad_id}
                onChange={e => setForm(f => ({ ...f, propiedad_id: e.target.value }))}
                className="w-full border border-crema-dark rounded-xl px-3 py-2.5 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              >
                <option value="">Sin propiedad específica</option>
                {propiedades.map(p => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-oscuro/50 block mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full border border-crema-dark rounded-xl px-3 py-2.5 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-oscuro/50 block mb-1">Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full border border-crema-dark rounded-xl px-3 py-2.5 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-oscuro/50 block mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Ej: Llevar llaves, cliente viene con familiar..."
                className="w-full border border-crema-dark rounded-xl px-3 py-2.5 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={crearVisita}
              disabled={saving || !form.fecha || !form.hora}
              className="bg-oscuro text-crema px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-oscuro/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Confirmar visita'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-oscuro/50 hover:text-oscuro text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['proximas', 'todas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === f ? 'bg-oscuro text-crema' : 'bg-white border border-crema-dark text-oscuro/70 hover:border-oscuro/40'
            }`}
          >
            {f === 'proximas' ? 'Próximas' : 'Todas'}
          </button>
        ))}
      </div>

      {/* Lista de visitas */}
      {loading ? (
        <div className="text-center py-16 text-oscuro/40 text-sm">Cargando agenda…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-crema-dark rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-oscuro/40 text-sm">No hay visitas agendadas.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-dorado text-sm font-semibold hover:underline">
            + Agendar primera visita
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(visita => {
            const est = ESTADO_VISITA[visita.estado]
            const hoyVisita = isHoy(visita.fecha_hora)

            return (
              <div key={visita.id} className={`bg-white border rounded-2xl p-4 ${hoyVisita && visita.estado === 'pendiente' ? 'border-dorado shadow-sm' : 'border-crema-dark'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {hoyVisita && visita.estado === 'pendiente' && (
                        <span className="text-xs bg-dorado/20 text-dorado font-bold px-2 py-0.5 rounded-full">HOY</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${est.bg} ${est.color}`}>
                        {est.label}
                      </span>
                    </div>
                    <p className="font-semibold text-oscuro">{formatFechaHora(visita.fecha_hora)}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-oscuro/60">
                      {visita.leads?.nombre && <span>👤 {visita.leads.nombre}</span>}
                      {visita.propiedades?.titulo && <span className="truncate">🏠 {visita.propiedades.titulo}</span>}
                    </div>
                    {visita.notas && <p className="text-xs text-oscuro/40 mt-1.5">{visita.notas}</p>}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {visita.leads?.telefono && (
                      <a
                        href={`https://wa.me/${visita.leads.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${visita.leads.nombre ?? ''}, te recuerdo que tenemos una visita agendada para hoy.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        title="Recordatorio WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                    {visita.estado === 'pendiente' && (
                      <button
                        onClick={() => updateEstadoVisita(visita.id, 'realizada')}
                        className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors text-xs font-bold"
                        title="Marcar como realizada"
                      >
                        ✓
                      </button>
                    )}
                    {visita.estado === 'pendiente' && (
                      <button
                        onClick={() => updateEstadoVisita(visita.id, 'cancelada')}
                        className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors text-xs font-bold"
                        title="Cancelar visita"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
