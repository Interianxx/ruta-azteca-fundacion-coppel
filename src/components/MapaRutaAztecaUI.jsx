'use client'
import React, { useState } from 'react'
import {
  Search, Mic, Utensils, Palette, BedDouble, Map, Bus, Store,
  LayoutGrid, Heart, MapPin, User, Navigation, Star, Clock,
  ChevronUp, ChevronDown, X, Share2, MessageCircle, CheckCircle,
  ArrowLeft, Camera, Bookmark, Route,
} from 'lucide-react'

// ─── Google Fonts ────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  primary:   '#0D4F4F',
  accent:    '#E8734A',
  bg:        '#FAFAF7',
  text:      '#1A1A1A',
  muted:     '#6B7280',
  open:      '#059669',
  closed:    '#DC2626',
  gold:      '#F59E0B',
  border:    '#E5E3DD',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const NEGOCIOS = [
  {
    id: '1', nombre: 'La Fonda de Don Memo', categoria: 'comida',
    subtipo: 'Comida Mexicana Tradicional', calificacion: 4.8, totalReviews: 127,
    distanciaM: 180, minutos: 3, abierto: true, horario: '8:00 – 20:00',
    direccion: 'Calle Mesones 47, Centro Histórico',
    descripcion: 'Cocina tradicional mexicana desde 1978. Especialidad en mole negro oaxaqueño y chiles en nogada de temporada. Ambiente familiar auténtico.',
    tags: ['Mole Negro', 'Chiles en Nogada', 'Familiar', 'Desde 1978'],
    color: '#C5A044',
    reseñas: [
      { autor: 'James T.', pais: '🇬🇧', estrellas: 5, texto: "Incredible mole negro! Best I've had in CDMX. Very authentic and affordable.", fecha: 'hace 2 días' },
      { autor: 'Sophie L.', pais: '🇫🇷', estrellas: 5, texto: 'Amazing food, very local experience. The owner speaks some English, very friendly!', fecha: 'hace 1 semana' },
    ],
  },
  {
    id: '2', nombre: 'Artesanías Xóchitl', categoria: 'artesanias',
    subtipo: 'Arte Textil & Cerámica', calificacion: 4.9, totalReviews: 89,
    distanciaM: 350, minutos: 5, abierto: true, horario: '10:00 – 19:00',
    direccion: 'Plaza de la Ciudadela, Local 12',
    descripcion: 'Artesanías oaxaqueñas y textiles zapotecos. Piezas únicas elaboradas por artesanas de Teotitlán del Valle. Envíos internacionales.',
    tags: ['Textiles Zapotecos', 'Barro Negro', 'Hecho a mano'],
    color: '#D85A30',
    reseñas: [
      { autor: 'Marco R.', pais: '🇮🇹', estrellas: 5, texto: 'Beautiful handmade crafts, very knowledgeable owner. Bought a gorgeous tapete!', fecha: 'hace 3 días' },
      { autor: 'Ana K.', pais: '🇩🇪', estrellas: 4, texto: 'Great quality and fair prices. The owner explained the weaving process beautifully.', fecha: 'hace 2 semanas' },
    ],
  },
  {
    id: '3', nombre: 'Hostal Casa Bonita', categoria: 'hospedaje',
    subtipo: 'Hostal Boutique · Centro', calificacion: 4.7, totalReviews: 203,
    distanciaM: 520, minutos: 7, abierto: true, horario: '24 horas',
    direccion: 'Uruguay 109, Centro Histórico',
    descripcion: 'Hostal familiar en casona del siglo XIX restaurada. Incluye desayuno mexicano y tour a pie diario por el Centro Histórico.',
    tags: ['Desayuno incluido', 'Tour diario', 'WiFi rápido'],
    color: '#534AB7',
    reseñas: [
      { autor: 'Lena M.', pais: '🇸🇪', estrellas: 5, texto: 'Perfect location, amazing breakfast, felt like home! The rooftop is magical at sunset.', fecha: 'hace 1 día' },
    ],
  },
  {
    id: '4', nombre: 'Chava Transportes', categoria: 'transporte',
    subtipo: 'Traslados & Tours en Van', calificacion: 4.6, totalReviews: 54,
    distanciaM: 800, minutos: 11, abierto: false, horario: '7:00 – 20:00',
    direccion: 'Base: Venustiano Carranza 45',
    descripcion: 'Traslados aeropuerto CDMX y tours en van por Teotihuacán, Xochimilco y Coyoacán. Precios fijos, conductor bilingüe certificado.',
    tags: ['Aeropuerto', 'Bilingüe', 'Tour Teotihuacán'],
    color: '#185FA5',
    reseñas: [
      { autor: 'Tom H.', pais: '🇺🇸', estrellas: 5, texto: 'Reliable, honest and very knowledgeable driver. Will definitely use again for the World Cup!', fecha: 'hace 5 días' },
    ],
  },
  {
    id: '5', nombre: 'Guía Luis — Tour Histórico', categoria: 'tours',
    subtipo: 'Guía Certificado UNESCO', calificacion: 5.0, totalReviews: 38,
    distanciaM: 290, minutos: 4, abierto: true, horario: '9:00 – 18:00',
    direccion: 'Salida: Metro Zócalo, Salida 2',
    descripcion: 'Tours a pie por Centro Histórico, Tlatelolco y visita a Teotihuacán. Narración en inglés y francés. Grupos pequeños, máx 8 personas.',
    tags: ['UNESCO', 'Inglés & Francés', 'Grupo pequeño'],
    color: '#0D7C66',
    reseñas: [
      { autor: 'Claire B.', pais: '🇨🇦', estrellas: 5, texto: "Luis is incredibly passionate and knowledgeable. Best tour of my entire trip, highly recommend!", fecha: 'hace 4 días' },
    ],
  },
  {
    id: '6', nombre: 'Plata Taxco Joyería', categoria: 'artesanias',
    subtipo: 'Joyería de Plata 925', calificacion: 4.5, totalReviews: 71,
    distanciaM: 440, minutos: 6, abierto: true, horario: '11:00 – 20:00',
    direccion: 'Palma 20, Centro Histórico',
    descripcion: 'Plata taxqueña auténtica certificada. Diseños tradicionales y contemporáneos directamente del taller familiar en Taxco, Guerrero.',
    tags: ['Plata 925', 'Taxco', 'Certificado'],
    color: '#8B5CF6',
    reseñas: [
      { autor: 'Yuki T.', pais: '🇯🇵', estrellas: 5, texto: 'Stunning silver jewelry at very reasonable prices. Authentic and certified. Amazing quality!', fecha: 'hace 1 semana' },
    ],
  },
]

const CATS = [
  { slug: '',           label: 'Todos',      Icon: LayoutGrid },
  { slug: 'comida',     label: 'Fondas',     Icon: Utensils   },
  { slug: 'artesanias', label: 'Artesanos',  Icon: Palette    },
  { slug: 'hospedaje',  label: 'Hostales',   Icon: BedDouble  },
  { slug: 'tours',      label: 'Guías',      Icon: Map        },
  { slug: 'transporte', label: 'Transporte', Icon: Bus        },
  { slug: 'otro',       label: 'Otro',       Icon: Store      },
]

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ value, size = 12 }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= Math.round(value) ? C.gold : '#E5E3DD'} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

// ─── Verified badge ───────────────────────────────────────────────────────────
function VerBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 20,
      background: '#DCFCE7', color: C.open, fontSize: 10, fontWeight: 700,
      letterSpacing: '.02em',
    }}>
      <CheckCircle size={10} fill={C.open} stroke="#fff" /> Verificado
    </span>
  )
}

// ─── Business card ────────────────────────────────────────────────────────────
function BusinessCard({ negocio, onClick, index }) {
  const cat  = CATS.find(c => c.slug === negocio.categoria)
  const Icon = cat?.Icon ?? Store

  return (
    <div
      onClick={() => onClick(negocio)}
      style={{
        background: '#fff', borderRadius: 16, padding: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
        cursor: 'pointer', border: `1px solid ${C.border}`,
        transition: 'transform .15s, box-shadow .15s',
        animation: `fadeIn .35s ease both`,
        animationDelay: `${index * 55}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.11)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.07)' }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${negocio.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={24} color={negocio.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text, lineHeight: 1.25, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {negocio.nombre}
            </span>
            <VerBadge />
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{negocio.subtipo}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Stars value={negocio.calificacion} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{negocio.calificacion.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: C.muted }}>({negocio.totalReviews})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} color={C.muted} />
              {negocio.distanciaM}m · {negocio.minutos} min 🚶
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: negocio.abierto ? '#DCFCE7' : '#FEE2E2',
              color: negocio.abierto ? C.open : C.closed,
            }}>
              {negocio.abierto ? '● Abierto' : '● Cerrado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Map simulation ────────────────────────────────────────────────────────────
function MapArea({ onPinClick }) {
  const pins = [
    { id: '1', x: 30, y: 45, color: '#C5A044' },
    { id: '2', x: 58, y: 58, color: '#D85A30' },
    { id: '3', x: 72, y: 32, color: '#534AB7' },
    { id: '4', x: 22, y: 65, color: '#185FA5' },
    { id: '5', x: 50, y: 25, color: '#0D7C66' },
    { id: '6', x: 65, y: 70, color: '#8B5CF6' },
  ]

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #E8EFE8 0%, #D4E4D4 40%, #E4EDDF 70%, #D8E8D0 100%)',
      }}>
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
          {/* Streets */}
          <rect x="0" y="220" width="390" height="11" fill="#fff" opacity=".72"/>
          <rect x="0" y="350" width="390" height="9" fill="#fff" opacity=".65"/>
          <rect x="0" y="460" width="390" height="13" fill="#fff" opacity=".78"/>
          <rect x="0" y="155" width="390" height="7" fill="#fff" opacity=".52"/>
          <rect x="110" y="0" width="9" height="700" fill="#fff" opacity=".68"/>
          <rect x="230" y="0" width="7" height="700" fill="#fff" opacity=".60"/>
          <rect x="330" y="0" width="11" height="700" fill="#fff" opacity=".72"/>
          <rect x="55" y="0" width="5" height="700" fill="#fff" opacity=".42"/>
          {/* Parks */}
          <rect x="140" y="235" width="80" height="105" rx="10" fill="#A8D5A0" opacity=".55"/>
          <rect x="248" y="90"  width="72" height="55"  rx="8"  fill="#A8D5A0" opacity=".48"/>
          <rect x="20"  y="370" width="80" height="80"  rx="8"  fill="#A8D5A0" opacity=".42"/>
          {/* Blocks */}
          {[
            [20,30,80,115],[128,30,92,115],[248,30,72,115],
            [20,162,80,48],[128,162,92,48],[248,162,72,48],
            [20,235,110,105],[248,235,132,105],
            [20,365,80,85],[128,365,92,85],[248,365,132,85],
          ].map(([x,y,w,h],i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="5" fill="#fff" opacity=".38"/>
          ))}
        </svg>
      </div>

      {/* User dot */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 5 }}>
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: 'rgba(37,99,235,.15)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: '#2563EB', border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(37,99,235,.5)',
          position: 'relative',
        }} />
      </div>

      {/* Pins */}
      {pins.map(p => {
        const n = NEGOCIOS.find(x => x.id === p.id)
        return (
          <div key={p.id}
            onClick={() => n && onPinClick(n)}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-100%)', cursor: 'pointer', zIndex: 4 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50% 50% 50% 0',
              background: p.color, transform: 'rotate(-45deg)',
              boxShadow: '0 3px 10px rgba(0,0,0,.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-45deg) scale(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(-45deg) scale(1)' }}
            >
              <MapPin size={15} color="#fff" style={{ transform: 'rotate(45deg)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Detail view ───────────────────────────────────────────────────────────────
function DetailView({ negocio, onClose }) {
  const [fav, setFav] = useState(false)
  const cat  = CATS.find(c => c.slug === negocio.categoria)
  const Icon = cat?.Icon ?? Store

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: C.bg, overflowY: 'auto',
      animation: 'slideUp .32s cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Hero */}
      <div style={{
        height: 240, background: negocio.color, position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${negocio.color}ee, ${negocio.color}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={72} color="rgba(255,255,255,.25)" />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(transparent, rgba(0,0,0,.45))' }} />

        {/* Controls */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,.32)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}><ArrowLeft size={18} /></button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setFav(f => !f)} style={{
              width: 38, height: 38, borderRadius: '50%',
              background: fav ? 'rgba(220,38,38,.8)' : 'rgba(0,0,0,.32)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={18} color="#fff" fill={fav ? '#fff' : 'none'} />
            </button>
            <button style={{
              width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,.32)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}><Share2 size={18} /></button>
          </div>
        </div>

        {/* Photo dots */}
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i === 0 ? 20 : 6, height: 5, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,.45)', transition: 'width .2s' }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 110px' }}>
        {/* Title */}
        <div style={{ marginBottom: 10 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: C.text, fontFamily: 'Fraunces, serif', lineHeight: 1.2 }}>
            {negocio.nombre}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <VerBadge />
            <span style={{ fontSize: 13, color: C.muted }}>{negocio.subtipo}</span>
          </div>
        </div>

        {/* Rating row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Stars value={negocio.calificacion} size={16} />
          <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{negocio.calificacion.toFixed(1)}</span>
          <span style={{ fontSize: 13, color: C.muted }}>· {negocio.totalReviews} reseñas</span>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
            borderRadius: 20, background: negocio.abierto ? '#DCFCE7' : '#FEE2E2',
          }}>
            <Clock size={13} color={negocio.abierto ? C.open : C.closed} />
            <span style={{ fontSize: 12, fontWeight: 600, color: negocio.abierto ? C.open : C.closed }}>
              {negocio.abierto ? 'Abierto ahora' : 'Cerrado'} · {negocio.horario}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
            borderRadius: 20, background: '#F3F4F6',
          }}>
            <MapPin size={13} color={C.muted} />
            <span style={{ fontSize: 12, color: C.muted }}>{negocio.distanciaM}m · {negocio.minutos} min 🚶</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{negocio.descripcion}</p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap' }}>
          {negocio.tags.map(t => (
            <span key={t} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: `${negocio.color}15`, color: negocio.color,
            }}>{t}</span>
          ))}
        </div>

        {/* Address card */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 16px',
          border: `1px solid ${C.border}`, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,.05)',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color={C.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>Dirección</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{negocio.direccion}</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <button style={{
            flex: 1, padding: '15px', background: C.primary,
            border: 'none', borderRadius: 14, cursor: 'pointer',
            color: '#fff', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: `0 4px 16px ${C.primary}40`,
          }}>
            <Navigation size={18} /> Cómo llegar
          </button>
          <button style={{
            flex: 1, padding: '15px', background: C.accent,
            border: 'none', borderRadius: 14, cursor: 'pointer',
            color: '#fff', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: `0 4px 16px ${C.accent}40`,
          }}>
            <MessageCircle size={18} /> Preguntar IA
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

        {/* Reviews */}
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800, color: C.text, fontFamily: 'Fraunces, serif' }}>
          Reseñas de turistas
        </h3>
        {negocio.reseñas.map((r, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '14px 16px',
            border: `1px solid ${C.border}`, marginBottom: 10,
            boxShadow: '0 1px 6px rgba(0,0,0,.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: `${negocio.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 15, color: negocio.color,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>{r.autor[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{r.pais} {r.autor}</div>
                <Stars value={r.estrellas} size={11} />
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{r.fecha}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.55, fontStyle: 'italic' }}>"{r.texto}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bottom nav ────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'explorar',  label: 'Explorar',  Icon: Map      },
    { id: 'guardados', label: 'Guardados', Icon: Bookmark },
    { id: 'rutas',     label: 'Mis Rutas', Icon: Route    },
    { id: 'perfil',    label: 'Perfil',    Icon: User     },
  ]
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 45,
      background: '#fff', borderTop: `1px solid ${C.border}`,
      display: 'flex', boxShadow: '0 -4px 20px rgba(0,0,0,.08)',
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const on = active === id
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 4px 14px', background: 'none', border: 'none', cursor: 'pointer', gap: 3,
          }}>
            <div style={{ position: 'relative', width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {on && <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: `${C.primary}15` }} />}
              <Icon size={22} color={on ? C.primary : C.muted} style={{ position: 'relative' }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: on ? 700 : 400,
              color: on ? C.primary : C.muted,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MapaRutaAztecaUI() {
  const [activeTab,    setActiveTab]    = useState('explorar')
  const [activeFilter, setActiveFilter] = useState('')
  const [sheetState,   setSheetState]   = useState('mid')   // collapsed | mid | expanded
  const [selected,     setSelected]     = useState(null)
  const [search,       setSearch]       = useState('')

  const filtered = NEGOCIOS.filter(n =>
    (activeFilter === '' || n.categoria === activeFilter) &&
    (search === '' || n.nombre.toLowerCase().includes(search.toLowerCase()))
  )

  const HEIGHTS = { collapsed: 88, mid: 268, expanded: 580 }

  const cycleSheet = () => setSheetState(s => s === 'collapsed' ? 'mid' : s === 'mid' ? 'expanded' : 'mid')

  return (
    <div style={{
      width: 390, height: 844, margin: '0 auto', position: 'relative',
      overflow: 'hidden', background: C.bg, borderRadius: 44,
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      boxShadow: '0 0 80px rgba(0,0,0,.22)',
    }}>
      <style>{`
        ${FONTS}
        @keyframes pulse    { 0%,100% { transform:scale(1);   opacity:.5 } 50% { transform:scale(1.5); opacity:.2 } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        textarea, input { font-family:'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* ── Map ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapArea onPinClick={setSelected} />
      </div>

      {/* ── Top bar ── */}
      <div style={{ position: 'absolute', top: 52, left: 16, right: 16, zIndex: 20 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '.07em', color: C.primary, fontFamily: 'Fraunces, serif', textShadow: '0 1px 6px rgba(255,255,255,.9)' }}>
            RUTA AZTECA
          </span>
          <CheckCircle size={16} color={C.open} fill={C.open} style={{ marginTop: 1 }} />
          <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,.92)', fontSize: 11, color: C.muted, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            CDMX · ⚽ 2026
          </span>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,.97)', borderRadius: 28,
          padding: '8px 8px 8px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,.13)',
        }}>
          <Search size={18} color={C.muted} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Fondas, artesanos, hostales..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: C.text }}
          />
          <button style={{
            width: 36, height: 36, borderRadius: '50%',
            background: C.primary, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 3px 10px ${C.primary}50`,
          }}>
            <Mic size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{
        position: 'absolute', top: 158, left: 0, right: 0, zIndex: 15,
        display: 'flex', gap: 8, padding: '0 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {CATS.map(({ slug, label, Icon }) => {
          const on = activeFilter === slug
          return (
            <button key={slug} onClick={() => setActiveFilter(slug)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 22, flexShrink: 0,
              background: on ? C.primary : 'rgba(255,255,255,.96)',
              color:      on ? '#fff'    : C.text,
              border:     on ? 'none'   : `1px solid ${C.border}`,
              cursor: 'pointer', fontSize: 13, fontWeight: on ? 700 : 500,
              boxShadow: on ? `0 4px 14px ${C.primary}45` : '0 2px 8px rgba(0,0,0,.08)',
              transition: 'all .2s',
            }}>
              <Icon size={14} /> {label}
            </button>
          )
        })}
      </div>

      {/* ── Bottom sheet ── */}
      <div style={{
        position: 'absolute', bottom: 64, left: 0, right: 0, zIndex: 30,
        height: HEIGHTS[sheetState],
        background: '#fff', borderRadius: sheetState === 'expanded' ? '20px 20px 0 0' : '24px 24px 0 0',
        boxShadow: '0 -6px 32px rgba(0,0,0,.11)',
        transition: 'height .38s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Drag handle */}
        <div onClick={cycleSheet} style={{ padding: '10px 0 4px', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#D1D5DB', margin: '0 auto' }} />
        </div>

        {/* Sheet header */}
        <div style={{
          padding: '6px 18px 10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: sheetState !== 'collapsed' ? `1px solid ${C.border}` : 'none',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {filtered.length} negocios verificados
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>cerca de ti · FIFA World Cup 2026 ⚽</div>
          </div>
          <button onClick={cycleSheet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
            {sheetState === 'expanded' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((n, i) => <BusinessCard key={n.id} negocio={n} onClick={setSelected} index={i} />)}
        </div>
      </div>

      {/* ── Chat FAB ── */}
      {!selected && (
        <button style={{
          position: 'absolute',
          bottom: HEIGHTS[sheetState] + 74,
          right: 16, width: 54, height: 54, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.accent}, #D4622A)`,
          border: 'none', cursor: 'pointer', zIndex: 35,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 22px ${C.accent}55`,
          transition: 'bottom .38s cubic-bezier(.4,0,.2,1)',
        }}>
          <MessageCircle size={22} color="#fff" />
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 18, height: 18, borderRadius: '50%',
            background: C.primary, border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>IA</span>
          </div>
        </button>
      )}

      {/* ── Detail view ── */}
      {selected && <DetailView negocio={selected} onClose={() => setSelected(null)} />}

      {/* ── Bottom nav ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
