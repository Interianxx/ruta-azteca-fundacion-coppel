'use client'

import { useState } from 'react'

interface Props { onResult: (texto: string) => void }

export function VoiceSearch({ onResult }: Props) {
  const [escuchando, setEscuchando] = useState(false)

  function iniciar() {
    // Intentar Web Speech API primero (sin costo)
    type SpeechRecognitionCtor = new () => SpeechRecognition
    const SpeechRecognition: SpeechRecognitionCtor | undefined =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'
      recognition.onresult = (e) => onResult(e.results[0][0].transcript)
      recognition.onend    = () => setEscuchando(false)
      recognition.start()
      setEscuchando(true)
    } else {
      // TODO: fallback a AWS Transcribe vía /api/voz
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
