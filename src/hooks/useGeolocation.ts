'use client'

import { useState, useEffect } from 'react'
import { CDMX_CENTER } from '@/lib/mapbox'

interface Posicion {
  lat: number
  lng: number
}

export function useGeolocation() {
  const [posicion, setPosicion] = useState<Posicion | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada')
      setCargando(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setCargando(false)
      },
      () => {
        // Fallback al centro de CDMX si el usuario niega permisos
        setPosicion({ lat: CDMX_CENTER[1], lng: CDMX_CENTER[0] })
        setError('Permisos de ubicación denegados — usando CDMX centro')
        setCargando(false)
      },
      { timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  return { posicion, error, cargando }
}
