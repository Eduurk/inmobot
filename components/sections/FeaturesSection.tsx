'use client'

import { motion } from 'framer-motion'

const features = [
  {
    titulo: 'Chatbot IA 24/7',
    descripcion: 'Nuestro asistente responde al instante cualquier consulta sobre propiedades, precios y disponibilidad.',
    icono: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.317 2.798H4.515c-1.346 0-2.316-1.798-1.317-2.798L4.2 15.3" />
      </svg>
    ),
  },
  {
    titulo: 'Tour Virtual con IA',
    descripcion: 'Recorrí cada propiedad desde tu celular con narración generada por inteligencia artificial.',
    icono: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
  {
    titulo: 'Especialistas locales',
    descripcion: 'Más de 12 años operando en Necochea y la costa atlántica. Conocemos cada barrio.',
    icono: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    titulo: 'Gestión transparente',
    descripcion: 'Acompañamiento en cada etapa: búsqueda, visita, oferta, escrituración y entrega de llaves.',
    icono: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-crema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Texto izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-3">Por qué elegirnos</p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-oscuro leading-tight mb-6">
              La inmobiliaria que<br />
              <span className="text-dorado">trabaja para vos</span>
            </h2>
            <p className="text-oscuro/60 leading-relaxed mb-8">
              Combinamos la experiencia local de más de una década con tecnología de inteligencia artificial para ofrecerte el mejor servicio inmobiliario de la costa atlántica.
            </p>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 bg-oscuro text-crema px-6 py-3 rounded-full font-semibold text-sm hover:bg-oscuro/80 transition-colors"
            >
              Hablar con un asesor
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>

          {/* Grid features derecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.titulo}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-crema-dark hover:border-dorado/30 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-dorado/10 rounded-xl flex items-center justify-center text-dorado mb-4">
                  {f.icono}
                </div>
                <h3 className="font-semibold text-oscuro mb-1.5">{f.titulo}</h3>
                <p className="text-oscuro/55 text-sm leading-relaxed">{f.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
