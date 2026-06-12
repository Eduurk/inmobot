'use client'

import { motion } from 'framer-motion'

const zonas = [
  {
    nombre: 'Frente al Mar',
    descripcion: 'Departamentos y casas a metros de la playa. La zona más buscada de Necochea.',
    propiedades: '18',
    gradient: 'from-blue-900/80 via-blue-800/60 to-oscuro/90',
    bg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-oscuro',
    emoji: '🌊',
  },
  {
    nombre: 'Centro',
    descripcion: 'Cerca de comercios, colegios y servicios. Ideal para vivir todo el año.',
    propiedades: '24',
    gradient: 'from-oscuro/80 via-oscuro/60 to-transparent',
    bg: 'bg-gradient-to-br from-oscuro via-zinc-900 to-zinc-800',
    emoji: '🏙️',
  },
  {
    nombre: 'Barrio Los Tilos',
    descripcion: 'Casas amplias con jardín en un barrio tranquilo y arbolado. Perfecto para familias.',
    propiedades: '12',
    gradient: 'from-green-950/80 via-green-900/60 to-oscuro/90',
    bg: 'bg-gradient-to-br from-green-950 via-emerald-950 to-oscuro',
    emoji: '🌳',
  },
  {
    nombre: 'Costa Bonita',
    descripcion: 'Barrio residencial de alta categoría. Lotes y chalets en un entorno exclusivo.',
    propiedades: '9',
    gradient: 'from-amber-950/80 via-yellow-950/60 to-oscuro/90',
    bg: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-oscuro',
    emoji: '✨',
  },
]

export default function ZonasSection() {
  return (
    <section className="py-24 bg-oscuro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-3">Dónde encontramos</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-crema">
              Las mejores zonas<br />
              <span className="text-dorado">de Necochea</span>
            </h2>
            <p className="text-crema/50 max-w-xs text-sm leading-relaxed">
              Conocemos cada barrio. Te ayudamos a encontrar la zona que mejor se adapta a tu estilo de vida.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zonas.map((zona, i) => (
            <motion.div
              key={zona.nombre}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative rounded-3xl overflow-hidden cursor-pointer group ${zona.bg} border border-white/10 hover:border-dorado/40 transition-colors`}
              style={{ minHeight: 280 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${zona.gradient}`} />
              <div className="relative p-6 h-full flex flex-col justify-between" style={{ minHeight: 280 }}>
                <div className="text-4xl mb-4">{zona.emoji}</div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-playfair text-xl font-bold text-crema">{zona.nombre}</h3>
                    <span className="text-xs text-dorado font-semibold bg-dorado/20 px-2 py-1 rounded-full">
                      {zona.propiedades} props.
                    </span>
                  </div>
                  <p className="text-crema/60 text-sm leading-relaxed">{zona.descripcion}</p>
                  <div className="mt-4 flex items-center gap-1 text-dorado text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver propiedades <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
