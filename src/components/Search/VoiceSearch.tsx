'use client'

import { useState } from 'react'

interface Props { onResult: (texto: string) => void }

export function VoiceSearch({ onResult }: Props) {
  const [escuchando, setEscuchando] = useState(false)

  function iniciar() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

    if (SR) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new SR()
      recognition.lang = 'es-MX'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => onResult(e.results[0][0].transcript)
      recognition.onend    = () => setEscuchando(false)
      recognition.start()
      setEscuchando(true)
    } else {
      alert('Tu navegador no soporta reconocimiento de voz')
    }
  }

  return (
    <button
      onClick={iniciar}
      className={`p-2 rounded-full ${escuchando ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}
      aria-label="Buscar por voz"
    >
      🎤
    </button>
  )
}
