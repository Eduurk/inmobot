export interface Inmobiliaria {
  id: string
  nombre: string
  descripcion: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  direccion: string | null
  ciudad: string
  logo_url: string | null
  chatbot_nombre: string
  chatbot_prompt_extra: string | null
  chatbot_activo: boolean
  created_at: string
}

export type TipoPropiedad = 'departamento' | 'casa' | 'lote' | 'local' | 'campo' | 'ph'
export type OperacionPropiedad = 'venta' | 'alquiler' | 'temporada'
export type EstadoPropiedad = 'disponible' | 'reservada' | 'vendida'

export interface Propiedad {
  id: string
  inmobiliaria_id: string
  titulo: string
  tipo: TipoPropiedad
  operacion: OperacionPropiedad
  precio: number | null
  moneda: 'USD' | 'ARS'
  precio_periodo: 'mensual' | 'semanal' | null
  direccion: string | null
  zona: string | null
  metros_cuadrados: number | null
  ambientes: number | null
  dormitorios: number | null
  banos: number | null
  cochera: boolean
  apto_credito: boolean
  descripcion: string | null
  caracteristicas: string[] | null
  estado: EstadoPropiedad
  destacada: boolean
  created_at: string
  fotos_propiedad?: FotoPropiedad[]
}

export interface FotoPropiedad {
  id: string
  propiedad_id: string
  url: string
  es_principal: boolean
  orden: number
  created_at: string
}

export interface Lead {
  id: string
  inmobiliaria_id: string | null
  propiedad_id: string | null
  nombre: string | null
  telefono: string | null
  email: string | null
  consulta: string | null
  canal: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
