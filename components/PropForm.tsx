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

    router.push('/admin/dashboard/propiedades')
    router.refresh()
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
  )
}
