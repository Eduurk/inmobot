'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-oscuro rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-dorado" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="font-playfair text-2xl font-bold text-oscuro">InmoBot</h1>
          <p className="text-oscuro/50 text-sm mt-1">Panel Administrativo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-crema-dark p-8">
          <h2 className="font-playfair text-xl font-semibold text-oscuro mb-6">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-oscuro mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@tuinmobiliaria.com"
                className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-oscuro mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-crema border border-crema-dark rounded-xl px-4 py-3 text-sm text-oscuro placeholder:text-oscuro/40 outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/10 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-oscuro text-crema py-3 rounded-xl font-semibold text-sm hover:bg-oscuro/90 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-oscuro/40 text-xs mt-6">
          InmoBot — Panel exclusivo para administradores
        </p>
      </div>
    </div>
  )
}
