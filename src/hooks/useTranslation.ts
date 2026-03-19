'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ra_translations'
const IDIOMA_DEFAULT = 'es'

function getIdiomaDispositivo(): string {
  if (typeof navigator === 'undefined') return IDIOMA_DEFAULT
  const lang = navigator.language || IDIOMA_DEFAULT
  return lang.split('-')[0] // "pt-BR" → "pt", "en-US" → "en"
}

function getCacheLocal(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function setCacheLocal(cache: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage lleno — no crítico
  }
}

function cacheKey(texto: string, idioma: string): string {
  return `${idioma}|${texto}`
}

async function traducirRemoto(texto: string, idiomaDestino: string): Promise<string> {
  const res = await fetch('/api/traduccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, idiomaDestino }),
  })
  if (!res.ok) return texto
  const json = await res.json()
  return json.data?.traduccion ?? texto
}

export function useTranslation() {
  const [idioma, setIdioma] = useState<string>(IDIOMA_DEFAULT)
  const [cache, setCache] = useState<Record<string, string>>({})

  useEffect(() => {
    const idiomaDetectado = getIdiomaDispositivo()
    setIdioma(idiomaDetectado)
    setCache(getCacheLocal())
  }, [])

  const t = useCallback(
    async (texto: string): Promise<string> => {
      if (!texto || idioma === IDIOMA_DEFAULT) return texto

      const key = cacheKey(texto, idioma)

      // 1. Cache local (localStorage) — sin costo
      if (cache[key]) return cache[key]

      // 2. Lambda → DynamoDB cache → Amazon Translate
      const traduccion = await traducirRemoto(texto, idioma)

      // 3. Guardar en localStorage
      const nuevoCache = { ...cache, [key]: traduccion }
      setCache(nuevoCache)
      setCacheLocal(nuevoCache)

      return traduccion
    },
    [idioma, cache],
  )

  return { t, idioma }
}
