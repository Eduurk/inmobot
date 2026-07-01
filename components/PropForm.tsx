'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ImageUpload from './ImageUpload'
import type { Propiedad } from '@/lib/types'

const CARACTERISTICAS_OPTIONS = [
  'Pileta', 'Jardín', 'Parrilla', 'Quincho', 'Vista al mar', 'Vista al río',
  'Calefacción', 'Aire acondicionado', 'Piso radiante', 'Alarma', 'Seguridad 24hs',
  'Portón automático', 'Patio', 'Terraza', 'Balcón', 'Bodega', 'Lavadero',
  'Altillo', 'SUM', 'Cancha de paddle', 'Gimnasio', 'Acceso para discapacitados',
]

interface UploadedPhoto {
  url: string
  path?: string
  esPrincipal: boolean
  file?: File
  preview?: string
  uploading?: boolean
}

interface PropFormProps {
  initial?: Partial<Propiedad>
  existingPhotos?: UploadedPhoto[]
  mode: 'crear' | 'editar'
  propiedadId?: string
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-oscuro mb-1.5">{children}</label>
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-2.5 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/10 transition-all"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-2.5 text-sm text-oscuro outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/10 transition-all appearance-none"
    >
      {children}
    </select>
  )
}

export default function PropForm({ initial = {}, existingPhotos = [], mode, propiedadId }: PropFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID

  const [form, setForm] = useState({
    titulo: initial.titulo ?? '',
    tipo: initial.tipo ?? 'departamento',
    operacion: initial.operacion ?? 'venta',
    precio: initial.precio?.toString() ?? '',
    moneda: initial.moneda ?? 'USD',
    precio_periodo: initial.precio_periodo ?? '',
    direccion: initial.direccion ?? '',
    zona: initial.zona ?? '',
    metros_cuadrados: initial.metros_cuadrados?.toString() ?? '',
    ambientes: initial.ambientes?.toString() ?? '',
    dormitorios: initial.dormitorios?.toString() ?? '',
    banos: initial.banos?.toString() ?? '',
    cochera: initial.cochera ?? false,
    apto_credito: initial.apto_credito ?? false,
    destacada: initial.destacada ?? false,
    descripcion: initial.descripcion ?? '',
    estado: initial.estado ?? 'disponible',
    caracteristicas: (initial.caracteristicas ?? []) as string[],
  })

  const [photos, setPhotos] = useState<UploadedPhoto[]>(existingPhotos)
  const [saving, setSaving] = useState(false)
  const [leadsAlerta, setLeadsAlerta] = useState<{ id: string; nombre: string | null; telefono: string | null; consulta: string | null }[] | null>(null)
  const [error, setError] = useState('')

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const toggleCaracteristica = (c: string) => {
    set(
      'caracteristicas',
      form.caracteristicas.includes(c)
        ? form.caracteristicas.filter((x) => x !== c)
        : [...form.caracteristicas, c]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inmobiliariaId) { setError('Falta NEXT_PUBLIC_INMOBILIARIA_ID'); return }
    if (!form.titulo) { setError('El título es obligatorio'); return }
    if (photos.some((p) => p.uploading)) { setError('Esperá a que terminen de subir las fotos'); return }

    setSaving(true)
    setError('')

    const payload = {
      inmobiliaria_id: inmobiliariaId,
      titulo: form.titulo,
      tipo: form.tipo,
      operacion: form.operacion,
      precio: form.precio ? parseFloat(form.precio) : null,
      moneda: form.moneda,
      precio_periodo: form.precio_periodo || null,
      direccion: form.direccion || null,
      zona: form.zona || null,
      metros_cuadrados: form.metros_cuadrados ? parseFloat(form.metros_cuadrados) : null,
      ambientes: form.ambientes ? parseInt(form.ambientes) : null,
      dormitorios: form.dormitorios ? parseInt(form.dormitorios) : null,
      banos: form.banos ? parseInt(form.banos) : null,
      cochera: form.cochera,
      apto_credito: form.apto_credito,
      destacada: form.destacada,
      descripcion: form.descripcion || null,
      estado: form.estado,
      caracteristicas: form.caracteristicas.length > 0 ? form.caracteristicas : null,
    }

    let pid = propiedadId

    if (mode === 'crear') {
      const { data, error: err } = await supabase.from('propiedades').insert(payload).select('id').single()
      if (err || !data) { setError(err?.message ?? 'Error al crear propiedad'); setSaving(false); return }
      pid = data.id

      // Buscar leads que podrían estar interesados en esta propiedad
      fetch('/api/alertas/nueva-propiedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propiedad: { ...payload }, inmobiliariaId }),
      })
        .then(r => r.json())
        .then(({ matches }) => { if (matches?.length > 0) setLeadsAlerta(matches) })
        .catch(() => {})
    } else if (pid) {
      const { error: err } = await supabase.from('propiedades').update(payload).eq('id', pid)
      if (err) { setError(err.message); setSaving(false); return }
      await supabase.from('fotos_propiedad').delete().eq('propiedad_id', pid)
    }

    // Save photos
    if (pid && photos.length > 0) {
      const fotosPayload = photos
        .filter((p) => p.url)
        .map((p, i) => ({
          propiedad_id: pid!,
          url: p.url,
          es_principal: p.esPrincipal,
          orden: i,
        }))
      if (fotosPayload.length > 0) {
        await supabase.from('fotos_propiedad').insert(fotosPayload)
      }
    }

    setSaving(false)
    if (mode !== 'crear') {
      router.push('/admin/dashboard/propiedades')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!propiedadId) return
    if (!confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return
    await supabase.from('propiedades').delete().eq('id', propiedadId)
    router.push('/admin/dashboard/propiedades')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Información básica */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Información básica</h2>
        <div className="grid gap-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ej: Departamento 2 amb. en el centro"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
                {['departamento', 'casa', 'lote', 'local', 'campo', 'ph'].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Operación</Label>
              <Select value={form.operacion} onChange={(e) => set('operacion', e.target.value)}>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler permanente</option>
                <option value="temporada">Alquiler temporada</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida / Alquilada</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Precio</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label>Precio (dejar vacío para "Consultar")</Label>
            <Input
              type="number"
              value={form.precio}
              onChange={(e) => set('precio', e.target.value)}
              placeholder="150000"
              min={0}
            />
          </div>
          <div>
            <Label>Moneda</Label>
            <Select value={form.moneda} onChange={(e) => set('moneda', e.target.value)}>
              <option value="USD">USD</option>
              <option value="ARS">ARS $</option>
            </Select>
          </div>
        </div>
        {form.operacion !== 'venta' && (
          <div className="mt-4">
            <Label>Período</Label>
            <Select value={form.precio_periodo} onChange={(e) => set('precio_periodo', e.target.value)}>
              <option value="">Sin período</option>
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
            </Select>
          </div>
        )}
      </section>

      {/* Ubicación */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Ubicación</h2>
        <div className="grid gap-4">
          <div>
            <Label>Zona / Barrio</Label>
            <Input
              value={form.zona}
              onChange={(e) => set('zona', e.target.value)}
              placeholder="Ej: Centro, Costa, Barrio Norte"
            />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              placeholder="Ej: Av. 59 entre 4 y 6"
            />
          </div>
        </div>
      </section>

      {/* Detalles */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Detalles de la propiedad</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { key: 'metros_cuadrados', label: 'Metros cuadrados', placeholder: '65' },
            { key: 'ambientes', label: 'Ambientes', placeholder: '3' },
            { key: 'dormitorios', label: 'Dormitorios', placeholder: '2' },
            { key: 'banos', label: 'Baños', placeholder: '1' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type="number"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                min={0}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {[
            { key: 'cochera', label: 'Cochera' },
            { key: 'apto_credito', label: 'Apto crédito' },
            { key: 'destacada', label: 'Propiedad destacada' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => set(key, !form[key as keyof typeof form])}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  form[key as keyof typeof form]
                    ? 'bg-dorado border-dorado'
                    : 'bg-white border-crema-dark hover:border-dorado/50'
                }`}
              >
                {form[key as keyof typeof form] && (
                  <svg className="w-3 h-3 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-oscuro">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Descripción */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Descripción</h2>
        <textarea
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={4}
          placeholder="Describí las características más importantes de la propiedad..."
          className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/10 transition-all resize-none"
        />
      </section>

      {/* Características */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Características extras</h2>
        <div className="flex flex-wrap gap-2">
          {CARACTERISTICAS_OPTIONS.map((c) => {
            const selected = form.caracteristicas.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCaracteristica(c)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selected
                    ? 'bg-dorado text-oscuro font-semibold'
                    : 'bg-crema border border-crema-dark text-oscuro/70 hover:border-dorado/50'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </section>

      {/* Fotos */}
      <section className="bg-white border border-crema-dark rounded-2xl p-6">
        <h2 className="font-playfair text-lg font-semibold text-oscuro mb-5">Fotos</h2>
        <ImageUpload photos={photos} onChange={setPhotos} propiedadId={propiedadId} />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <div>
          {mode === 'editar' && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
              Eliminar propiedad
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-crema-dark text-oscuro/70 rounded-xl text-sm font-medium hover:border-oscuro/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-oscuro text-crema rounded-xl text-sm font-semibold hover:bg-oscuro/90 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : mode === 'crear' ? 'Publicar propiedad' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>

    {/* Panel de leads matcheados */}
    {leadsAlerta !== null && (
      <div className="mt-6 bg-white border border-dorado/40 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-oscuro flex items-center gap-2">
              <span className="text-lg">🎯</span>
              {leadsAlerta.length} lead{leadsAlerta.length !== 1 ? 's' : ''} podrían estar interesados
            </p>
            <p className="text-xs text-oscuro/50 mt-0.5">Mandales un WhatsApp avisando que apareció esta propiedad</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard/propiedades')}
            className="text-xs text-oscuro/40 hover:text-oscuro underline"
          >
            Ir a propiedades
          </button>
        </div>

        <div className="space-y-2">
          {leadsAlerta.map(lead => {
            const tel = lead.telefono?.replace(/\D/g, '') ?? ''
            const msg = encodeURIComponent(
              `Hola ${lead.nombre ?? ''}! Te cuento que acaba de entrar una propiedad nueva que puede interesarte. ¿Querés que te mande los detalles?`
            )
            return (
              <div key={lead.id} className="flex items-center justify-between gap-3 bg-crema/40 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-oscuro">{lead.nombre ?? 'Sin nombre'}</p>
                  {lead.consulta && (
                    <p className="text-xs text-oscuro/50 truncate mt-0.5">"{lead.consulta.slice(0, 80)}"</p>
                  )}
                </div>
                {tel && (
                  <a
                    href={`https://wa.me/${tel}?text=${msg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Avisar
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )}
  )
}
