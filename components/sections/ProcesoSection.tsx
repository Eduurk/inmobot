'use client'

import { motion } from 'framer-motion'

const pasos = [
  {
    numero: '01',
    titulo: 'Consultá con nuestra IA',
    descripcion: 'Contale al asistente qué buscás — zona, presupuesto, ambientes. Disponible las 24 horas.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    numero: '02',
    titulo: 'Explorá las propiedades',
    descripcion: 'Filtrá por tipo, precio y zona. Mirá el tour virtual narrado por IA desde tu celular.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    numero: '03',
    titulo: 'Coordiná una visita',
    descripcion: 'Agendá directamente por WhatsApp. Un asesor te acompaña en persona cuando vos querés.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    numero: '04',
    titulo: 'Cerrá tu operación',
    descripcion: 'Te asesoramos en cada paso del proceso legal y financiero hasta que tengas las llaves.',
    icono: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
]

export default function ProcesoSection() {
  return (
    <section className="py-24 bg-crema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-3">Cómo funciona</p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-oscuro">
            Tu próximo hogar en<br />
            <span className="text-dorado">4 pasos simples</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Línea conectora desktop */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-dorado/20" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {pasos.map((paso, i) => (
              <motion.div
                key={paso.numero}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                {/* Número + icono */}
                <div className="relative inline-flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-oscuro flex items-center justify-center text-dorado mb-0 relative z-10 shadow-lg">
                    {paso.icono}
                  </div>
                  <span className="absolute -top-2 -right-2 bg-dorado text-oscuro text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-20">
                    {paso.numero.slice(1)}
                  </span>
                </div>
                <h3 className="font-playfair text-lg font-bold text-oscuro mb-2">{paso.titulo}</h3>
                <p className="text-oscuro/60 text-sm leading-relaxed">{paso.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
