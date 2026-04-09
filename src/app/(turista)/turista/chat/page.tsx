'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bot } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface CardItem {
  id: string
  name: string
  description: string
  address: string
  image: string
  rating: number
  tags: string[]
  action: { type: string; target: string }
}
interface CardData { type: 'cards' | 'empty'; title?: string; items?: CardItem[]; message?: string }
interface Msg { from: 'user' | 'bot'; text?: string; cards?: CardData }

function tryParseCards(text: string): CardData | null {
  const attempt = (s: string) => {
    try {
      const p = JSON.parse(s)
      if (p.type === 'cards' || p.type === 'empty') return p as CardData
    } catch { /* not json */ }
    return null
  }
  const direct = attempt(text.trim())
  if (direct) return direct
  const match = text.match(/\{[\s\S]*\}/)
  return match ? attempt(match[0]) : null
}

function StarMini({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#C5A044', fontWeight: 700 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#C5A044"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      {rating.toFixed(1)}
    </span>
  )
}

function CardBubble({ cards, onNavigate }: { cards: CardData; onNavigate: (id: string) => void }) {
  if (cards.type === 'empty') {
    return (
      <div style={{ padding: '11px 15px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.08)', fontSize: 14, color: '#8a9690' }}>
        {cards.message}
      </div>
    )
  }
  return (
    <div>
      {cards.title && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26', marginBottom: 10 }}>{cards.title}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.items?.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.action.target)}
            style={{
              display: 'flex', alignItems: 'stretch', gap: 0,
              background: '#fff', border: '1.5px solid #e8e5de',
              borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,.07)', textAlign: 'left',
              padding: 0, width: '100%',
            }}
          >
            <div style={{
              width: 80, minHeight: 80, flexShrink: 0,
              background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2E26', lineHeight: 1.2 }}>{item.name}</span>
                <StarMini rating={item.rating} />
              </div>
              <span style={{ fontSize: 12, color: '#5a6e67', lineHeight: 1.4 }}>{item.description}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0D7C66" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 11, color: '#8a9690' }}>{item.address}</span>
              </div>
              {item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(13,124,102,0.1)', color: '#0D7C66', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12, color: '#0D7C66' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const SUGERENCIAS: Record<string, string[]> = {
  es: ['¿Dónde puedo comer tacos auténticos cerca del centro?', '¿Qué artesanías típicas puedo comprar en CDMX?', '¿Cómo llego al Zócalo desde el aeropuerto?', '¿Qué hostal económico recomiendan en Coyoacán?'],
  en: ['Where can I eat authentic tacos near the center?', 'What typical crafts can I buy in CDMX?', 'How do I get to the Zócalo from the airport?', 'What affordable hostel do you recommend in Coyoacán?'],
  fr: ["Où puis-je manger des tacos authentiques près du centre?", "Quels artisanats typiques puis-je acheter à CDMX?", "Comment aller au Zócalo depuis l'aéroport?", "Quel auberge économique recommandez-vous à Coyoacán?"],
  pt: ['Onde posso comer tacos autênticos perto do centro?', 'Que artesanatos típicos posso comprar na CDMX?', 'Como chego ao Zócalo do aeroporto?', 'Que hostel econômico recomendam em Coyoacán?'],
  de: ['Wo kann ich authentische Tacos in der Nähe des Zentrums essen?', 'Welche typischen Handwerksprodukte kann ich in CDMX kaufen?', 'Wie komme ich vom Flughafen zum Zócalo?', 'Welche günstige Herberge empfehlen Sie in Coyoacán?'],
}

const UI_CHAT: Record<string, Record<string, string>> = {
  es: { title: 'Asistente Ruta Azteca', powered: 'Powered by Amazon Bedrock', try: 'Prueba preguntando:', placeholder: 'Escribe tu pregunta...', disclaimer: 'Respuestas generadas por IA — verifica información importante', assistant: 'Asistente', greeting: '¡Hola! Soy tu guía de Ruta Azteca.\n\nPuedo ayudarte a encontrar negocios locales, recomendarte lugares auténticos y responder cualquier duda sobre tu visita a México. ¿En qué te puedo ayudar?' },
  en: { title: 'Ruta Azteca Assistant', powered: 'Powered by Amazon Bedrock', try: 'Try asking:', placeholder: 'Type your question...', disclaimer: 'AI-generated answers — verify important information', assistant: 'Assistant', greeting: "Hi! I'm your Ruta Azteca guide.\n\nI can help you find local businesses, recommend authentic spots and answer any questions about your visit to Mexico. How can I help you?" },
  fr: { title: 'Assistant Ruta Azteca', powered: 'Powered by Amazon Bedrock', try: 'Essayez de demander:', placeholder: 'Écrivez votre question...', disclaimer: 'Réponses générées par IA — vérifiez les informations importantes', assistant: 'Assistant', greeting: "Bonjour! Je suis votre guide Ruta Azteca.\n\nJe peux vous aider à trouver des commerces locaux, vous recommander des endroits authentiques et répondre à vos questions. Comment puis-je vous aider?" },
  pt: { title: 'Assistente Ruta Azteca', powered: 'Powered by Amazon Bedrock', try: 'Tente perguntar:', placeholder: 'Escreva sua pergunta...', disclaimer: 'Respostas geradas por IA — verifique informações importantes', assistant: 'Assistente', greeting: 'Olá! Sou seu guia Ruta Azteca.\n\nPosso ajudá-lo a encontrar negócios locais e responder suas dúvidas sobre o México. Como posso ajudá-lo?' },
  de: { title: 'Ruta Azteca Assistent', powered: 'Powered by Amazon Bedrock', try: 'Versuchen Sie zu fragen:', placeholder: 'Schreiben Sie Ihre Frage...', disclaimer: 'KI-generierte Antworten — überprüfen Sie wichtige Informationen', assistant: 'Assistent', greeting: 'Hallo! Ich bin Ihr Ruta Azteca Guide.\n\nIch kann Ihnen helfen, lokale Geschäfte zu finden und Fragen zu Ihrem Mexiko-Besuch zu beantworten. Wie kann ich Ihnen helfen?' },
}

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
  const { idioma } = useTranslation()
  const ui = UI_CHAT[idioma] ?? UI_CHAT.en
  const sugerencias = SUGERENCIAS[idioma] ?? SUGERENCIAS.en

  const [msgs, setMsgs] = useState<Msg[]>([])

  useEffect(() => {
    const u = UI_CHAT[idioma] ?? UI_CHAT.en
    setMsgs([{ from: 'bot' as const, text: u.greeting }])
  }, [idioma])

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
      const raw = msgs.slice(1).map(m => ({
        rol:      m.from === 'user' ? 'user' : 'assistant',
        contenido: m.text ?? (m.cards?.title ?? ''),
      }))
      const deduped = raw.filter((item, i) => i === 0 || item.rol !== raw[i - 1].rol)
      while (deduped.length && deduped[0].rol === 'assistant') deduped.shift()
      while (deduped.length && deduped[deduped.length - 1].rol === 'user') deduped.pop()
      const historial = deduped
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mensaje: text, historial, idioma }),
      })
      const json = await res.json()
      const errMsg =
        json.data?.statusCode === 403 ? 'El servicio de IA no está disponible en este momento.' :
        json.data?.statusCode === 429 ? 'Demasiadas solicitudes seguidas. Espera unos segundos e intenta de nuevo.' :
        'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.'
      const respuesta: string = json.data?.respuesta ?? errMsg
      const cards = tryParseCards(respuesta)
      setMsgs(prev => [...prev, cards ? { from: 'bot', cards } : { from: 'bot', text: respuesta }])
    } catch {
      setMsgs(prev => [...prev, { from: 'bot', text: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, msgs, idioma])

  const showSugerencias = msgs.length === 1

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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
        boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        flexShrink: 0,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{ui.title}</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>{ui.powered}</div>
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: m.cards ? '92%' : '82%' }}>
            {m.from === 'bot' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={13} color="#fff" />
                </div>
                <span style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>{ui.assistant}</span>
              </div>
            )}
            {m.cards ? (
              <CardBubble cards={m.cards} onNavigate={(id) => router.push(`/turista/negocio/${id}`)} />
            ) : (
              <div style={{
                padding: '11px 15px',
                borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.from === 'user' ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#fff',
                color: m.from === 'user' ? '#fff' : '#1A2E26',
                fontSize: 14, lineHeight: 1.55,
                boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={13} color="#fff" />
              </div>
              <span style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>{ui.assistant}</span>
            </div>
            <div style={{
              padding: '11px 15px', borderRadius: '16px 16px 16px 4px',
              background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.08)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#0D7C66',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {showSugerencias && !loading && (
          <div style={{ alignSelf: 'stretch', marginTop: 4 }}>
            <p style={{ fontSize: 12, color: '#8a9690', marginBottom: 8, textAlign: 'center' }}>{ui.try}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sugerencias.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  textAlign: 'left', background: '#fff', border: '1.5px solid #e0ddd5',
                  borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#1A2E26',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,.06)',
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
      <div style={{ padding: '10px 14px 14px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f7f6f2', borderRadius: 16, border: '1.5px solid #e0ddd5',
          padding: '6px 6px 6px 14px',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={ui.placeholder}
            disabled={loading}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#1A2E26', outline: 'none', minHeight: 28 }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: input.trim() && !loading ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#e0ddd5',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: input.trim() && !loading ? '#fff' : '#aaa',
              transition: 'background .2s, color .2s', flexShrink: 0,
            }}
          >
            <SendIcon />
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#b0aa9e', textAlign: 'center', marginTop: 6 }}>{ui.disclaimer}</p>
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
