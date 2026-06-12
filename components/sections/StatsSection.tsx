'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const stats = [
  { value: 150, suffix: '+', label: 'Propiedades vendidas' },
  { value: 12, suffix: ' años', label: 'De experiencia' },
  { value: 300, suffix: '+', label: 'Clientes satisfechos' },
  { value: 100, suffix: '%', label: 'Consultas respondidas' },
]

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = 16
    const increment = value / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, value])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function StatsSection() {
  return (
    <section className="bg-oscuro py-20 border-y border-crema/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-playfair text-4xl md:text-5xl font-bold text-dorado mb-2">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-crema/50 text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
