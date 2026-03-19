export type EstadoNegocio = 'PENDING' | 'ACTIVE' | 'REJECTED'

export type CategoriaSlug =
  | 'comida'
  | 'artesanias'
  | 'hospedaje'
  | 'tours'
  | 'transporte'
  | 'otro'

export interface Negocio {
  id: string
  nombre: string
  descripcion: string
  categoria: CategoriaSlug
  estado: EstadoNegocio
  propietarioId: string // Cognito sub
  telefono: string
  whatsapp?: string
  direccion: string
  lat: number
  lng: number
  imagenUrl?: string
  tags: string[]
  calificacion?: number
  totalReviews?: number
  createdAt: string
  updatedAt: string
}

export interface NegocioInput {
  nombre: string
  descripcion: string
  categoria: CategoriaSlug
  telefono: string
  whatsapp?: string
  direccion: string
  lat: number
  lng: number
  tags?: string[]
}
