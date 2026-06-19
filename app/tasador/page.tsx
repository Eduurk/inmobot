import type { Metadata } from 'next'
import TasadorForm from './TasadorForm'

export const metadata: Metadata = {
  title: 'Tasador IA — ¿Cuánto vale tu propiedad?',
  description: 'Obtené una tasación gratuita basada en precios reales del mercado. Compara con propiedades similares en Zonaprop y recibí un análisis de IA en minutos.',
}

export default function TasadorPage() {
  return (
    <main className="min-h-screen bg-crema">
      {/* Hero */}
      <div className="bg-oscuro text-crema py-16 px-6 text-center">
        <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-3">Tasador IA gratuito</p>
        <h1 className="font-playfair text-3xl md:text-5xl font-bold mb-4">
          ¿Cuánto vale<br />tu propiedad?
        </h1>
        <p className="text-crema/60 text-base max-w-md mx-auto">
          Comparamos con propiedades reales publicadas en Zonaprop y la IA calcula el valor de mercado en minutos.
        </p>
        <div className="flex justify-center gap-6 mt-8 text-sm text-crema/40">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-dorado" />
            Datos reales de Zonaprop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-dorado" />
            Análisis IA en tiempo real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-dorado" />
            100% gratuito
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <TasadorForm />
      </div>

      {/* Footer */}
      <div className="text-center pb-12 text-xs text-oscuro/30">
        Powered by InmoBot IA · Datos de mercado en tiempo real
      </div>
    </main>
  )
}
