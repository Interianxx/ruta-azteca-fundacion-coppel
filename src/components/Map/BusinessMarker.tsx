// TODO: marcador personalizado para negocios en el mapa
'use client'

import type { Negocio } from '@/types/negocio'

interface Props { negocio: Negocio; onClick: (n: Negocio) => void }

export function BusinessMarker({ negocio, onClick }: Props) {
  return (
    <button onClick={() => onClick(negocio)} className="text-2xl" aria-label={negocio.nombre}>
      📍
    </button>
  )
}
