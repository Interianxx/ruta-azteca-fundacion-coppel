'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// ─── SVG Assets ───────────────────────────────────────────────────────────────

const SERPENT_SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D7C66"/>
      <stop offset="50%" stop-color="#1A9E78"/>
      <stop offset="100%" stop-color="#C5A044"/>
    </linearGradient>
    <linearGradient id="sg2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C5A044"/>
      <stop offset="100%" stop-color="#0D7C66"/>
    </linearGradient>
  </defs>
  <path d="M100 30 C60 30, 30 60, 35 90 C40 120, 70 130, 90 120 C110 110, 130 90, 140 100 C150 110, 160 140, 130 160 C100 180, 60 170, 50 150"
    fill="none" stroke="url(#sg1)" stroke-width="12" stroke-linecap="round"/>
  <path d="M100 30 C60 30, 30 60, 35 90 C40 120, 70 130, 90 120 C110 110, 130 90, 140 100 C150 110, 160 140, 130 160 C100 180, 60 170, 50 150"
    fill="none" stroke="url(#sg2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 12" opacity="0.5"/>
  <g transform="translate(100, 22)">
    <polygon points="0,-14 -16,8 -6,12 0,6 6,12 16,8" fill="#0D7C66"/>
    <polygon points="0,-14 -10,4 0,0 10,4" fill="#1A9E78"/>
    <circle cx="-4" cy="0" r="2.5" fill="#C5A044"/>
    <circle cx="-4" cy="0" r="1" fill="#1A3A2A"/>
    <path d="M-8,-12 L-18,-26 L-6,-16" fill="#1A9E78" opacity="0.9"/>
    <path d="M-4,-14 L-10,-30 L-1,-18" fill="#0D7C66"/>
    <path d="M2,-14 L0,-32 L6,-18" fill="#1A9E78" opacity="0.9"/>
    <path d="M6,-12 L10,-28 L10,-16" fill="#0D7C66"/>
    <path d="M10,-10 L18,-24 L14,-12" fill="#1A9E78" opacity="0.8"/>
  </g>
  <g transform="translate(50, 150)">
    <path d="M0,0 L-12,18 L-2,10" fill="#C5A044" opacity="0.7"/>
    <path d="M0,0 L-6,22 L4,12" fill="#0D7C66" opacity="0.8"/>
    <path d="M0,0 L4,20 L8,8" fill="#C5A044" opacity="0.6"/>
  </g>
  <g opacity="0.3">
    <polygon points="55,75 60,68 65,75 60,82" fill="#C5A044"/>
    <polygon points="75,115 80,108 85,115 80,122" fill="#C5A044"/>
    <polygon points="120,95 125,88 130,95 125,102" fill="#C5A044"/>
    <polygon points="145,130 150,123 155,130 150,137" fill="#C5A044"/>
  </g>
  <g transform="translate(155, 55)">
    <path d="M0,-20 C-11,-20 -20,-11 -20,0 C-20,14 0,28 0,28 C0,28 20,14 20,0 C20,-11 11,-20 0,-20Z" fill="#1A9E78"/>
    <circle cx="0" cy="-1" r="7" fill="#E1F5EE"/>
  </g>
</svg>
`

const patterns = [
  { x: 10, y: 15, r: 0 }, { x: 85, y: 8, r: 45 }, { x: 5, y: 55, r: 90 },
  { x: 90, y: 50, r: 135 }, { x: 15, y: 85, r: 180 }, { x: 80, y: 88, r: 225 },
  { x: 50, y: 5, r: 60 }, { x: 50, y: 92, r: 300 },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'select' | 'tourist' | 't-login' | 't-signup' | 't-verify' | 't-forgot' | 't-reset' | 'business'

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router  = useRouter()
  const { data: session } = useSession()

  const [view,        setView]        = useState<View>('select')
  const [viewKey,     setViewKey]     = useState(0)
  const dirRef                        = useRef<'fwd' | 'back'>('fwd')

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [code,        setCode]        = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    if (session) router.replace('/turista/mapa')
  }, [session, router])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function nav(to: View, dir: 'fwd' | 'back' = 'fwd') {
    dirRef.current = dir
    setViewKey(k => k + 1)
    setView(to)
    setError('')
    setSuccess('')
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('cognito', { callbackUrl: `${window.location.origin}/turista/mapa` }, { identity_provider: 'Google' })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.error) {
      setError('Correo o contraseña incorrectos. Si acabas de registrarte, verifica tu correo primero.')
    } else {
      router.replace(view === 'business' ? '/negocio/perfil' : '/turista/mapa')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      nav('t-verify', 'fwd')
    } catch {
      setError('Error de red. Intenta de nuevo.')
    }
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      const login = await signIn('credentials', { redirect: false, email, password })
      if (login?.error) {
        setSuccess('¡Cuenta verificada! Ya puedes iniciar sesión.')
        nav('t-login', 'fwd')
      } else {
        router.replace('/turista/mapa')
      }
    } catch {
      setError('Error de red. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setSuccess('Código reenviado a tu correo.')
    } catch {
      setError('Error de red.')
    }
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setCode('')
      nav('t-reset', 'fwd')
    } catch {
      setError('Error de red.')
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: newPassword }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setPassword('')
      setSuccess('¡Contraseña actualizada! Ya puedes iniciar sesión.')
      nav('t-login', 'fwd')
    } catch {
      setError('Error de red.')
    }
    setLoading(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const dark = isMobile

  const TITLES: Record<View, string> = {
    select:    'Bienvenido',
    tourist:   'Soy turista',
    't-login': 'Iniciar sesión',
    't-signup': 'Crear cuenta',
    't-verify': 'Verifica tu correo',
    't-forgot': 'Recuperar contraseña',
    't-reset':  'Nueva contraseña',
    business:  'Acceso negocio / admin',
  }

  const SUBTITLES: Record<View, string> = {
    select:    'Elige cómo quieres comenzar tu experiencia',
    tourist:   'Explora negocios locales al instante',
    't-login': 'Ingresa con tu correo y contraseña',
    't-signup': 'Únete a la comunidad Ruta Azteca',
    't-verify': `Enviamos un código a ${email || 'tu correo'}`,
    't-forgot': 'Te enviaremos un código de recuperación',
    't-reset':  `Revisa ${email || 'tu correo'} y escribe el código`,
    business:  'Inicia sesión para gestionar tu negocio o panel',
  }

  const animName = viewKey > 0
    ? (dirRef.current === 'fwd' ? 'slideInFwd' : 'slideInBack')
    : 'none'

  // ── Shared style helpers ──────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
    background: dark ? 'rgba(255,255,255,0.06)' : '#fff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#ddd'}`,
    borderRadius: 12, fontSize: 14, outline: 'none',
    color: dark ? '#E1F5EE' : '#1A2E26',
  }

  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
    border: 'none', borderRadius: 12,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 15, fontWeight: 600, color: '#fff',
    opacity: loading ? 0.6 : 1,
  }

  const outlineBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', padding: '14px',
    background: dark ? 'rgba(255,255,255,0.06)' : '#fff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#ddd'}`,
    borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 500,
    color: dark ? '#E1F5EE' : '#333',
  }

  const linkBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: dark ? '#4ABFA0' : '#0D7C66',
    fontSize: 13, padding: '2px 0',
    textDecoration: 'underline',
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: dark ? '#7FBFA8' : '#6B7D75',
    fontSize: 13, marginTop: 4, padding: '8px',
  }

  const eyeBtn: React.CSSProperties = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: dark ? '#7FBFA8' : '#8a9690', fontSize: 13,
  }

  const dividerStyle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: dark ? 'rgba(255,255,255,0.08)' : '#e0ddd5' }} />
      <span style={{ fontSize: 12, color: dark ? '#7FBFA8' : '#8a9690' }}>o sin cuenta</span>
      <div style={{ flex: 1, height: 1, background: dark ? 'rgba(255,255,255,0.08)' : '#e0ddd5' }} />
    </div>
  )

  const dividerTextStyle = (text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: dark ? 'rgba(255,255,255,0.08)' : '#e0ddd5' }} />
      <span style={{ fontSize: 12, color: dark ? '#7FBFA8' : '#8a9690' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: dark ? 'rgba(255,255,255,0.08)' : '#e0ddd5' }} />
    </div>
  )

  const errorBox = error ? (
    <div style={{
      padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.45,
      background: dark ? 'rgba(255,80,80,0.1)' : '#fff2f2',
      border: `1px solid ${dark ? 'rgba(255,80,80,0.2)' : '#ffc0c0'}`,
      color: dark ? '#FF9999' : '#c0392b',
    }}>{error}</div>
  ) : null

  const successBox = success ? (
    <div style={{
      padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.45,
      background: dark ? 'rgba(26,158,120,0.12)' : '#f0faf6',
      border: `1px solid ${dark ? 'rgba(26,158,120,0.25)' : '#a8dcc8'}`,
      color: dark ? '#4ABFA0' : '#0D7C66',
    }}>{success}</div>
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: isMobile ? '#0A1F17' : '#f8f7f4',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes slideInFwd  { from { opacity:0; transform:translateX(22px)  } to { opacity:1; transform:none } }
        @keyframes slideInBack { from { opacity:0; transform:translateX(-22px) } to { opacity:1; transform:none } }
        input::placeholder { color: ${dark ? 'rgba(225,245,238,0.3)' : '#b0b8b3'}; }
      `}</style>

      {/* ── Brand Panel ──────────────────────────────────────────────────────── */}
      <div style={{
        flex: isMobile ? 'none' : '1 1 50%',
        background: 'linear-gradient(165deg, #0A1F17 0%, #0D3B2A 40%, #0F4D36 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '48px 24px 24px' : '48px',
        position: 'relative', overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100vh',
      }}>
        {patterns.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            transform: `rotate(${p.r}deg)`, opacity: 0.06, pointerEvents: 'none',
          }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="#C5A044" strokeWidth="1.5"/>
              <polygon points="30,10 50,30 30,50 10,30" fill="none" stroke="#C5A044" strokeWidth="1"/>
              <polygon points="30,20 40,30 30,40 20,30" fill="none" stroke="#1A9E78" strokeWidth="0.8"/>
            </svg>
          </div>
        ))}

        <div style={{
          width: isMobile ? 140 : 200, height: isMobile ? 140 : 200,
          marginBottom: isMobile ? 16 : 24,
          filter: 'drop-shadow(0 0 40px rgba(26,158,120,0.15))',
        }} dangerouslySetInnerHTML={{ __html: SERPENT_SVG }} />

        <h1 style={{
          margin: 0, fontSize: isMobile ? 28 : 36, fontWeight: 700,
          letterSpacing: '0.12em', color: '#E1F5EE', textTransform: 'uppercase',
        }}>Ruta Azteca</h1>

        <div style={{
          width: 40, height: 2,
          background: 'linear-gradient(90deg, #C5A044, #1A9E78)',
          margin: isMobile ? '10px 0' : '14px 0', borderRadius: 1,
        }} />

        <p style={{
          margin: 0, fontSize: isMobile ? 13 : 15, color: '#7FBFA8',
          textAlign: 'center', maxWidth: 320, lineHeight: 1.5, letterSpacing: '0.02em',
        }}>
          {isMobile
            ? 'Descubre lo auténtico de México'
            : 'Conecta con los negocios locales que dan vida a nuestras ciudades'}
        </p>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
            {['CDMX', 'Guadalajara', 'Monterrey'].map(city => (
              <span key={city} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 20,
                border: '1px solid rgba(197,160,68,0.25)',
                color: '#C5A044', fontSize: 12, letterSpacing: '0.05em',
              }}>
                <MapPinIcon /> {city}
              </span>
            ))}
          </div>
        )}

        {!isMobile && (
          <p style={{
            position: 'absolute', bottom: 24, fontSize: 11,
            color: 'rgba(127,191,168,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>FIFA World Cup 2026 — Experiencias locales verificadas</p>
        )}
      </div>

      {/* ── Form Panel ───────────────────────────────────────────────────────── */}
      <div style={{
        flex: isMobile ? '1' : '1 1 50%',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '28px 24px 40px' : '48px',
        background: isMobile ? 'linear-gradient(180deg, #0A1F17 0%, #0F2B20 100%)' : '#f8f7f4',
        position: 'relative',
      }}>
        {!isMobile && (
          <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.06 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <path d="M0,0 L80,0 L80,80" fill="none" stroke="#0D7C66" strokeWidth="2"/>
              <path d="M10,0 L80,70" fill="none" stroke="#C5A044" strokeWidth="1" strokeDasharray="4 6"/>
              <path d="M30,0 L80,50" fill="none" stroke="#0D7C66" strokeWidth="0.8"/>
            </svg>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 380 }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {['CDMX', 'GDL', 'MTY'].map(city => (
                <span key={city} style={{
                  padding: '3px 10px', borderRadius: 12,
                  border: '1px solid rgba(197,160,68,0.2)',
                  color: '#C5A044', fontSize: 11, letterSpacing: '0.06em',
                }}>{city}</span>
              ))}
            </div>
          )}

          {/* ── Animated section (title + content slide together) ──────────── */}
          <div
            key={viewKey}
            style={{
              animationName: animName,
              animationDuration: '0.26s',
              animationTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)',
              animationFillMode: 'both',
            }}
          >
            <h2 style={{
              margin: '0 0 6px', fontSize: isMobile ? 22 : 26, fontWeight: 600,
              color: isMobile ? '#E1F5EE' : '#1A2E26',
            }}>{TITLES[view]}</h2>
            <p style={{
              margin: '0 0 24px', fontSize: 14,
              color: isMobile ? '#7FBFA8' : '#6B7D75', lineHeight: 1.5,
            }}>{SUBTITLES[view]}</p>

            {/* ── select ──────────────────────────────────────────────────── */}
            {view === 'select' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => nav('tourist', 'fwd')} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '16px 20px',
                  background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                  border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                  </span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Soy turista</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Explorar negocios locales al instante</div>
                  </div>
                </button>

                <button onClick={() => nav('business', 'fwd')} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '16px 20px',
                  background: dark ? 'rgba(197,160,68,0.08)' : '#fff',
                  border: dark ? '1px solid rgba(197,160,68,0.2)' : '1px solid #e0ddd5',
                  borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: dark ? 'rgba(197,160,68,0.12)' : '#faf5e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dark ? '#C5A044' : '#A08030'} strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <div>
                    <div style={{ color: dark ? '#E1F5EE' : '#1A2E26', fontWeight: 600, fontSize: 15 }}>Tengo un negocio</div>
                    <div style={{ color: dark ? '#7FBFA8' : '#8a9690', fontSize: 12 }}>Registrar o gestionar mi perfil</div>
                  </div>
                </button>

                <button onClick={() => nav('business', 'fwd')} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '16px 20px',
                  background: dark ? 'rgba(26,158,120,0.06)' : '#fff',
                  border: dark ? '1px solid rgba(26,158,120,0.15)' : '1px solid #e0ddd5',
                  borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: dark ? 'rgba(26,158,120,0.1)' : '#e8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dark ? '#1A9E78' : '#0D7C66'} strokeWidth="2">
                      <path d="M12 20V10M6 20V4M18 20v-6"/>
                    </svg>
                  </span>
                  <div>
                    <div style={{ color: dark ? '#E1F5EE' : '#1A2E26', fontWeight: 600, fontSize: 15 }}>Administrador</div>
                    <div style={{ color: dark ? '#7FBFA8' : '#8a9690', fontSize: 12 }}>Panel Ola México</div>
                  </div>
                </button>
              </div>
            )}

            {/* ── tourist ─────────────────────────────────────────────────── */}
            {view === 'tourist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleGoogle} disabled={loading} style={{ ...outlineBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  <GoogleIcon /> {loading ? 'Redirigiendo...' : 'Continuar con Google'}
                </button>

                <button onClick={() => nav('t-login', 'fwd')} style={outlineBtn}>
                  <MailIcon /> Continuar con correo
                </button>

                {dividerStyle}

                <a href="/turista/mapa" style={{
                  display: 'block', width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                  borderRadius: 12, boxSizing: 'border-box',
                  fontSize: 15, fontWeight: 600, color: '#fff',
                  textAlign: 'center', textDecoration: 'none',
                }}>
                  Explorar el mapa ahora
                </a>

                <button onClick={() => nav('select', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── t-login ──────────────────────────────────────────────────── */}
            {view === 't-login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {successBox}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus style={inp}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      style={{ ...inp, paddingRight: 56 }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                      {showPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button type="button" onClick={() => nav('t-forgot', 'fwd')} style={linkBtnStyle}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  {errorBox}
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  </button>
                </form>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: dark ? '#7FBFA8' : '#8a9690' }}>¿No tienes cuenta? </span>
                  <button onClick={() => nav('t-signup', 'fwd')} style={linkBtnStyle}>Regístrate</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── t-signup ─────────────────────────────────────────────────── */}
            {view === 't-signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text" placeholder="Nombre (opcional)" value={name}
                    onChange={e => setName(e.target.value)} autoFocus style={inp}
                  />
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required style={inp}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña (mín. 8 caracteres)" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      style={{ ...inp, paddingRight: 56 }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                      {showPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errorBox}
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </form>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: dark ? '#7FBFA8' : '#8a9690' }}>¿Ya tienes cuenta? </span>
                  <button onClick={() => nav('t-login', 'back')} style={linkBtnStyle}>Iniciar sesión</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── t-verify ─────────────────────────────────────────────────── */}
            {view === 't-verify' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  background: dark ? 'rgba(26,158,120,0.08)' : '#f0faf6',
                  border: `1px solid ${dark ? 'rgba(26,158,120,0.2)' : '#c8e8da'}`,
                  borderRadius: 10,
                }}>
                  <MailIcon />
                  <span style={{ fontSize: 13, color: dark ? '#4ABFA0' : '#0D7C66', fontWeight: 500 }}>{email}</span>
                </div>
                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text" placeholder="000000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    style={{ ...inp, textAlign: 'center', fontSize: 26, letterSpacing: '0.35em', fontWeight: 700 }}
                  />
                  {errorBox}
                  {successBox}
                  <button type="submit" disabled={loading || code.length < 6} style={{
                    ...primaryBtn,
                    opacity: (loading || code.length < 6) ? 0.6 : 1,
                    cursor: (loading || code.length < 6) ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Verificando...' : 'Verificar cuenta'}
                  </button>
                </form>
                <div style={{ textAlign: 'center' }}>
                  <button onClick={handleResend} disabled={loading} style={{ ...linkBtnStyle, opacity: loading ? 0.6 : 1 }}>
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
                <button onClick={() => nav('t-signup', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── t-forgot ─────────────────────────────────────────────────── */}
            {view === 't-forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus style={inp}
                  />
                  {errorBox}
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? 'Enviando...' : 'Enviar código de recuperación'}
                  </button>
                </form>
                <button onClick={() => nav('t-login', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── t-reset ──────────────────────────────────────────────────── */}
            {view === 't-reset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text" placeholder="000000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    style={{ ...inp, textAlign: 'center', fontSize: 26, letterSpacing: '0.35em', fontWeight: 700 }}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'} placeholder="Nueva contraseña" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required
                      style={{ ...inp, paddingRight: 56 }}
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={eyeBtn}>
                      {showNewPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errorBox}
                  <button type="submit" disabled={loading || code.length < 6} style={{
                    ...primaryBtn,
                    opacity: (loading || code.length < 6) ? 0.6 : 1,
                    cursor: (loading || code.length < 6) ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                  </button>
                </form>
                <button onClick={() => nav('t-forgot', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}

            {/* ── business ─────────────────────────────────────────────────── */}
            {view === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleGoogle} disabled={loading} style={{ ...outlineBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  <GoogleIcon /> {loading ? 'Redirigiendo...' : 'Continuar con Google'}
                </button>

                {dividerTextStyle('o con correo')}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required style={inp}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      style={{ ...inp, paddingRight: 56 }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                      {showPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  {errorBox}
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  </button>
                </form>
                <button onClick={() => nav('select', 'back')} style={backBtnStyle}>← Volver</button>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 28, fontSize: 11,
            color: dark ? 'rgba(127,191,168,0.5)' : '#a0a099', letterSpacing: '0.04em',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Verificado por Ola México — Impact Hub CDMX
          </div>
        </div>
      </div>
    </div>
  )
}
