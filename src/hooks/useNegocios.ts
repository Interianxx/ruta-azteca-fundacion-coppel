'use client'

import { useState, useEffect } from 'react'
import type { Negocio } from '@/types/negocio'
import type { CategoriaSlug } from '@/types/negocio'

interface Filtros {
  categoria?: CategoriaSlug
  lastKey?: string
}

export function useNegocios(filtros: Filtros = {}) {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastKey, setLastKey]   = useState<string | undefined>()

  useEffect(() => {
    const params = new URLSearchParams()
    if (filtros.categoria) params.set('categoria', filtros.categoria)
    if (filtros.lastKey)   params.set('lastKey', filtros.lastKey)

    fetch(`/api/negocios?${params}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setNegocios(data.items)
        setLastKey(data.lastKey)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [filtros.categoria])

  return { negocios, cargando, error, lastKey }
}
