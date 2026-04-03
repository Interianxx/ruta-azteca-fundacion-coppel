'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { MapView, CATEGORIA_COLOR, CATEGORIA_LUCIDE } from '@/components/Map/MapView'
import type { Negocio, CategoriaSlug } from '@/types/negocio'
import { LayoutGrid, Utensils, Palette, BedDouble, Map, Bus, Store, Compass, Heart, Navigation2, User } from 'lucide-react'

// ─── Config ────────────────────────────────────────────────────────────────

const CATS: { slug: CategoriaSlug | ''; label: string; icon: React.ReactNode }[] = [
  { slug: '',            label: 'Todos',      icon: <LayoutGrid size={14} /> },
  { slug: 'comida',      label: 'Fondas',     icon: <Utensils   size={14} /> },
  { slug: 'artesanias',  label: 'Artesanos',  icon: <Palette    size={14} /> },
  { slug: 'hospedaje',   label: 'Hostales',   icon: <BedDouble  size={14} /> },
  { slug: 'tours',       label: 'Guías',      icon: <Map        size={14} /> },
  { slug: 'transporte',  label: 'Transporte', icon: <Bus        size={14} /> },
  { slug: 'otro',        label: 'Otro',       icon: <Store      size={14} /> },
]

// ─── SVG icons ─────────────────────────────────────────────────────────────

const SearchIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
const MicIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
const StarIcon    = ({ size = 12 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#C5A044" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const VerifiedBadge = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#1A9E78" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const BackIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const RouteIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>
const ClockIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const CloseIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChatFabIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SendIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
const ShareIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2E26" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
const PersonIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const BookmarkIcon  = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#0D7C66' : 'none'} stroke={filled ? '#0D7C66' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)


// ─── Types ──────────────────────────────────────────────────────────────────

interface Resena {
  id: string; negocioId: string; userId: string; userName: string
  userImage?: string; calificacion: number; comentario: string; createdAt: string
}

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <svg width="28" height="28" viewBox="0 0 24 24"
            fill={n <= (hover || value) ? '#C5A044' : 'none'}
            stroke={n <= (hover || value) ? '#C5A044' : '#ccc'} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

// ─── Detail bottom sheet ────────────────────────────────────────────────────

function DetailSheet({ negocio, session, isDesktop, onBack, onRoute, onFullPage }: {
  negocio: Negocio
  session: ReturnType<typeof useSession>['data']
  isDesktop: boolean
  onBack: () => void
  onRoute: () => void
  onFullPage: () => void
}) {
  const color   = CATEGORIA_COLOR[negocio.categoria] ?? '#1A9E78'
  const CatIcon = CATEGORIA_LUCIDE[negocio.categoria] ?? Store
  const cat     = CATS.find(c => c.slug === negocio.categoria)

  const [isFav,        setIsFav]       = useState(false)
  const [favLoading,   setFavLoading]  = useState(false)
  const [resenas,      setResenas]     = useState<Resena[]>([])
  const [showForm,     setShowForm]    = useState(false)
  const [stars,        setStars]       = useState(0)
  const [comentario,   setComentario]  = useState('')
  const [submitting,   setSubmitting]  = useState(false)
  const [submitMsg,    setSubmitMsg]   = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Fetch favorites status + reviews on mount
  useEffect(() => {
    fetch(`/api/resenas?negocioId=${negocio.id}`)
      .then(r => r.json())
      .then(j => setResenas(j.data ?? []))
      .catch(() => {})

    if (session) {
      fetch('/api/favoritos')
        .then(r => r.json())
        .then(j => setIsFav((j.data ?? []).includes(negocio.id)))
        .catch(() => {})
    }
  }, [negocio.id, session])

  const toggleFav = async () => {
    if (!session) return
    setFavLoading(true)
    try {
      const method = isFav ? 'DELETE' : 'POST'
      await fetch('/api/favoritos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocio.id }),
      })
      setIsFav(prev => !prev)
    } finally {
      setFavLoading(false)
    }
  }

  const submitResena = async () => {
    if (stars === 0 || !comentario.trim()) return
    setSubmitting(true)
    try {
      const res  = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocio.id, calificacion: stars, comentario }),
      })
      if (res.ok) {
        const newResena: Resena = {
          id: Date.now().toString(),
          negocioId: negocio.id,
          userId: '',
          userName: session?.user?.name ?? 'Tú',
          userImage: session?.user?.image ?? undefined,
          calificacion: stars,
          comentario: comentario.trim(),
          createdAt: new Date().toISOString(),
        }
        setResenas(prev => [newResena, ...prev])
        setShowForm(false)
        setStars(0)
        setComentario('')
        setSubmitMsg('¡Gracias por tu reseña!')
        setTimeout(() => setSubmitMsg(''), 3000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const avgCal = resenas.length
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : negocio.calificacion?.toFixed(1)

  return (
    <div style={{
      position: 'absolute', bottom: isDesktop ? 0 : 20, left: 0, right: 0,
      background: '#fff', borderRadius: '20px 20px 0 0',
      padding: '8px 20px 36px',
      boxShadow: '0 -4px 24px rgba(0,0,0,.12)',
      zIndex: 30, maxHeight: '72vh', overflowY: 'auto',
    }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 12px' }} />

      {/* Back + Fav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8a9690', fontSize: 13, padding: 0,
        }}>
          <BackIcon /> Volver al mapa
        </button>
        <button onClick={toggleFav} disabled={!session || favLoading} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: isFav ? '#fff0f0' : '#f2f1ee',
          cursor: session ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill={isFav ? '#e53e3e' : 'none'}
            stroke={isFav ? '#e53e3e' : '#8a9690'} strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && negocio.imagenUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={negocio.imagenUrl}
            alt={negocio.nombre}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '92vw', maxHeight: '80vh',
              borderRadius: 16, objectFit: 'contain',
              boxShadow: '0 8px 40px rgba(0,0,0,.6)',
            }}
          />
        </div>
      )}

      {/* Hero */}
      <div style={{
        width: '100%', height: 150, borderRadius: 14,
        background: `linear-gradient(135deg, ${color}20, ${color}40)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, position: 'relative',
        cursor: negocio.imagenUrl ? 'zoom-in' : 'default',
      }} onClick={() => negocio.imagenUrl && setLightboxOpen(true)}>
        {negocio.imagenUrl
          ? <img src={negocio.imagenUrl} alt={negocio.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
          : <CatIcon size={52} color={color} />
        }
        {negocio.imagenUrl && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,.45)', borderRadius: 8, padding: '4px 6px',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </div>
        )}
        {avgCal && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#fff', borderRadius: 8, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600,
          }}>
            <StarIcon size={14} /> {avgCal}
            {resenas.length > 0 && <span style={{ color: '#8a9690', fontWeight: 400 }}>({resenas.length})</span>}
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2E26' }}>{negocio.nombre}</h2>
        <VerifiedBadge />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px', borderRadius: 8,
          background: `${color}18`, color: color,
          fontSize: 12, fontWeight: 600,
        }}>{cat?.label ?? negocio.categoria}</span>
        <span style={{ fontSize: 12, color: '#8a9690', display: 'flex', alignItems: 'center', gap: 3 }}>
          <ClockIcon /> {negocio.direccion.split(',')[0]}
        </span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#4a5a52', lineHeight: 1.6 }}>
        {negocio.descripcion}
      </p>

      {negocio.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {negocio.tags.map(t => (
            <span key={t} style={{
              padding: '4px 12px', borderRadius: 20,
              background: '#f2f1ee', color: '#5a6a62', fontSize: 12,
            }}>{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={onRoute} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
          border: 'none', borderRadius: 14, cursor: 'pointer',
          color: '#fff', fontWeight: 600, fontSize: 15,
        }}>
          <RouteIcon /> Cómo llegar
        </button>
        <button onClick={onFullPage} style={{
          width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f2f1ee', border: 'none', borderRadius: 14, cursor: 'pointer',
        }}>
          <ShareIcon />
        </button>
      </div>

      {/* ── Reseñas ── */}
      <div style={{ borderTop: '1px solid #f2f1ee', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A2E26' }}>
            Reseñas {resenas.length > 0 && `(${resenas.length})`}
          </span>
          {session
            ? <button onClick={() => setShowForm(f => !f)} style={{
                padding: '6px 14px', borderRadius: 20,
                background: showForm ? '#f2f1ee' : 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                border: 'none', cursor: 'pointer',
                color: showForm ? '#4a5a52' : '#fff', fontSize: 13, fontWeight: 600,
              }}>
                {showForm ? 'Cancelar' : '+ Escribir reseña'}
              </button>
            : <span style={{ fontSize: 12, color: '#8a9690' }}>Inicia sesión para reseñar</span>
          }
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            background: '#faf9f6', borderRadius: 14, padding: '16px',
            marginBottom: 16, border: '1px solid #e0ddd5',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#1A2E26' }}>Tu calificación</p>
            <StarPicker value={stars} onChange={setStars} />
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Cuéntanos tu experiencia..."
              rows={3}
              style={{
                width: '100%', marginTop: 12, padding: '10px 12px',
                border: '1px solid #e0ddd5', borderRadius: 10,
                fontSize: 14, resize: 'none', outline: 'none',
                background: '#fff', color: '#1A2E26', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={submitResena}
              disabled={submitting || stars === 0 || !comentario.trim()}
              style={{
                marginTop: 10, width: '100%', padding: '12px',
                background: stars > 0 && comentario.trim() ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#e0ddd5',
                border: 'none', borderRadius: 12, cursor: stars > 0 && comentario.trim() ? 'pointer' : 'default',
                color: stars > 0 && comentario.trim() ? '#fff' : '#aaa',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {submitting ? 'Enviando…' : 'Publicar reseña'}
            </button>
          </div>
        )}

        {submitMsg && (
          <div style={{ padding: '10px 14px', background: '#e6f7f0', borderRadius: 10, marginBottom: 12, fontSize: 13, color: '#0D7C66', fontWeight: 600 }}>
            {submitMsg}
          </div>
        )}

        {/* Reviews list */}
        {resenas.length === 0 && !showForm && (
          <p style={{ fontSize: 13, color: '#8a9690', textAlign: 'center', padding: '16px 0' }}>
            Sin reseñas todavía. ¡Sé el primero!
          </p>
        )}
        {resenas.map(r => (
          <div key={r.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f2f1ee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {r.userImage
                  ? <img src={r.userImage} alt={r.userName} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{r.userName[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26' }}>{r.userName}</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="11" height="11" viewBox="0 0 24 24"
                      fill={n <= r.calificacion ? '#C5A044' : '#e0ddd5'} stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#8a9690' }}>
                {new Date(r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#4a5a52', lineHeight: 1.55 }}>{r.comentario}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Routing overlay ────────────────────────────────────────────────────────

function RoutingOverlay({ negocio, onClose }: { negocio: Negocio; onClose: () => void }) {
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${negocio.lat},${negocio.lng}`
  const wazeUrl   = `https://waze.com/ul?ll=${negocio.lat},${negocio.lng}&navigate=yes`

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#fff', borderRadius: '20px 20px 0 0',
      padding: '8px 20px 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,.12)', zIndex: 35,
    }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 14px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1A2E26' }}>Ruta a {negocio.nombre}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690' }}><CloseIcon /></button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '🚶', label: 'A pie',   time: '~5 min' },
          { icon: '🚗', label: 'Auto',    time: '~2 min' },
          { icon: '🚇', label: 'Metro',   time: '~8 min' },
        ].map((m, i) => (
          <div key={m.label} style={{
            flex: 1, padding: '10px', borderRadius: 12, textAlign: 'center',
            background: i === 0 ? '#0D7C6612' : '#f8f7f4',
            border: i === 0 ? '2px solid #0D7C66' : '1px solid #eee',
          }}>
            <div style={{ fontSize: 18 }}>{m.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2E26' }}>{m.time}</div>
            <div style={{ fontSize: 11, color: '#8a9690' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
          borderRadius: 14, color: '#fff', fontWeight: 600, fontSize: 15,
          textDecoration: 'none',
        }}>
          🗺 Google Maps
        </a>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', background: '#33CCFF',
          borderRadius: 14, color: '#fff', fontWeight: 600, fontSize: 15,
          textDecoration: 'none',
        }}>
          🚗 Waze
        </a>
      </div>
    </div>
  )
}

// ─── Chat panel ─────────────────────────────────────────────────────────────

type ChatMsg = { from: 'bot' | 'user'; text: string }

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs]       = useState<ChatMsg[]>([
    { from: 'bot', text: '¡Hola! Soy tu guía de Ruta Azteca. ¿Qué experiencia buscas hoy?' },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMsgs(prev => [...prev, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const historial = msgs.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: text, historial }),
      })
      const json = await res.json()
      setMsgs(prev => [...prev, { from: 'bot', text: json.data?.respuesta ?? 'Lo siento, intenta de nuevo.' }])
    } catch {
      setMsgs(prev => [...prev, { from: 'bot', text: 'Error de conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'absolute', bottom: 160, right: 16, left: 16,
      background: '#fff', borderRadius: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      zIndex: 40, display: 'flex', flexDirection: 'column',
      maxHeight: '60vh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
        borderRadius: '20px 20px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🐍</div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Asistente Ruta Azteca</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
          <CloseIcon />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: m.from === 'user' ? '#0D7C66' : '#f2f1ee',
            color: m.from === 'user' ? '#fff' : '#1A2E26',
            fontSize: 14, lineHeight: 1.5,
          }}>{m.text}</div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px', background: '#f2f1ee',
            color: '#8a9690', fontSize: 14,
          }}>Escribiendo…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderTop: '1px solid #eee',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="¿Qué buscas hoy?"
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px',
            border: '1px solid #e0ddd5', borderRadius: 12,
            fontSize: 14, outline: 'none', background: '#faf9f6',
          }}
        />
        <button onClick={send} disabled={loading} style={{
          width: 40, height: 40, borderRadius: 12,
          background: '#0D7C66', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', opacity: loading ? 0.6 : 1,
        }}>
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MapaPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [negocios,    setNegocios]    = useState<Negocio[]>([])
  const [selected,    setSelected]    = useState<Negocio | null>(null)
  const [categoria,   setCategoria]   = useState<CategoriaSlug | ''>('')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [showDetail,  setShowDetail]  = useState(false)
  const [showRoute,   setShowRoute]   = useState(false)
  const [showChat,    setShowChat]    = useState(false)
  const [showProfile,    setShowProfile]    = useState(false)
  const [showFavoritos,  setShowFavoritos]  = useState(false)
  const [favIds,         setFavIds]         = useState<string[]>([])
  const [favNegocios,    setFavNegocios]    = useState<Negocio[]>([])
  const [listening,      setListening]      = useState(false)
  // bottom sheet state: 'peek' | 'half' | 'full'
  const [sheetState,     setSheetState]     = useState<'peek' | 'half' | 'full'>('peek')
  const [isDesktop,      setIsDesktop]      = useState(false)
  const [activeTab,      setActiveTab]      = useState<string>('explorar')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const fetchNegocios = useCallback(async (cat: CategoriaSlug | '') => {
    setLoading(true)
    try {
      const url  = cat ? `/api/negocios?categoria=${cat}` : '/api/negocios'
      const res  = await fetch(url)
      const json = await res.json()
      setNegocios(json.data?.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNegocios(categoria) }, [categoria, fetchNegocios])

  // Prefetch favoritos en background cuando hay sesión
  useEffect(() => {
    if (!session) return
    fetch('/api/favoritos')
      .then(r => r.json())
      .then(async json => {
        const ids: string[] = json.data ?? []
        setFavIds(ids)
        const items = await Promise.all(
          ids.map(id =>
            fetch(`/api/negocios/${id}`).then(r => r.json()).then(j => j.data as Negocio).catch(() => null)
          )
        )
        setFavNegocios(items.filter(Boolean) as Negocio[])
      })
      .catch(() => {})
  }, [session])

  const filtered = search
    ? negocios.filter(n =>
        n.nombre.toLowerCase().includes(search.toLowerCase()) ||
        n.descripcion?.toLowerCase().includes(search.toLowerCase()),
      )
    : negocios

  const handleSelect = useCallback((negocio: Negocio) => {
    setSelected(negocio)
    setShowDetail(true)
    setShowRoute(false)
    setShowChat(false)
  }, [])

  const handleBack = () => {
    setShowDetail(false)
    setShowRoute(false)
    setSelected(null)
  }

  // Voz (Web Speech API)
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-MX'
    recognition.onstart  = () => setListening(true)
    recognition.onend    = () => setListening(false)
    recognition.onresult = (e: any) => setSearch(e.results[0][0].transcript)
    recognition.start()
  }

  const openFavoritos = () => {
    if (!session) { router.push('/login'); return }
    setShowFavoritos(true)
  }

  const SHEET_HEIGHTS = { peek: 72, half: 340, full: Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600) }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex' }}>
      <style>{`
        .img-thumb { overflow: hidden; }
        .img-thumb img { transition: transform .35s ease; }
        .img-thumb:hover img { transform: scale(1.18); }
      `}</style>

      {/* ── Desktop left panel ── */}
      {isDesktop && (
        <div style={{
          width: 380, flexShrink: 0, height: '100vh',
          background: '#fff', display: 'flex', flexDirection: 'column',
          boxShadow: '2px 0 16px rgba(0,0,0,.10)', zIndex: 20, position: 'relative',
        }}>
          {/* Panel header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0efeb', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
              <VerifiedBadge />
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8a9690', fontWeight: 500 }}>CDMX</span>
              <button onClick={() => setShowProfile(true)} style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', padding: 0, background: session?.user?.image ? 'transparent' : session ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#f2f1ee', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {session?.user?.image
                  ? <img src={session.user.image} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : session?.user?.name
                    ? <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{session.user.name[0].toUpperCase()}</span>
                    : <PersonIcon />
                }
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 8px 14px', background: '#f7f6f2', borderRadius: 12, border: '1px solid #e8e6e0' }}>
                <span style={{ color: '#8a9690', display: 'flex' }}><SearchIcon /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Escape' && setSearch('')}
                  placeholder="Buscar negocios locales..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1A2E26' }}
                />
                {search.trim()
                  ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  : <button onClick={startVoice} style={{ width: 32, height: 32, borderRadius: 8, background: listening ? '#D85A30' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: listening ? '#fff' : '#4a5a52' }}>
                      <MicIcon />
                    </button>
                }
              </div>
              {/* Desktop search dropdown */}
              {search.trim() && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 8px 20px rgba(0,0,0,.12)', overflow: 'hidden', maxHeight: 260, overflowY: 'auto', zIndex: 10, border: '1px solid #f0efeb', borderTop: 'none' }}>
                  {filtered.slice(0, 7).map((n, i) => {
                    const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                    const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                    return (
                      <button key={n.id} onClick={() => { handleSelect(n); setSearch('') }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid #f7f6f2' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={14} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</div>
                          <div style={{ fontSize: 11, color: '#8a9690' }}>{n.direccion.split(',')[0]}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {CATS.map(cat => (
                <button key={cat.slug} onClick={() => setCategoria(cat.slug as CategoriaSlug | '')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, flexShrink: 0, background: categoria === cat.slug ? '#0D7C66' : '#f7f6f2', color: categoria === cat.slug ? '#fff' : '#4a5a52', border: categoria === cat.slug ? 'none' : '1px solid #e8e6e0', cursor: 'pointer', fontSize: 12, fontWeight: categoria === cat.slug ? 600 : 400 }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div style={{ padding: '10px 16px 6px', fontSize: 12, color: '#8a9690', fontWeight: 500, flexShrink: 0 }}>
            {loading ? 'Cargando…' : `${filtered.length} negocios verificados cerca de ti`}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(n => {
              const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
              const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
              const isSelected = selected?.id === n.id
              return (
                <button key={n.id} onClick={() => handleSelect(n)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isSelected ? '#f0fdf8' : '#fff', borderRadius: 12, border: isSelected ? '1.5px solid #0D7C66' : '1px solid #f0efeb', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: isSelected ? '0 2px 8px rgba(13,124,102,.15)' : '0 1px 3px rgba(0,0,0,.05)' }}>
                  <div className="img-thumb" style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n.imagenUrl
                      ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <CatIcon size={20} color={color} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</span>
                      <VerifiedBadge />
                    </div>
                    <div style={{ fontSize: 11, color: '#8a9690', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.direccion.split(',')[0]}</div>
                    {n.calificacion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StarIcon size={11} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                        {n.totalReviews && <span style={{ fontSize: 11, color: '#8a9690' }}>({n.totalReviews})</span>}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Map area ── */}
      <div style={{ flex: 1, position: 'relative', height: '100vh' }}>
        <MapView negocios={filtered} onSelect={handleSelect} selected={selected} />

      {/* ── Overlay para cerrar al tocar el mapa ── */}
      {(showDetail || showChat || (!isDesktop && sheetState !== 'peek')) && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 19, cursor: 'default' }}
          onClick={() => {
            if (showDetail) { setShowDetail(false); setShowRoute(false); setSelected(null) }
            else if (showChat) setShowChat(false)
            else if (!isDesktop && sheetState !== 'peek') setSheetState('peek')
          }}
        />
      )}

      {/* ── Top bar (mobile only) ── */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20, display: isDesktop ? 'none' : undefined }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0D7C66', letterSpacing: '0.06em', textShadow: '0 1px 3px rgba(255,255,255,.8)' }}>
            RUTA AZTECA
          </span>
          <VerifiedBadge />
          <span style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,.9)', fontSize: 10, color: '#8a9690', fontWeight: 500 }}>
            CDMX
          </span>
        </div>

        {/* Search — Google Maps style with avatar inside */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: '6px 6px 6px 16px',
            background: 'rgba(255,255,255,.97)',
            borderRadius: search.trim() && filtered.length > 0 ? '20px 20px 0 0' : 28,
            boxShadow: '0 2px 14px rgba(0,0,0,.13)',
          }}>
            <span style={{ color: '#8a9690', display: 'flex', marginRight: 10 }}><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearch('')}
              placeholder="Buscar negocios locales..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1A2E26' }}
            />
            {search.trim() && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690', display: 'flex', padding: '0 4px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            <button
              onClick={startVoice}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: listening ? '#D85A30' : 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: listening ? '#fff' : '#4a5a52', flexShrink: 0,
              }}
            >
              <MicIcon />
            </button>
            <div style={{ width: 1, height: 22, background: '#e0ddd5', flexShrink: 0, margin: '0 6px' }} />
            <button
              onClick={() => setShowProfile(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', padding: 0,
                background: session?.user?.image ? 'transparent' : session ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#f2f1ee',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 2,
              }}
            >
              {session?.user?.image
                ? <img src={session.user.image} alt={session.user.name ?? ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : session?.user?.name
                  ? <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{session.user.name[0].toUpperCase()}</span>
                  : <span style={{ color: '#8a9690', display: 'flex' }}><PersonIcon /></span>
              }
            </button>
          </div>

          {/* ── Search dropdown ── */}
          {search.trim() && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff',
              borderRadius: '0 0 20px 20px',
              boxShadow: '0 8px 20px rgba(0,0,0,.12)',
              overflow: 'hidden',
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 30,
            }}>
              {filtered.slice(0, 7).map((n, i) => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                return (
                  <button
                    key={n.id}
                    onClick={() => { handleSelect(n); setSearch('') }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', background: 'none', border: 'none',
                      borderTop: i > 0 ? '1px solid #f2f1ee' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CatIcon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#8a9690', marginTop: 1 }}>
                        {n.direccion.split(',')[0]}
                      </div>
                    </div>
                    <VerifiedBadge />
                  </button>
                )
              })}
              {filtered.length > 7 && (
                <div style={{ padding: '8px 16px', fontSize: 12, color: '#8a9690', textAlign: 'center', borderTop: '1px solid #f2f1ee' }}>
                  +{filtered.length - 7} resultados más — sigue escribiendo para filtrar
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category pills (mobile only) ── */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0,
        zIndex: 15, padding: '0 12px',
        display: isDesktop ? 'none' : 'flex', gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {CATS.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setCategoria(cat.slug as CategoriaSlug | '')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20, flexShrink: 0,
              background: categoria === cat.slug ? '#0D7C66' : 'rgba(255,255,255,.92)',
              color:      categoria === cat.slug ? '#fff'     : '#4a5a52',
              border:     categoria === cat.slug ? 'none'     : '1px solid #e0ddd5',
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: categoria === cat.slug ? 600 : 400,
              boxShadow: categoria === cat.slug
                ? '0 2px 8px rgba(13,124,102,.3)'
                : '0 1px 4px rgba(0,0,0,.05)',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {!isDesktop && !showDetail && !showRoute && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 25,
          height: sheetState === 'peek' ? 80 : sheetState === 'half' ? 340 : '85vh',
          transition: 'height .35s cubic-bezier(.4,0,.2,1)',
          background: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,.13)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Drag handle + header */}
          <div
            onClick={() => setSheetState(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')}
            style={{ padding: '10px 16px 8px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>
                {loading ? 'Cargando…' : `${filtered.length} negocios verificados`}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9690" strokeWidth="2" strokeLinecap="round">
                {sheetState === 'full'
                  ? <polyline points="6 9 12 15 18 9" />
                  : <polyline points="18 15 12 9 6 15" />
                }
              </svg>
            </div>
          </div>

          {/* Scrollable list */}
          {sheetState !== 'peek' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(n => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                const isSel   = selected?.id === n.id
                return (
                  <button key={n.id} onClick={() => handleSelect(n)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', background: isSel ? '#f0fdf8' : '#fff',
                      borderRadius: 14, border: isSel ? '1.5px solid #0D7C66' : '1px solid #f0efeb',
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: '0 1px 4px rgba(0,0,0,.06)', flexShrink: 0,
                    }}>
                    <div className="img-thumb" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n.imagenUrl
                        ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : <CatIcon size={22} color={color} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</span>
                        <VerifiedBadge />
                      </div>
                      <div style={{ fontSize: 11, color: '#8a9690', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.direccion.split(',')[0]}</div>
                      {n.calificacion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarIcon size={11} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0bbb4" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detail sheet ── */}
      {showDetail && selected && (
        <DetailSheet
          negocio={selected}
          session={session}
          isDesktop={isDesktop}
          onBack={handleBack}
          onRoute={() => { setShowDetail(false); setShowRoute(true) }}
          onFullPage={() => router.push(`/turista/negocio/${selected.id}`)}
        />
      )}

      {/* ── Routing overlay ── */}
      {showRoute && selected && (
        <RoutingOverlay negocio={selected} onClose={handleBack} />
      )}

      {/* ── Chat panel ── */}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}

      {/* ── Favoritos panel ── */}
      {showFavoritos && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowFavoritos(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: '#f7f6f2', borderRadius: '20px 20px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,.14)' }}
          >
            {/* Header */}
            <div style={{ padding: '8px 20px 0', background: '#fff', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0f7f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookmarkIcon filled />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2E26' }}>Guardados</div>
                  <div style={{ fontSize: 12, color: '#8a9690' }}>{`${favNegocios.length} lugar${favNegocios.length !== 1 ? 'es' : ''}`}</div>
                </div>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 32px' }}>
              {favNegocios.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1A2E26', marginBottom: 6 }}>Sin lugares guardados</div>
                  <div style={{ fontSize: 13, color: '#8a9690' }}>Dale ❤️ a un negocio para guardarlo aquí</div>
                </div>
              )}

              {favNegocios.map(n => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                return (
                  <button
                    key={n.id}
                    onClick={() => { setShowFavoritos(false); handleSelect(n) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', background: '#fff', border: 'none',
                      borderRadius: 14, marginBottom: 10, cursor: 'pointer', textAlign: 'left',
                      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
                    }}
                  >
                    <div className="img-thumb" style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {n.imagenUrl
                        ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : <CatIcon size={22} color={color} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.nombre}
                        </span>
                        <VerifiedBadge />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {n.calificacion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <StarIcon size={11} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                          </div>
                        )}
                        <span style={{ fontSize: 12, color: '#8a9690' }}>· {n.direccion.split(',')[0]}</span>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0bbb4" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Profile panel ── */}
      {showProfile && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowProfile(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '8px 24px 44px', boxShadow: '0 -4px 24px rgba(0,0,0,.14)' }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 22px' }} />
            {session ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14, flexShrink: 0, border: '3px solid #e0f7f1',
                  }}>
                    {session.user?.image
                      ? <img src={session.user.image} alt={session.user.name ?? ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fff', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                          {(session.user?.name ?? session.user?.email ?? '?')[0].toUpperCase()}
                        </span>
                    }
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26', textAlign: 'center' }}>
                    {session.user?.name ?? 'Turista'}
                  </div>
                  {session.user?.email && (
                    <div style={{ fontSize: 13, color: '#8a9690', marginTop: 4 }}>{session.user.email}</div>
                  )}
                </div>
                <button
                  onClick={() => { setShowProfile(false); openFavoritos() }}
                  style={{
                    width: '100%', padding: '15px', background: '#f0fdf8',
                    border: '1.5px solid #b2f0de', borderRadius: 14, marginBottom: 10,
                    fontSize: 15, fontWeight: 600, color: '#0D7C66', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <BookmarkIcon filled /> Mis guardados
                </button>
                <button
                  onClick={() => { setShowProfile(false); signOut({ callbackUrl: '/api/auth/logout' }) }}
                  style={{
                    width: '100%', padding: '15px', background: '#fff6f6',
                    border: '1.5px solid #fcc', borderRadius: 14,
                    fontSize: 15, fontWeight: 600, color: '#C53030', cursor: 'pointer',
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: '50%', background: '#f2f1ee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14, color: '#8a9690',
                  }}>
                    <PersonIcon />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26' }}>Explorador anónimo</div>
                  <div style={{ fontSize: 13, color: '#8a9690', marginTop: 4, textAlign: 'center' }}>
                    Inicia sesión para personalizar tu experiencia
                  </div>
                </div>
                <button
                  onClick={() => { setShowProfile(false); router.push('/login') }}
                  style={{
                    width: '100%', padding: '15px',
                    background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                    border: 'none', borderRadius: 14,
                    fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  }}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom navigation bar (mobile only) ── */}
      {!isDesktop && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: '#fff', borderTop: '1px solid #f0efeb',
          display: 'flex', alignItems: 'stretch',
          zIndex: 35, boxShadow: '0 -2px 10px rgba(0,0,0,.08)',
        }}>
          {[
            { key: 'explorar',  label: 'Explorar',  Icon: Compass,     action: () => setActiveTab('explorar') },
            { key: 'favoritos', label: 'Favoritos', Icon: Heart,       action: () => { setActiveTab('favoritos'); openFavoritos() } },
            { key: 'rutas',     label: 'Rutas',     Icon: Navigation2, action: () => setActiveTab('rutas') },
          ].map(({ key, label, Icon, action }) => (
            <button key={key} onClick={action} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === key ? '#0D7C66' : '#8a9690',
              transition: 'color .2s',
            }}>
              <Icon size={22} />
              <span style={{ fontSize: 10, fontWeight: activeTab === key ? 700 : 400 }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── FAB chat ── */}
      {!showChat && !showDetail && !showRoute && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'absolute',
            bottom: isDesktop ? 44 : 160,
            right: 16,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(13,124,102,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 20, transition: 'bottom .3s',
          }}
        >
          <ChatFabIcon />
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#C5A044', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>IA</span>
          </div>
        </button>
      )}
      </div>
    </div>
  )
}
