'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Msg { from: 'user' | 'bot'; text: string }

const SUGERENCIAS = [
  '¿Dónde puedo comer tacos auténticos cerca del centro?',
  '¿Qué artesanías típicas puedo comprar en CDMX?',
  '¿Cómo llego al Zócalo desde el aeropuerto?',
  '¿Qué hostal económico recomiendan en Coyoacán?',
]

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function ChatPage() {
  const router = useRouter()

  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: '¡Hola! Soy tu asistente de Ruta Azteca 🐍\n\nPuedo ayudarte a encontrar negocios locales, recomendarte lugares auténticos y responder cualquier duda sobre tu visita a México. ¿En qué te puedo ayudar?' },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = useCallback(async (texto?: string) => {
    const text = (texto ?? input).trim()
    if (!text || loading) return

    setMsgs(prev => [...prev, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      // Build historial excluding the hardcoded greeting (index 0).
      // Bedrock requires: starts with 'user', alternates roles, ends with 'assistant'.
      const raw = msgs.slice(1).map(m => ({
        rol:      m.from === 'user' ? 'user' : 'assistant',
        contenido: m.text,
      }))
      // Remove consecutive same-role entries (can happen on rapid sends)
      const deduped = raw.filter((item, i) => i === 0 || item.rol !== raw[i - 1].rol)
      // Must start with 'user'
      while (deduped.length && deduped[0].rol === 'assistant') deduped.shift()
      // Must end with 'assistant' so appending the new user msg doesn't create consecutive users
      while (deduped.length && deduped[deduped.length - 1].rol === 'user') deduped.pop()
      const historial = deduped
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mensaje: text, historial }),
      })
      const json = await res.json()
      const errMsg =
        json.data?.statusCode === 403 ? 'El servicio de IA no está disponible en este momento.' :
        json.data?.statusCode === 429 ? 'Demasiadas solicitudes seguidas. Espera unos segundos e intenta de nuevo.' :
        'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.'
      setMsgs(prev => [...prev, {
        from: 'bot',
        text: json.data?.respuesta ?? errMsg,
      }])
    } catch {
      setMsgs(prev => [...prev, { from: 'bot', text: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, msgs])

  const showSugerencias = msgs.length === 1  // solo cuando está el mensaje de bienvenida

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f7f6f2',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
        boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,.15)',
            border: 'none',
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>🐍</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Asistente Ruta Azteca
            </div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>
              Powered by Amazon Bedrock
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
          }}>
            {m.from === 'bot' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11,
                }}>🐍</div>
                <span style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>Asistente</span>
              </div>
            )}
            <div style={{
              padding: '11px 15px',
              borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.from === 'user'
                ? 'linear-gradient(135deg, #0D7C66, #1A9E78)'
                : '#fff',
              color:     m.from === 'user' ? '#fff' : '#1A2E26',
              fontSize:  14,
              lineHeight: 1.55,
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
              }}>🐍</div>
              <span style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>Asistente</span>
            </div>
            <div style={{
              padding: '11px 15px',
              borderRadius: '16px 16px 16px 4px',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#0D7C66',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias rápidas (solo al inicio) */}
        {showSugerencias && !loading && (
          <div style={{ alignSelf: 'stretch', marginTop: 4 }}>
            <p style={{ fontSize: 12, color: '#8a9690', marginBottom: 8, textAlign: 'center' }}>
              Prueba preguntando:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGERENCIAS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  textAlign: 'left',
                  background: '#fff',
                  border: '1.5px solid #e0ddd5',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#1A2E26',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                }}>
                  <span>{s}</span>
                  <span style={{ color: '#0D7C66', flexShrink: 0 }}><ArrowIcon /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ────────────────────────────────────────── */}
      <div style={{
        padding: '10px 14px 14px',
        background: '#fff',
        borderTop: '1px solid #eee',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#f7f6f2',
          borderRadius: 16,
          border: '1.5px solid #e0ddd5',
          padding: '6px 6px 6px 14px',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: '#1A2E26',
              outline: 'none',
              minHeight: 28,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #0D7C66, #1A9E78)'
                : '#e0ddd5',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: input.trim() && !loading ? '#fff' : '#aaa',
              transition: 'background .2s, color .2s',
              flexShrink: 0,
            }}
          >
            <SendIcon />
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#b0aa9e', textAlign: 'center', marginTop: 6 }}>
          Respuestas generadas por IA — verifica información importante
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
