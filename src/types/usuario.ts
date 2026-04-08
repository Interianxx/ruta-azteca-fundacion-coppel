export type RolUsuario =
  | 'turista'
  | 'negocio_pendiente'
  | 'negocio_activo'
  | 'admin'

export interface Usuario {
  sub: string // Cognito subject (ID único)
  email: string
  nombre: string
  imagen?: string
  rol: RolUsuario
  negocioId?: string // solo para negocio_pendiente / negocio_activo
}
