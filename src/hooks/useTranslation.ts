'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY        = 'ra_translations'
const IDIOMA_OVERRIDE_KEY = 'ra_idioma_override'
const IDIOMA_DEFAULT     = 'es'
const IDIOMA_EVENT       = 'ra-idioma-change'

function getIdiomaDispositivo(): string {
  if (typeof navigator === 'undefined') return IDIOMA_DEFAULT
  return (navigator.language || IDIOMA_DEFAULT).split('-')[0]
}

function getIdiomaInicial(): string {
  try {
    return localStorage.getItem(IDIOMA_OVERRIDE_KEY) ?? getIdiomaDispositivo()
  } catch {
    return getIdiomaDispositivo()
  }
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
  } catch {}
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
  const [idioma, setIdiomaState] = useState<string>(IDIOMA_DEFAULT)
  const [cache,  setCache]       = useState<Record<string, string>>({})

  useEffect(() => {
    setIdiomaState(getIdiomaInicial())
    setCache(getCacheLocal())

    // Sincronizar cuando otra instancia del hook cambia el idioma
    const handler = (e: Event) => {
      setIdiomaState((e as CustomEvent<string>).detail)
    }
    window.addEventListener(IDIOMA_EVENT, handler)
    return () => window.removeEventListener(IDIOMA_EVENT, handler)
  }, [])

  /** Cambia el idioma, persiste en localStorage y notifica a todas las instancias del hook */
  const setIdioma = useCallback((lang: string) => {
    try { localStorage.setItem(IDIOMA_OVERRIDE_KEY, lang) } catch {}
    setIdiomaState(lang)
    window.dispatchEvent(new CustomEvent(IDIOMA_EVENT, { detail: lang }))
  }, [])

  const t = useCallback(
    async (texto: string): Promise<string> => {
      if (!texto || idioma === IDIOMA_DEFAULT) return texto

      const key = cacheKey(texto, idioma)

      if (cache[key]) return cache[key]

      const traduccion = await traducirRemoto(texto, idioma)

      const nuevoCache = { ...cache, [key]: traduccion }
      setCache(nuevoCache)
      setCacheLocal(nuevoCache)

      return traduccion
    },
    [idioma, cache],
  )

  return { t, idioma, setIdioma }
}
