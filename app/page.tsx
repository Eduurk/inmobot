import { createServiceRoleClient } from '@/lib/supabase-server'
import PropCard from '@/components/PropCard'
import ChatWidget from '@/components/ChatWidget'
import MagneticVideo from '@/components/MagneticVideo'
import StatsSection from '@/components/sections/StatsSection'
import ProcesoSection from '@/components/sections/ProcesoSection'
import ZonasSection from '@/components/sections/ZonasSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import CTAFinalSection from '@/components/sections/CTAFinalSection'
import type { Inmobiliaria, Propiedad } from '@/lib/types'

// Siempre renderizar en el servidor para mostrar propiedades en tiempo real
export const dynamic = 'force-dynamic'

async function getData() {
  const inmobiliariaId = process.env.NEXT_PUBLIC_INMOBILIARIA_ID
  if (!inmobiliariaId) return { inmo: null, destacadas: [], total: 0 }

  const supabase = createServiceRoleClient()

  const [{ data: inmo }, { data: propiedades }] = await Promise.all([
    supabase.from('inmobiliaria').select('*').eq('id', inmobiliariaId).single(),
    supabase
      .from('propiedades')
      .select('id, inmobiliaria_id, titulo, tipo, operacion, precio, moneda, precio_periodo, direccion, zona, metros_cuadrados, ambientes, dormitorios, banos, cochera, apto_credito, descripcion, caracteristicas, estado, destacada, audio_tour_url, audio_tour_script, audio_tour_estado, created_at, fotos_propiedad(url, es_principal, orden)')
      .eq('inmobiliaria_id', inmobiliariaId)
      .eq('estado', 'disponible')
      .order('destacada', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(9),
  ])

  const allProps = (propiedades ?? []) as unknown as Propiedad[]
  const destacadas = allProps.filter((p) => p.destacada).slice(0, 3)
  const recientes = allProps.filter((p) => !p.destacada).slice(0, 6)
  const todas = destacadas.length > 0 ? [...destacadas, ...recientes] : allProps.slice(0, 6)

  return { inmo: inmo as Inmobiliaria | null, destacadas: todas, total: propiedades?.length ?? 0 }
}

export default async function LandingPage() {
  const { inmo, destacadas, total } = await getData()

  const nombre = inmo?.nombre ?? 'InmoBot'
  const ciudad = inmo?.ciudad ?? 'tu ciudad'
  const descripcion = inmo?.descripcion ?? 'Encontrá tu próximo hogar con la ayuda de nuestro asistente inteligente.'
  const whatsapp = inmo?.whatsapp ?? inmo?.telefono ?? ''

  return (
    <div className="min-h-screen bg-crema font-outfit">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-oscuro/95 backdrop-blur-sm border-b border-crema/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {inmo?.logo_url ? (
              <img src={inmo.logo_url} alt={nombre} className="h-9 w-auto" />
            ) : (
              <div className="w-9 h-9 bg-dorado rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-oscuro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
            <span className="font-playfair text-xl font-bold text-crema">{nombre}</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#propiedades" className="text-crema/70 hover:text-dorado text-sm transition-colors">Propiedades</a>
            <a href="#nosotros" className="text-crema/70 hover:text-dorado text-sm transition-colors">Nosotros</a>
            <a href="#contacto" className="text-crema/70 hover:text-dorado text-sm transition-colors">Contacto</a>
          </nav>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-dorado text-oscuro px-4 py-2 rounded-full text-sm font-semibold hover:bg-dorado-light transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-oscuro text-crema overflow-hidden min-h-[92vh] flex flex-col justify-between">

        {/* Dots grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize:'40px 40px'}} />

        {/* Video 3D magnético — desktop derecha, mobile oculto */}
        <div className="hidden lg:flex absolute right-0 top-0 w-[52%] h-full items-center justify-center pr-8 z-[2]">
          <MagneticVideo src="/edificio-hero.mp4" width={500} height={500} strength={0.3} />
          {/* Floating badges alrededor del edificio */}
          <div className="absolute top-[22%] right-[18%] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-right">
            <p className="text-dorado font-bold text-lg leading-none">100%</p>
            <p className="text-crema/60 text-xs mt-0.5">Consultas respondidas</p>
          </div>
          <div className="absolute bottom-[28%] right-[12%] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5">
            <p className="text-dorado font-bold text-lg leading-none">24/7</p>
            <p className="text-crema/60 text-xs mt-0.5">Asistente IA activo</p>
          </div>
          <div className="absolute bottom-[38%] left-[8%] bg-dorado/20 backdrop-blur-md border border-dorado/30 rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-dorado rounded-full animate-pulse" />
            <p className="text-dorado text-xs font-semibold">Necochea · Costa Atlántica</p>
          </div>
        </div>

        {/* Gradiente que funde el video con el fondo oscuro */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-oscuro via-oscuro/90 via-[42%] to-transparent pointer-events-none z-[1]" />
        {/* Mobile: fondo oscuro sólido */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-oscuro via-oscuro to-oscuro/90" />
        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-oscuro/60 via-transparent to-transparent pointer-events-none z-[1]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-36 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-dorado/20 border border-dorado/30 px-3 py-1.5 rounded-full text-dorado text-sm mb-6">
              <span className="w-2 h-2 bg-dorado rounded-full animate-pulse" />
              Asistente IA disponible 24/7
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Encontrá tu próximo<br />
              <span className="text-dorado">hogar en {ciudad}</span>
            </h1>
            <p className="text-crema/70 text-lg md:text-xl max-w-lg mb-8 leading-relaxed">
              {descripcion}
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href="#propiedades"
                className="bg-dorado text-oscuro px-6 py-3 rounded-full font-semibold text-sm hover:bg-dorado-light transition-colors"
              >
                Ver propiedades
              </a>
              <a
                href="#contacto"
                className="border border-crema/30 text-crema px-6 py-3 rounded-full font-semibold text-sm hover:border-dorado hover:text-dorado transition-colors"
              >
                Hablar con un asesor
              </a>
            </div>
            {/* Mini stats bajo los botones */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-dorado/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-dorado" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                </div>
                <div>
                  <p className="text-crema font-semibold text-sm">{total}+ propiedades</p>
                  <p className="text-crema/40 text-xs">disponibles hoy</p>
                </div>
              </div>
              <div className="w-px bg-crema/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-dorado/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-dorado" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                </div>
                <div>
                  <p className="text-crema font-semibold text-sm">IA responde al instante</p>
                  <p className="text-crema/40 text-xs">consultas 24 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {total > 0 && (
          <div className="relative border-t border-crema/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-8">
              <div>
                <p className="font-playfair text-2xl font-bold text-dorado">{total}+</p>
                <p className="text-crema/60 text-sm">Propiedades disponibles</p>
              </div>
              <div>
                <p className="font-playfair text-2xl font-bold text-dorado">24/7</p>
                <p className="text-crema/60 text-sm">Atención con IA</p>
              </div>
              <div>
                <p className="font-playfair text-2xl font-bold text-dorado">{ciudad}</p>
                <p className="text-crema/60 text-sm">Y alrededores</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Propiedades */}
      <section id="propiedades" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-2">Catálogo</p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-oscuro">
                Propiedades disponibles
              </h2>
            </div>
            {total > 0 && (
              <p className="text-oscuro/50 text-sm shrink-0">
                {total} propiedad{total !== 1 ? 'es' : ''} activa{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {destacadas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destacadas.map((prop) => (
                <PropCard key={prop.id} propiedad={prop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-crema-dark">
              <div className="w-16 h-16 bg-crema rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dorado" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-semibold text-oscuro mb-2">Sin propiedades cargadas</h3>
              <p className="text-oscuro/50 max-w-sm mx-auto text-sm">
                Consultá con nuestro asistente virtual para conocer la disponibilidad.
              </p>
            </div>
          )}

          {/* CTA chatbot */}
          {total > 0 && (
            <div className="mt-10 bg-oscuro rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-playfair text-2xl font-bold text-crema mb-1">¿No encontraste lo que buscás?</p>
                <p className="text-crema/60 text-sm">Nuestro asistente IA te puede ayudar a encontrar la propiedad ideal.</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-dorado text-oscuro px-6 py-3 rounded-full font-semibold text-sm">
                <span className="w-2 h-2 bg-oscuro/40 rounded-full animate-pulse" />
                Chatbot disponible ↘
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats animados */}
      <StatsSection />

      {/* Proceso */}
      <ProcesoSection />

      {/* Zonas */}
      <ZonasSection />

      {/* Features / Por qué elegirnos */}
      <FeaturesSection />

      {/* Nosotros */}
      <section id="nosotros" className="bg-oscuro text-crema">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
                Tu inmobiliaria de<br />
                <span className="text-dorado">confianza</span>
              </h2>
              <p className="text-crema/70 leading-relaxed mb-6">
                {descripcion}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🤖', title: 'Chatbot IA', desc: 'Respuestas instantáneas 24hs' },
                  { icon: '🏠', title: 'Propiedades', desc: 'Amplio catálogo actualizado' },
                  { icon: '📍', title: 'Zona local', desc: `Especialistas en ${ciudad}` },
                  { icon: '✅', title: 'Confiable', desc: 'Años de experiencia' },
                ].map((item) => (
                  <div key={item.title} className="bg-crema/5 border border-crema/10 rounded-xl p-4">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h4 className="font-semibold text-crema text-sm">{item.title}</h4>
                    <p className="text-crema/50 text-xs mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-crema/5 border border-crema/10 rounded-2xl p-8">
              <p className="font-playfair text-4xl font-bold text-dorado mb-1">{total}+</p>
              <p className="text-crema/60 mb-6">propiedades disponibles</p>
              <p className="text-crema/80 text-sm leading-relaxed">
                Nuestro asistente virtual está disponible las 24 horas para responder tus consultas sobre propiedades, precios y coordinar visitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-oscuro mb-2">Contactate con nosotros</h2>
          <p className="text-oscuro/60">Estamos para ayudarte a encontrar lo que buscás</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-crema-dark rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-dorado hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-oscuro">WhatsApp</span>
              <span className="text-xs text-oscuro/50">{whatsapp}</span>
            </a>
          )}

          {inmo?.telefono && (
            <a
              href={`tel:${inmo.telefono.replace(/\D/g, '')}`}
              className="bg-white border border-crema-dark rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-dorado hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-dorado/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-dorado" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-oscuro">Teléfono</span>
              <span className="text-xs text-oscuro/50">{inmo.telefono}</span>
            </a>
          )}

          {inmo?.email && (
            <a
              href={`mailto:${inmo.email}`}
              className="bg-white border border-crema-dark rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-dorado hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-dorado/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-dorado" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-oscuro">Email</span>
              <span className="text-xs text-oscuro/50 truncate max-w-full px-2 text-center">{inmo.email}</span>
            </a>
          )}

          {inmo?.direccion && (
            <div className="bg-white border border-crema-dark rounded-2xl p-5 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-dorado/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-dorado" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-oscuro">Dirección</span>
              <span className="text-xs text-oscuro/50 text-center">{inmo.direccion}</span>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <CTAFinalSection whatsapp={whatsapp} ciudad={ciudad} />

      {/* Footer */}
      <footer className="bg-oscuro border-t border-crema/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-playfair text-lg font-bold text-crema">{nombre}</p>
          <p className="text-crema/40 text-sm">
            Powered by <span className="text-dorado">InmoBot</span> — Asistente IA para inmobiliarias
          </p>
        </div>
      </footer>

      {/* Chatbot widget */}
      <ChatWidget />
    </div>
  )
}
