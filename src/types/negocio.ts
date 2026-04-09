export type EstadoNegocio = 'PENDING' | 'ACTIVE' | 'REJECTED'

export interface HorarioDia {
  abierto: boolean
  apertura: string // "09:00"
  cierre: string   // "21:00"
}

export interface Horario {
  lun: HorarioDia; mar: HorarioDia; mie: HorarioDia; jue: HorarioDia
  vie: HorarioDia; sab: HorarioDia; dom: HorarioDia
}

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
  horario?: Horario
  menu?: MenuItem[]
  imagenes?: string[]
  createdAt: string
  updatedAt: string
}

export interface NegocioCache {
  id: string,
  negocio: Negocio,
  synced: boolean
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
  imagenUrl?: string
}

export interface MenuItem {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string // ej: "Entradas", "Bebidas"
  imagenUrl?: string
  popularidad?: number // contador de ventas simulado
  disponible?: boolean
}

export interface Pedido {
  id: string
  negocioId: string
  items: { 
    id: string
    nombre: string
    cantidad: number
    precio: number
  }[]
  total: number
  estado: 'pendiente' | 'completado'
  fecha: string
  folio: string
}
