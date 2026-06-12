'use client'

import { motion } from 'framer-motion'

interface Props {
  whatsapp: string
  ciudad: string
}

export default function CTAFinalSection({ whatsapp, ciudad }: Props) {
  const waNumber = whatsapp.replace(/\D/g, '')

  return (
    <section className="relative bg-oscuro py-28 overflow-hidden">
      {/* Dots grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Glow central */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-dorado/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-4">¿Listo para empezar?</p>
          <h2 className="font-playfair text-4xl md:text-6xl font-bold text-crema leading-tight mb-6">
            Tu próximo hogar<br />
            <span className="text-dorado">te está esperando</span>
          </h2>
          <p className="text-crema/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Hablá con nuestro asistente o contactá directamente a un asesor. Encontramos lo que buscás en {ciudad}.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {waNumber && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                href={`https://wa.me/${waNumber}?text=Hola, me interesa una propiedad en ${ciudad}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-dorado text-oscuro px-8 py-4 rounded-full font-bold text-base hover:bg-dorado-light transition-colors shadow-lg shadow-dorado/20"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Hablar por WhatsApp
              </motion.a>
            )}
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              href="#propiedades"
              className="inline-flex items-center justify-center gap-2 border border-crema/20 text-crema px-8 py-4 rounded-full font-semibold text-base hover:border-dorado hover:text-dorado transition-colors"
            >
              Ver propiedades
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
