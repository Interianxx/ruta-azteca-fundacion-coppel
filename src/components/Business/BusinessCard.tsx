'use client'

import type { Negocio } from '@/types/negocio'

interface Props { negocio: Negocio; onClick?: () => void }

export function BusinessCard({ negocio, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left p-4 bg-white rounded-xl shadow hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900">{negocio.nombre}</h3>
      <p className="text-sm text-gray-500">{negocio.categoria} · {negocio.direccion}</p>
      {negocio.calificacion && (
        <p className="text-sm text-yellow-500 mt-1">★ {negocio.calificacion}</p>
      )}
    </button>
  )
}
