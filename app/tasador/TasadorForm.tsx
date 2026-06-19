'use client'

import { useState } from 'react'

type TipoPropiedad = 'casa' | 'departamento' | 'ph' | 'lote' | 'local' | 'campo'
type Operacion = 'venta' | 'alquiler'
type EstadoForm = 'idle' | 'iniciando' | 'buscando' | 'analizando' | 'done' | 'error'

interface FormData {
  tipo: TipoPropiedad
  operacion: Operacion
  ciudad: string
  zona: string
  metros: string
  ambientes: string
  dormitorios: string
  estado: string
  nombre: string
  whatsapp: string
}

interface Comparable {
  titulo: string
  precio: string
  metros: number | null
  zona: string
  url: string | null
}

interface Valuacion {
  precio_min: number
  precio_max: number
  precio_recomendado: number
  moneda: string
  precio_m2: number
  analisis: string
  factores_positivos: string[]
  factores_negativos: string[]
  confianza: 'alta' | 'media' | 'baja'
}

const TIPOS: { value: TipoPropiedad; label: string; icon: string }[] = [
  { value: 'casa', label: 'Casa', icon: '🏠' },
  { value: 'departamento', label: 'Depto', icon: '🏢' },
  { value: 'ph', label: 'PH', icon: '🏡' },
  { value: 'lote', label: 'Lote', icon: '🌳' },
  { value: 'local', label: 'Local', icon: '🏪' },
  { value: 'campo', label: 'Campo', icon: '🌾' },
]

const CONFIANZA_COLOR = {
  alta: 'text-green-600 bg-green-50',
  media: 'text-yellow-600 bg-yellow-50',
  baja: 'text-orange-600 bg-orange-50',
}

const ESTADO_STEPS: Record<EstadoForm, string> = {
  idle: '',
  iniciando: 'Conectando con Zonaprop...',
  buscando: 'Buscando propiedades comparables en la zona...',
  analizando: 'La IA está analizando el mercado...',
  done: '',
  error: '',
}

export default function TasadorForm() {
  const [form, setForm] = useState<FormData>({
    tipo: 'casa',
    operacion: 'venta',
    ciudad: 'Necochea',
    zona: '',
    metros: '',
    ambientes: '',
    dormitorios: '',
    estado: '',
    nombre: '',
    whatsapp: '',
  })
  const [estadoForm, setEstadoForm] = useState<EstadoForm>('idle')
  const [valuacion, setValuacion] = useState<Valuacion | null>(null)
  const [comparables, setComparables] = useState<Comparable[]>([])
  const [sinDatos, setSinDatos] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.metros || Number(form.metros) < 10) return

    setEstadoForm('iniciando')
    setValuacion(null)
    setComparables([])
    setSinDatos(false)
    setErrorMsg('')

    try {
      // Paso 1: iniciar run en Apify
      const startRes = await fetch('/api/tasador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!startRes.ok) throw new Error('No se pudo iniciar el scraping')
      const { runId, datasetId } = await startRes.json()

      setEstadoForm('buscando')

      // Paso 2: polling hasta que el run termine
      let intentos = 0
      const maxIntentos = 40 // 40 × 3s = 2 min máximo
      let done = false

      while (!done && intentos < maxIntentos) {
        await new Promise((r) => setTimeout(r, 3000))
        intentos++

        const analisisRes = await fetch('/api/tasador/analizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, datasetId, form }),
        })

        if (!analisisRes.ok) throw new Error('Error al analizar')
        const data = await analisisRes.json()

        if (data.status === 'running') {
          if (intentos > 5) setEstadoForm('analizando')
          continue
        }

        if (data.status === 'failed') {
          throw new Error(data.error ?? 'El scraping falló')
        }

        if (data.status === 'done') {
          setValuacion(data.valuacion)
          setComparables(data.comparables ?? [])
          setSinDatos(!!data.sinDatos)
          setEstadoForm('done')
          done = true
        }
      }

      if (!done) throw new Error('Tiempo de espera agotado. Intentá de nuevo.')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
      setEstadoForm('error')
    }
  }

  const formatPrecio = (n: number, moneda: string) =>
    `${moneda} ${n.toLocaleString('es-AR')}`

  return (
    <div className="max-w-2xl mx-auto">
      {/* Form */}
      {estadoForm === 'idle' || estadoForm === 'error' ? (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-oscuro mb-3">Tipo de propiedad</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-xs font-semibold transition-all ${
                    form.tipo === t.value
                      ? 'bg-oscuro text-crema border-oscuro'
                      : 'bg-white border-crema-dark text-oscuro/60 hover:border-dorado/40'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operación */}
          <div>
            <label className="block text-sm font-semibold text-oscuro mb-3">Operación</label>
            <div className="flex gap-2">
              {(['venta', 'alquiler'] as Operacion[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, operacion: op }))}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold border transition-all capitalize ${
                    form.operacion === op
                      ? 'bg-dorado text-oscuro border-dorado'
                      : 'bg-white border-crema-dark text-oscuro/60 hover:border-dorado/40'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Ciudad y Zona */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-oscuro mb-2">Ciudad</label>
              <input
                type="text"
                value={form.ciudad}
                onChange={set('ciudad')}
                placeholder="Necochea"
                className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-oscuro mb-2">Barrio / Zona</label>
              <input
                type="text"
                value={form.zona}
                onChange={set('zona')}
                placeholder="Centro, Frente al mar..."
                className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
          </div>

          {/* Metros */}
          <div>
            <label className="block text-sm font-semibold text-oscuro mb-2">Superficie cubierta (m²)</label>
            <input
              type="number"
              value={form.metros}
              onChange={set('metros')}
              placeholder="Ej: 80"
              min={10}
              max={5000}
              className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              required
            />
          </div>

          {/* Ambientes y Dormitorios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-oscuro mb-2">Ambientes (opcional)</label>
              <input
                type="number"
                value={form.ambientes}
                onChange={set('ambientes')}
                placeholder="Ej: 3"
                min={1}
                max={20}
                className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-oscuro mb-2">Dormitorios (opcional)</label>
              <input
                type="number"
                value={form.dormitorios}
                onChange={set('dormitorios')}
                placeholder="Ej: 2"
                min={0}
                max={10}
                className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-oscuro mb-2">Estado de la propiedad (opcional)</label>
            <select
              value={form.estado}
              onChange={set('estado')}
              className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
            >
              <option value="">No especificar</option>
              <option value="a estrenar">A estrenar</option>
              <option value="muy bueno">Muy bueno</option>
              <option value="bueno">Bueno</option>
              <option value="a refaccionar">A refaccionar</option>
            </select>
          </div>

          {/* Separador datos de contacto */}
          <div className="border-t border-crema-dark pt-6">
            <p className="text-sm font-semibold text-oscuro mb-1">Tus datos de contacto</p>
            <p className="text-xs text-oscuro/50 mb-4">Para enviarte el informe completo</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-oscuro/70 mb-2">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set('nombre')}
                  placeholder="Tu nombre"
                  className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-oscuro/70 mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={set('whatsapp')}
                  placeholder="Ej: 2262123456"
                  className="w-full border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro focus:outline-none focus:border-dorado bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {estadoForm === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-dorado hover:bg-dorado-light text-oscuro font-bold py-4 rounded-full text-base transition-all shadow-md hover:shadow-lg"
          >
            Tasar mi propiedad gratis
          </button>
        </form>
      ) : estadoForm !== 'done' ? (
        /* Loading state */
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-crema-dark" />
            <div className="absolute inset-0 rounded-full border-4 border-dorado border-t-transparent animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
          </div>
          <h3 className="font-playfair text-xl font-bold text-oscuro mb-2">Analizando el mercado</h3>
          <p className="text-oscuro/50 text-sm">{ESTADO_STEPS[estadoForm]}</p>
          <div className="mt-8 space-y-2 max-w-xs mx-auto text-left">
            {[
              { label: 'Conectar con Zonaprop', done: estadoForm !== 'iniciando' },
              { label: 'Buscar comparables en la zona', done: estadoForm === 'analizando' },
              { label: 'Analizar precios con IA', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  step.done ? 'bg-green-500 text-white' : 'bg-crema-dark text-oscuro/30'
                }`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={step.done ? 'text-oscuro' : 'text-oscuro/40'}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Resultados */
        <div className="space-y-6">
          {/* Header resultado */}
          <div className="text-center">
            <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-1">Tasación completada</p>
            <h3 className="font-playfair text-2xl font-bold text-oscuro">
              {form.tipo.charAt(0).toUpperCase() + form.tipo.slice(1)} en {form.zona || form.ciudad}
            </h3>
          </div>

          {valuacion ? (
            <>
              {/* Card principal de precio */}
              <div className="bg-oscuro rounded-3xl p-6 text-crema text-center">
                <p className="text-crema/50 text-xs uppercase tracking-widest mb-2">Valor de mercado estimado</p>
                <p className="font-playfair text-4xl font-bold text-dorado mb-1">
                  {formatPrecio(valuacion.precio_recomendado, valuacion.moneda)}
                </p>
                <p className="text-crema/50 text-sm">
                  Rango: {formatPrecio(valuacion.precio_min, valuacion.moneda)} — {formatPrecio(valuacion.precio_max, valuacion.moneda)}
                </p>
                <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-crema/40">Precio/m²</p>
                    <p className="font-semibold text-sm">{valuacion.moneda} {valuacion.precio_m2?.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-xs text-crema/40">Confianza</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONFIANZA_COLOR[valuacion.confianza]}`}>
                      {valuacion.confianza}
                    </span>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-xs text-crema/40">Superficie</p>
                    <p className="font-semibold text-sm">{form.metros}m²</p>
                  </div>
                </div>
              </div>

              {/* Análisis */}
              <div className="bg-white rounded-2xl border border-crema-dark p-5">
                <p className="text-xs font-semibold text-oscuro/50 uppercase tracking-widest mb-2">Análisis del mercado</p>
                <p className="text-sm text-oscuro/80 leading-relaxed">{valuacion.analisis}</p>
              </div>

              {/* Factores */}
              {(valuacion.factores_positivos?.length > 0 || valuacion.factores_negativos?.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {valuacion.factores_positivos?.length > 0 && (
                    <div className="bg-green-50 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-green-700 mb-2">A favor</p>
                      <ul className="space-y-1">
                        {valuacion.factores_positivos.map((f, i) => (
                          <li key={i} className="text-xs text-green-800 flex gap-1.5">
                            <span>+</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {valuacion.factores_negativos?.length > 0 && (
                    <div className="bg-orange-50 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-orange-700 mb-2">A considerar</p>
                      <ul className="space-y-1">
                        {valuacion.factores_negativos.map((f, i) => (
                          <li key={i} className="text-xs text-orange-800 flex gap-1.5">
                            <span>−</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : sinDatos ? (
            <div className="bg-white rounded-2xl border border-crema-dark p-6 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-semibold text-oscuro mb-1">Sin comparables en Zonaprop</p>
              <p className="text-sm text-oscuro/50">No encontramos propiedades similares publicadas en la zona. Contactanos para una tasación manual.</p>
            </div>
          ) : null}

          {/* Comparables */}
          {comparables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-oscuro/50 uppercase tracking-widest mb-3">Comparables en Zonaprop</p>
              <div className="space-y-2">
                {comparables.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-crema-dark rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-oscuro truncate">{c.zona}</p>
                      {c.metros && <p className="text-xs text-oscuro/40">{c.metros}m²</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-sm font-bold text-dorado">{c.precio}</p>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-oscuro/40 hover:text-dorado transition-colors"
                        >
                          Ver →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA lead */}
          <div className="bg-dorado/10 border border-dorado/30 rounded-3xl p-6 text-center">
            <p className="font-playfair text-lg font-bold text-oscuro mb-1">¿Querés publicar tu propiedad?</p>
            <p className="text-sm text-oscuro/60 mb-4">Te ayudamos a venderla al mejor precio del mercado.</p>
            <a
              href={`https://wa.me/542262000000?text=${encodeURIComponent(
                `Hola, hice una tasación con InmoBot. Tengo una ${form.tipo} de ${form.metros}m² en ${form.zona || form.ciudad} y me interesa publicarla. Mi nombre es ${form.nombre}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-oscuro text-crema px-6 py-3 rounded-full font-semibold text-sm hover:bg-oscuro/80 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Hablar con un asesor
            </a>
          </div>

          {/* Tasar de nuevo */}
          <button
            onClick={() => { setEstadoForm('idle'); setValuacion(null); setComparables([]) }}
            className="w-full py-3 text-sm text-oscuro/40 hover:text-oscuro transition-colors"
          >
            Tasar otra propiedad →
          </button>
        </div>
      )}
    </div>
  )
}
