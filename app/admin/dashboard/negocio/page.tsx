'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface FormData {
  nombre: string
  descripcion: string
  ciudad: string
  whatsapp: string
  telefono: string
  email: string
  direccion: string
  logo_url: string
}

type DiaHorario = { activo: boolean; inicio: string; fin: string }
type Horarios = Record<string, DiaHorario>

const DIAS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
]

const DEFAULT_HORARIOS: Horarios = {
  lunes:     { activo: true,  inicio: '09:00', fin: '18:00' },
  martes:    { activo: true,  inicio: '09:00', fin: '18:00' },
  miercoles: { activo: true,  inicio: '09:00', fin: '18:00' },
  jueves:    { activo: true,  inicio: '09:00', fin: '18:00' },
  viernes:   { activo: true,  inicio: '09:00', fin: '18:00' },
  sabado:    { activo: false, inicio: '09:00', fin: '13:00' },
  domingo:   { activo: false, inicio: '09:00', fin: '13:00' },
}

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-oscuro mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-oscuro/40 text-xs mt-1">{hint}</p>}
    </div>
  )
}

export default function NegocioPage() {
  const supabase = createClient()
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  const [form, setForm] = useState<FormData>({
    nombre: '', descripcion: '', ciudad: '',
    whatsapp: '', telefono: '', email: '', direccion: '', logo_url: '',
  })
  const [horarios, setHorarios] = useState<Horarios>(DEFAULT_HORARIOS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inmobiliariaId) { setLoading(false); return }
    supabase
      .from('inmobiliaria')
      .select('*')
      .eq('id', inmobiliariaId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nombre: data.nombre ?? '',
            descripcion: data.descripcion ?? '',
            ciudad: data.ciudad ?? '',
            whatsapp: data.whatsapp ?? '',
            telefono: data.telefono ?? '',
            email: data.email ?? '',
            direccion: data.direccion ?? '',
            logo_url: data.logo_url ?? '',
          })
          if (data.horarios) {
            setHorarios({ ...DEFAULT_HORARIOS, ...data.horarios })
          }
        }
        setLoading(false)
      })
  }, [inmobiliariaId])

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setHorario = (dia: string, campo: keyof DiaHorario, valor: string | boolean) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }))
  }

  const handleSave = async () => {
    if (!inmobiliariaId) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('inmobiliaria')
      .update({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        ciudad: form.ciudad.trim(),
        whatsapp: form.whatsapp.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        logo_url: form.logo_url.trim() || null,
        horarios,
      })
      .eq('id', inmobiliariaId)
    setSaving(false)
    if (err) {
      setError('No se pudo guardar. Intentá de nuevo.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const inputClass =
    'w-full bg-crema border border-crema-dark rounded-xl px-4 py-2.5 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado transition-all'

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-oscuro/40 text-sm">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Mi negocio</h1>
        <p className="text-oscuro/50 text-sm mt-1">
          Esta información aparece en la página web y en el chatbot
        </p>
      </div>

      <div className="space-y-5">

        {/* Identidad */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-oscuro">Identidad</h2>

          <Field label="Nombre de la inmobiliaria" hint="Aparece en el encabezado de la web">
            <input
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej: Sur Propiedades"
              className={inputClass}
            />
          </Field>

          <Field label="Ciudad" hint="Usada en el título del hero: 'tu próximo hogar en…'">
            <input
              value={form.ciudad}
              onChange={set('ciudad')}
              placeholder="Ej: Necochea"
              className={inputClass}
            />
          </Field>

          <Field label="Descripción" hint="Subtítulo que aparece en el hero y en la sección Nosotros">
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              rows={3}
              placeholder="Ej: Inmobiliaria especializada en la costa atlántica de Necochea"
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Logo (URL)" hint="URL de imagen. Dejá vacío para usar el ícono por defecto">
            <input
              value={form.logo_url}
              onChange={set('logo_url')}
              placeholder="https://..."
              className={inputClass}
              type="url"
            />
          </Field>
        </div>

        {/* Contacto */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-oscuro">Contacto</h2>

          <Field
            label="WhatsApp"
            hint="Número con código de área, sin el 0 inicial. Ej: 2262123456"
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-oscuro/50 font-medium">+54</span>
              <input
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="2262123456"
                className={`${inputClass} pl-12`}
                type="tel"
              />
            </div>
          </Field>

          <Field label="Teléfono fijo (opcional)">
            <input
              value={form.telefono}
              onChange={set('telefono')}
              placeholder="Ej: 02262-123456"
              className={inputClass}
              type="tel"
            />
          </Field>

          <Field label="Email (opcional)">
            <input
              value={form.email}
              onChange={set('email')}
              placeholder="Ej: info@surpropiedades.com"
              className={inputClass}
              type="email"
            />
          </Field>

          <Field label="Dirección (opcional)" hint="Aparece en la sección de contacto">
            <input
              value={form.direccion}
              onChange={set('direccion')}
              placeholder="Ej: Calle 59 n° 1234, Necochea"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Horarios de atención */}
        <div className="bg-white border border-crema-dark rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-oscuro">Horarios de atención</h2>
            <p className="text-xs text-oscuro/40 mt-0.5">El chatbot solo agendará visitas dentro de estos horarios</p>
          </div>

          <div className="space-y-2">
            {DIAS.map(({ key, label }) => {
              const dia = horarios[key]
              return (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${dia.activo ? 'bg-crema/40' : 'bg-crema/10'}`}>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => setHorario(key, 'activo', !dia.activo)}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${dia.activo ? 'bg-dorado' : 'bg-crema-dark'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dia.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>

                  {/* Día */}
                  <span className={`w-24 text-sm font-medium shrink-0 ${dia.activo ? 'text-oscuro' : 'text-oscuro/40'}`}>
                    {label}
                  </span>

                  {/* Horario */}
                  {dia.activo ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={dia.inicio}
                        onChange={e => setHorario(key, 'inicio', e.target.value)}
                        className="border border-crema-dark rounded-lg px-2 py-1 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                      />
                      <span className="text-oscuro/40 text-sm">a</span>
                      <input
                        type="time"
                        value={dia.fin}
                        onChange={e => setHorario(key, 'fin', e.target.value)}
                        className="border border-crema-dark rounded-lg px-2 py-1 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-oscuro/30">Cerrado</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Preview rápida */}
        {(form.whatsapp || form.telefono) && (
          <div className="bg-crema border border-crema-dark rounded-2xl p-5">
            <p className="text-xs font-semibold text-oscuro/50 uppercase tracking-wider mb-3">Vista previa — botón WhatsApp</p>
            <a
              href={`https://wa.me/54${form.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-dorado text-oscuro px-4 py-2 rounded-full text-sm font-semibold hover:bg-dorado-light transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <p className="text-xs text-oscuro/40 mt-2">Así se ve el botón en la web. Hacé click para probar.</p>
          </div>
        )}

        {/* Guardar */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.nombre.trim()}
            className="bg-oscuro text-crema px-8 py-3 rounded-xl text-sm font-semibold hover:bg-oscuro/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Guardado — los cambios ya están en la web
            </span>
          )}

          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
        </div>

      </div>
    </div>
  )
}
