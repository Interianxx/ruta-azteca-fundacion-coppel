'use client'

import { useSession } from 'next-auth/react'
import type { RolUsuario, Usuario } from '@/types/usuario'

export function useAuth() {
  const { data: session, status } = useSession()

  const usuario = session?.user as Usuario | undefined
  const rol: RolUsuario | undefined = usuario?.rol

  return {
    usuario,
    rol,
    esTurista:          rol === 'turista',
    esNegocioPendiente: rol === 'negocio_pendiente',
    esNegocioActivo:    rol === 'negocio_activo',
    esAdmin:            rol === 'admin',
    cargando:           status === 'loading',
    autenticado:        status === 'authenticated',
  }
}
