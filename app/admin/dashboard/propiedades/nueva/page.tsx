import PropForm from '@/components/PropForm'

export default function NuevaPropiedadPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-oscuro">Nueva propiedad</h1>
        <p className="text-oscuro/50 text-sm mt-1">Completá los datos para publicar una nueva propiedad</p>
      </div>
      <PropForm mode="crear" />
    </div>
  )
}
