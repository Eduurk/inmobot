'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PropCard from '@/components/PropCard'
import type { Propiedad } from '@/lib/types'

const OPERACIONES = [
  { value: '', label: 'Todas' },
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'temporada', label: 'Temporada' },
]

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'departamento', label: 'Depto' },
  { value: 'casa', label: 'Casa' },
  { value: 'lote', label: 'Lote' },
  { value: 'ph', label: 'PH' },
  { value: 'local', label: 'Local' },
  { value: 'campo', label: 'Campo' },
]

interface Props {
  propiedades: Propiedad[]
  total: number
}

export default function CatalogoConFiltros({ propiedades, total }: Props) {
  const [operacion, setOperacion] = useState('')
  const [tipo, setTipo] = useState('')

  // Solo mostrar tipos que existen en el catálogo
  const tiposDisponibles = useMemo(() => {
    const existentes = new Set(propiedades.map((p) => p.tipo))
    return TIPOS.filter((t) => t.value === '' || existentes.has(t.value as Propiedad['tipo']))
  }, [propiedades])

  const filtradas = useMemo(() => {
    return propiedades.filter((p) => {
      if (operacion && p.operacion !== operacion) return false
      if (tipo && p.tipo !== tipo) return false
      return true
    })
  }, [propiedades, operacion, tipo])

  const hayFiltros = operacion !== '' || tipo !== ''

  const limpiar = () => {
    setOperacion('')
    setTipo('')
  }

  return (
    <>
      {/* Header del catálogo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-dorado text-sm font-semibold uppercase tracking-widest mb-2">Catálogo</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-oscuro">
            Propiedades disponibles
          </h2>
        </div>
        <p className="text-oscuro/50 text-sm shrink-0">
          {hayFiltros ? (
            <span>
              <span className="text-dorado font-semibold">{filtradas.length}</span> de {total} propiedades
            </span>
          ) : (
            `${total} propiedad${total !== 1 ? 'es' : ''} activa${total !== 1 ? 's' : ''}`
          )}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-8">

        {/* Operación — tabs pill */}
        <div className="flex gap-1 bg-crema-dark rounded-full p-1">
          {OPERACIONES.map((op) => (
            <button
              key={op.value}
              onClick={() => setOperacion(op.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                operacion === op.value
                  ? 'bg-oscuro text-crema shadow-sm'
                  : 'text-oscuro/55 hover:text-oscuro'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-crema-dark hidden sm:block" />

        {/* Tipo — pills individuales */}
        <div className="flex gap-1.5 flex-wrap">
          {tiposDisponibles.map((t) => (
            <button
              key={t.value}
              onClick={() => setTipo(t.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                tipo === t.value
                  ? 'bg-dorado text-oscuro border-dorado shadow-sm'
                  : 'border-crema-dark text-oscuro/55 hover:border-dorado/40 hover:text-oscuro bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Limpiar */}
        {hayFiltros && (
          <button
            onClick={limpiar}
            className="ml-auto text-xs text-oscuro/40 hover:text-dorado transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
      </div>

      {/* Grid con animación */}
      <AnimatePresence mode="wait">
        {filtradas.length > 0 ? (
          <motion.div
            key={`${operacion}-${tipo}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtradas.map((prop) => (
              <PropCard key={prop.id} propiedad={prop} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 bg-white rounded-3xl border border-crema-dark"
          >
            <div className="w-14 h-14 bg-crema rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-dorado/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-playfair text-xl font-semibold text-oscuro mb-2">Sin resultados</h3>
            <p className="text-oscuro/50 text-sm mb-5">No hay propiedades con estos filtros aplicados.</p>
            <button
              onClick={limpiar}
              className="inline-flex items-center gap-2 bg-dorado text-oscuro px-5 py-2 rounded-full font-semibold text-sm hover:bg-dorado-light transition-colors"
            >
              Ver todas las propiedades
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
