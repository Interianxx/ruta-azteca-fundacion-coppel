'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Eye, MessageCircle, Phone, Star, TrendingUp,
  Loader2, ArrowLeft, Globe, CreditCard, ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricasData {
  vistas: number
  calificacion: number | null
  totalReviews: number
  clicks_whatsapp: number
  clicks_telefono: number
}

interface Resena {
  id: string
  userName: string
  userImage?: string
  calificacion: number
  comentario: string
  createdAt: string
}

interface IdiomaData {
  idioma: string
  visitas: number
  porcentaje: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)} días`
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= value ? '#C5A044' : '#e0ddd5'}
          stroke={n <= value ? '#C5A044' : '#e0ddd5'} strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

function SkeletonBar({ width = '100%' }: { width?: string }) {
  return (
    <div style={{ height: 12, borderRadius: 6, background: 'rgba(26,46,38,0.08)', width, overflow: 'hidden' }}>
      <div style={{ height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
    </div>
  )
}

function SkeletonText({ width = '80%', h = 14 }: { width?: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 4, background: 'rgba(26,46,38,0.07)', width, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{ height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
    </div>
  )
}

const IDIOMA_FLAG: Record<string, string> = {
  es: '🇲🇽', en: '🇺🇸', fr: '🇫🇷', pt: '🇧🇷',
  de: '🇩🇪', it: '🇮🇹', ja: '🇯🇵', zh: '🇨🇳',
}
const IDIOMA_LABEL: Record<string, string> = {
  es: 'Español', en: 'Inglés', fr: 'Francés', pt: 'Portugués',
  de: 'Alemán', it: 'Italiano', ja: 'Japonés', zh: 'Chino',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetricasPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [negocioId, setNegocioId]  = useState<string | null>(null)
  const [negocioNombre, setNegocioNombre] = useState('')
  const [metricas, setMetricas]    = useState<MetricasData | null>(null)
  const [resenas, setResenas]      = useState<Resena[]>([])
  const [idiomas, setIdiomas]      = useState<IdiomaData[]>([])
  const [loading, setLoading]      = useState(true)
  const [activeTab, setActiveTab]  = useState<'resumen' | 'resenas' | 'alcance'>('resumen')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }

    const init = async () => {
      try {
        const resMio = await fetch('/api/negocios/mio')
        const dataMio = await resMio.json()
        const id = dataMio.data?.id
        if (!id) { setLoading(false); return }
        setNegocioId(id)
        setNegocioNombre(dataMio.data?.nombre ?? 'Mi Negocio')

        const [resMet, resRes, resIdiomas] = await Promise.allSettled([
          fetch(`/api/negocios/${id}/metricas`).then(r => r.json()),
          fetch(`/api/resenas?negocioId=${id}`).then(r => r.json()),
          fetch('/api/admin/metricas/idiomas').then(r => r.json()),
        ])

        if (resMet.status === 'fulfilled') setMetricas(resMet.value.data ?? null)
        if (resRes.status === 'fulfilled') setResenas(resRes.value.data ?? [])
        if (resIdiomas.status === 'fulfilled') setIdiomas(resIdiomas.value.data?.porIdioma ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [status, router])

  if (status === 'loading' || loading) return (
    <div style={{ background: '#f8faf9', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <Loader2 size={36} color="#0D7C66" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '.1em' }}>Cargando estadísticas…</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const conversion = metricas?.vistas
    ? (((metricas.clicks_whatsapp + metricas.clicks_telefono) / metricas.vistas) * 100).toFixed(1)
    : '0.0'

  const starBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: resenas.filter(r => Math.round(r.calificacion) === star).length,
  }))
  const totalResenas = resenas.length || 1

  return (
    <div style={{ background: '#f8faf9', minHeight: '100dvh', fontFamily: 'var(--font-inter), -apple-system, sans-serif', paddingBottom: 40 }}>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeup { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #04342C 0%, #0D7C66 60%, #1A9E78 100%)',
        padding: '56px 20px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Aura decorativa */}
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '45%', height: '120%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 24,
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>
            <ArrowLeft size={15} /> Volver
          </button>

          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
            Panel del negocio
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {negocioNombre}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, fontWeight: 500 }}>
            Estadísticas de impacto en tiempo real
          </p>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 640, margin: '-44px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>

        {/* ── KPI GRID 2x2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Visualizaciones', value: metricas?.vistas ?? 0, Icon: Eye, color: '#0D7C66', bg: 'rgba(13,124,102,0.08)', sub: 'Turistas que vieron tu negocio' },
            { label: 'Llamadas', value: metricas?.clicks_telefono ?? 0, Icon: Phone, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', sub: 'Clicks en teléfono' },
            { label: 'WhatsApp', value: metricas?.clicks_whatsapp ?? 0, Icon: MessageCircle, color: '#25D366', bg: 'rgba(37,211,102,0.08)', sub: 'Mensajes iniciados' },
            { label: 'Reputación', value: metricas?.calificacion ? `${Number(metricas.calificacion).toFixed(1)} ⭐` : '—', Icon: Star, color: '#C5A044', bg: 'rgba(197,160,68,0.08)', sub: `${metricas?.totalReviews ?? 0} opiniones` },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 20, padding: '18px 16px', boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)', animation: 'fadeup 0.4s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.Icon size={18} color={card.color} />
                </div>
                <TrendingUp size={12} color={card.color} style={{ opacity: 0.35 }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#1A2E26', letterSpacing: '-0.02em', marginBottom: 2 }}>{card.value}</div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: card.color, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: '#8a9690' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ── TASA DE CONVERSIÓN ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>Tasa de conversión</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#0D7C66', letterSpacing: '-0.02em' }}>{conversion}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(13,124,102,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, parseFloat(conversion))}%`, background: 'linear-gradient(90deg, #0D7C66, #1A9E78)', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: '#8a9690', marginTop: 8, marginBottom: 0 }}>
            % de turistas que interactuaron (WhatsApp o llamada) vs. los que visitaron tu perfil.
          </p>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(26,46,38,0.05)', borderRadius: 14, padding: 4 }}>
          {([
            { key: 'resumen', label: '📊 Resumen' },
            { key: 'resenas', label: `⭐ Reseñas ${resenas.length > 0 ? `(${resenas.length})` : ''}` },
            { key: 'alcance', label: '🌍 Alcance' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: activeTab === tab.key ? 800 : 600,
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? '#0D7C66' : '#8a9690',
                boxShadow: activeTab === tab.key ? '0 1px 6px rgba(26,46,38,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: RESUMEN ── */}
        {activeTab === 'resumen' && (
          <div style={{ animation: 'fadeup 0.3s ease' }}>
            {/* Gráfica semanal de vistas (simulada) */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1A2E26' }}>Actividad esta semana</span>
                <span style={{ fontSize: 11, color: '#8a9690', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Vistas</span>
              </div>
              {/* Barras simuladas */}
              {(() => {
                const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy']
                const vals = [3, 7, 5, 12, 8, 15, metricas?.vistas ? Math.min(metricas.vistas, 20) : 4]
                const max  = Math.max(...vals, 1)
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                    {dias.map((d, i) => (
                      <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', height: `${(vals[i] / max) * 70}px`, borderRadius: 6, background: i === 6 ? 'linear-gradient(180deg, #0D7C66, #1A9E78)' : 'rgba(13,124,102,0.15)', transition: 'height 0.8s ease' }} />
                        <span style={{ fontSize: 9, color: i === 6 ? '#0D7C66' : '#8a9690', fontWeight: i === 6 ? 800 : 500 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <p style={{ fontSize: 11, color: '#8a9690', marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
                * Los datos semanales son estimaciones. Pronto con historial completo.
              </p>
            </div>

            {/* Card Pagos - Próximamente */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.04), rgba(255,140,66,0.08))', borderRadius: 20, padding: '18px 20px', marginBottom: 16, border: '1.5px dashed rgba(255,107,0,0.25)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,107,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={22} color="#FF6B00" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2E26', marginBottom: 2 }}>Pagos y ventas</div>
                <div style={{ fontSize: 12, color: '#8a9690', lineHeight: 1.5 }}>Próximamente podrás ver tus ventas, órdenes y ganancias en detalle.</div>
              </div>
              <div style={{ padding: '5px 10px', borderRadius: 20, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', fontSize: 10, fontWeight: 800, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                Pronto
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: RESEÑAS ── */}
        {activeTab === 'resenas' && (
          <div style={{ animation: 'fadeup 0.3s ease' }}>

            {/* Resumen de calificación */}
            {resenas.length > 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 12, boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: '#1A2E26', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {metricas?.calificacion ? Number(metricas.calificacion).toFixed(1) : (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)}
                    </div>
                    <Stars value={Math.round(metricas?.calificacion ?? 0)} size={16} />
                    <div style={{ fontSize: 11, color: '#8a9690', marginTop: 4 }}>{resenas.length} reseñas</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {starBreakdown.map(({ star, count }) => (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: '#8a9690', width: 12, textAlign: 'right' }}>{star}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#C5A044" stroke="#C5A044" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(26,46,38,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(count / totalResenas) * 100}%`, background: '#C5A044', borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#8a9690', width: 16 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, padding: '32px 20px', marginBottom: 12, textAlign: 'center', boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2E26', marginBottom: 6 }}>Aún no tienes reseñas</div>
                <div style={{ fontSize: 13, color: '#8a9690' }}>Cuando los turistas escriban sobre su experiencia, aparecerán aquí.</div>
              </div>
            )}

            {/* Lista de reseñas */}
            {resenas.map((r, i) => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 6px rgba(26,46,38,0.05)', border: '1px solid rgba(26,46,38,0.05)', animation: `fadeup ${0.15 + i * 0.07}s ease` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                    {r.userImage
                      ? <img src={r.userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (r.userName?.[0] ?? '?').toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>{r.userName || 'Turista'}</div>
                    <Stars value={r.calificacion} size={12} />
                  </div>
                  <span style={{ fontSize: 11, color: '#8a9690' }}>{timeAgo(r.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#1A2E26', lineHeight: 1.6, margin: 0 }}>{r.comentario}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: ALCANCE / IDIOMAS ── */}
        {activeTab === 'alcance' && (
          <div style={{ animation: 'fadeup 0.3s ease' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 12, boxShadow: '0 2px 12px rgba(26,46,38,0.07)', border: '1px solid rgba(26,46,38,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(13,124,102,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="#0D7C66" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2E26' }}>Turistas por idioma</div>
                  <div style={{ fontSize: 11, color: '#8a9690' }}>Plataforma completa · actualizado en vivo</div>
                </div>
              </div>

              {idiomas.length > 0 ? (
                idiomas.slice(0, 6).map((item, i) => (
                  <div key={item.idioma} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{IDIOMA_FLAG[item.idioma] ?? '🌐'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>{IDIOMA_LABEL[item.idioma] ?? item.idioma}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0D7C66' }}>{item.porcentaje}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(13,124,102,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.porcentaje}%`, background: `hsl(${160 - i * 12}, 50%, 40%)`, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Skeleton cuando no hay datos
                [
                  { flag: '🇺🇸', label: 'Inglés', w: '68%' },
                  { flag: '🇫🇷', label: 'Francés', w: '14%' },
                  { flag: '🇩🇪', label: 'Alemán', w: '9%' },
                  { flag: '🇧🇷', label: 'Portugués', w: '6%' },
                  { flag: '🇯🇵', label: 'Japonés', w: '3%' },
                ].map(item => (
                  <div key={item.flag} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>{item.label}</span>
                        <SkeletonBar width="30px" />
                      </div>
                      <div style={{ height: 6, background: 'rgba(13,124,102,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: item.w, background: 'linear-gradient(90deg, rgba(13,124,102,0.2), rgba(13,124,102,0.35))', borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {idiomas.length === 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(13,124,102,0.05)', borderRadius: 12, border: '1px solid rgba(13,124,102,0.1)' }}>
                  <p style={{ fontSize: 11, color: '#5a6e67', margin: 0, lineHeight: 1.5 }}>
                    📊 <strong>Vista previa.</strong> Los datos se mostrarán en tiempo real cuando los turistas comiencen a usar la plataforma en tu zona.
                  </p>
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(13,124,102,0.06), rgba(26,158,120,0.1))', borderRadius: 20, padding: '18px 20px', border: '1px solid rgba(13,124,102,0.15)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0D7C66', marginBottom: 10 }}>💡 Consejos para más turistas</div>
              {[
                'Agrega fotos reales de tu negocio para atraer más visitas.',
                'Responde rápido por WhatsApp: los turistas valoran la atención.',
                'Mantén tu horario actualizado para evitar confusión.',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{'✅'}</span>
                  <span style={{ fontSize: 12, color: '#1A2E26', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER INSTITUCIONAL ── */}
        <footer style={{
          marginTop: 16,
          background: 'linear-gradient(135deg, #04342C 0%, #0A5C48 100%)',
          borderRadius: 24,
          padding: '24px 20px 20px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            Con el respaldo de
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <img src="/Fundacion Coppel-WhiteYellow@4x.png" alt="Fundación Coppel"
              style={{ height: 26, width: 'auto', objectFit: 'contain', opacity: 0.92 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
            <img src="/logo-olamexico-full-white@2x.png" alt="Ola México"
              style={{ height: 26, width: 'auto', objectFit: 'contain', opacity: 0.85 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {['Conócenos', 'Contáctanos', 'Aviso de privacidad'].map((label, i) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>}
                <a href="#" style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                  {label}
                </a>
              </span>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '.04em' }}>
            &copy; 2026 Fundación Coppel · Ruta Azteca · FIFA World Cup México
          </p>
        </footer>
      </div>
    </div>
  )
}
