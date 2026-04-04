'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const MailIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

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

  useEffect(() => {
    if (session) router.replace('/turista/mapa')
  }, [session, router])

  function nav(to: View, dir: 'fwd' | 'back' = 'fwd') {
    dirRef.current = dir
    setViewKey(k => k + 1)
    setView(to)
    setError('')
    setSuccess('')
  }

  // ── Handlers (Preserved exactly to not break backend) ───────────────────────

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('cognito', { callbackUrl: `${window.location.origin}/turista/mapa` }, { identity_provider: 'Google' })
    // In case of rapid re-renders
    setTimeout(() => setLoading(false), 3000)
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

  // ── Derived View Content ────────────────────────────────────────────────────

  const TITLES: Record<View, string> = {
    select:    'Bienvenido',
    tourist:   'Soy turista',
    't-login': 'Iniciar sesión',
    't-signup': 'Crear cuenta',
    't-verify': 'Verifica tu correo',
    't-forgot': 'Recuperar contraseña',
    't-reset':  'Nueva contraseña',
    business:  'Acceso negocio',
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

  const animClass = viewKey > 0 
    ? (dirRef.current === 'fwd' ? 'animate-[slideInFwd_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]' : 'animate-[slideInBack_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]')
    : ''

  // ── Common Tailwind Style Tokens ───────────────────────────────────────────
  const twInput = "w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-xl text-[var(--color-jade-50)] placeholder-[rgba(225,245,238,0.4)] text-[15px] outline-none focus:border-[var(--color-jade-400)] focus:bg-[rgba(255,255,255,0.08)] transition-all"
  const twPrimaryBtn = "w-full p-3.5 bg-[var(--color-jade-600)] hover:bg-[var(--color-jade-400)] text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(4,52,44,0.3)]"
  const twOutlineBtn = "flex items-center justify-center gap-2.5 w-full p-3.5 bg-[rgba(241,239,232,0.08)] hover:bg-[rgba(241,239,232,0.15)] border border-[rgba(255,255,255,0.12)] rounded-xl text-[var(--color-jade-50)] text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  const twLinkBtn = "bg-transparent border-none cursor-pointer text-[var(--color-jade-100)] text-[13px] py-1 underline hover:text-[var(--color-jade-50)] transition-colors"
  const twBackBtn = "bg-transparent border-none cursor-pointer text-[var(--color-obs-100)] text-[13px] mt-1 p-2 hover:text-[var(--color-jade-50)] transition-colors"
  
  const divider = (text: string) => (
    <div className="flex items-center gap-4 my-2 opacity-60">
      <div className="flex-1 h-px bg-[var(--color-obs-100)] opacity-20"></div>
      <span className="text-[12px] text-[var(--color-obs-100)] font-medium uppercase tracking-wider">{text}</span>
      <div className="flex-1 h-px bg-[var(--color-obs-100)] opacity-20"></div>
    </div>
  )

  const ErrorBox = () => error ? (
    <div className="p-3 rounded-lg text-[13px] leading-relaxed bg-red-900/30 border border-red-500/30 text-red-200">
      {error}
    </div>
  ) : null

  const SuccessBox = () => success ? (
    <div className="p-3 rounded-lg text-[13px] leading-relaxed bg-[var(--color-jade-900)] border border-[var(--color-jade-400)] text-[var(--color-jade-50)]">
      {success}
    </div>
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[var(--color-obs-900)] overflow-hidden relative selection:bg-[var(--color-jade-400)] selection:text-white">
      <style>{`
        @keyframes slideInFwd  { from { opacity:0; transform:translateX(24px)  } to { opacity:1; transform:none } }
        @keyframes slideInBack { from { opacity:0; transform:translateX(-24px) } to { opacity:1; transform:none } }
      `}</style>

      {/* ── Brand Panel (Left on Desktop, Top on Mobile) ──────────────────── */}
      <div className="flex-none md:flex-1 md:w-1/2 bg-gradient-to-br from-[var(--color-obs-900)] via-[#083025] to-[var(--color-jade-900)] flex flex-col items-center justify-center p-10 md:p-16 relative overflow-hidden min-h-[300px] md:min-h-screen">
        {patterns.map((p, i) => (
          <div key={i} className="absolute pointer-events-none opacity-5" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}>
            <svg width="80" height="80" viewBox="0 0 60 60">
              <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="var(--color-gold-200)" strokeWidth="1.5"/>
              <polygon points="30,10 50,30 30,50 10,30" fill="none" stroke="var(--color-jade-400)" strokeWidth="1"/>
            </svg>
          </div>
        ))}

        <div className="relative z-10 w-56 md:w-[320px] mb-6 drop-shadow-[0_0_24px_rgba(29,158,117,0.3)] flex justify-center">
          <img 
            src="/Ruta_Azteca.svg" 
            alt="Ruta Azteca Logo" 
            className="w-full h-auto object-contain"
          />
        </div>

        <h1 className="relative z-10 m-0 text-3xl md:text-5xl font-bold tracking-[0.12em] text-[var(--color-jade-50)] uppercase text-center">
          Ruta Azteca
        </h1>

        <div className="relative z-10 w-12 h-1 bg-gradient-to-r from-[var(--color-gold-200)] to-[var(--color-jade-400)] my-5 rounded-full" />

        <p className="relative z-10 m-0 text-[14px] md:text-[16px] text-[var(--color-jade-100)] text-center max-w-[340px] leading-relaxed tracking-wide font-light">
          Conecta con los negocios locales que dan vida a nuestras ciudades
        </p>

        <div className="hidden md:flex gap-3 mt-10 relative z-10">
          {['CDMX', 'Guadalajara', 'Monterrey'].map(city => (
            <span key={city} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[var(--color-gold-200)]/30 text-[var(--color-gold-200)] text-[12px] font-medium tracking-[0.05em] bg-[var(--color-gold-900)]/40 backdrop-blur-sm">
              <MapPinIcon /> {city}
            </span>
          ))}
        </div>

        <p className="hidden md:block absolute bottom-8 text-[11px] text-[var(--color-jade-100)]/40 tracking-[0.1em] uppercase font-semibold">
          FIFA World Cup 2026 — Experiencias locales verificadas
        </p>
      </div>

      {/* ── Form Panel (Right on Desktop, Bottom on Mobile) ──────────────── */}
      <div className="flex-1 md:w-1/2 flex items-start md:items-center justify-center p-6 md:p-16 relative bg-gradient-to-b from-[var(--color-obs-900)] to-[#0c1a16] md:bg-none">
        
        {/* Glass Form Container */}
        <div className="glass-panel w-full max-w-[420px] p-8 md:p-10 relative z-10">
          
          <div className={animClass}>
            <h2 className="m-0 mb-2 text-2xl md:text-3xl font-semibold text-[var(--color-jade-50)] tracking-tight">
              {TITLES[view]}
            </h2>
            <p className="m-0 mb-8 text-[14px] text-[var(--color-jade-100)] opacity-80 leading-relaxed font-light">
              {SUBTITLES[view]}
            </p>

            {/* ── select ──────────────────────────────────────────────────── */}
            {view === 'select' && (
              <div className="flex flex-col gap-4">
                <button onClick={() => nav('tourist', 'fwd')} className="group flex items-center gap-4 w-full p-4 bg-gradient-to-br from-[var(--color-jade-600)] to-[var(--color-jade-900)] hover:from-[var(--color-jade-400)] hover:to-[var(--color-jade-600)] rounded-2xl border border-[var(--color-jade-400)]/30 transition-all shadow-lg text-left">
                  <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-[var(--color-jade-50)] font-semibold text-[16px] mb-0.5">Soy turista</div>
                    <div className="text-[var(--color-jade-100)] opacity-70 text-[13px] font-light">Explorar negocios locales al instante</div>
                  </div>
                </button>

                <button onClick={() => nav('business', 'fwd')} className="group flex items-center gap-4 w-full p-4 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] rounded-2xl border border-[rgba(255,255,255,0.1)] transition-all text-left">
                  <span className="w-12 h-12 rounded-xl bg-[var(--color-gold-900)]/50 group-hover:bg-[var(--color-gold-900)] flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-6 h-6 text-[var(--color-gold-200)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-[var(--color-jade-50)] font-semibold text-[16px] mb-0.5">Tengo un negocio</div>
                    <div className="text-[var(--color-jade-100)] opacity-70 text-[13px] font-light">Registrar o gestionar mi perfil</div>
                  </div>
                </button>
              </div>
            )}

            {/* ── tourist ─────────────────────────────────────────────────── */}
            {view === 'tourist' && (
              <div className="flex flex-col gap-3.5">
                <button onClick={handleGoogle} disabled={loading} className={twOutlineBtn}>
                  <GoogleIcon /> {loading ? 'Redirigiendo...' : 'Continuar con Google'}
                </button>

                <button onClick={() => nav('t-login', 'fwd')} className={twOutlineBtn}>
                  <MailIcon /> Continuar con correo
                </button>

                {divider('o sin cuenta')}

                <a href="/turista/mapa" className={twPrimaryBtn + " text-center block"}>
                  Explorar el mapa ahora
                </a>

                <button onClick={() => nav('select', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── t-login ──────────────────────────────────────────────────── */}
            {view === 't-login' && (
              <div className="flex flex-col gap-3.5">
                <SuccessBox />
                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => nav('t-forgot', 'fwd')} className={twLinkBtn}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-[var(--color-obs-100)] font-light">¿No tienes cuenta? </span>
                  <button onClick={() => nav('t-signup', 'fwd')} className={twLinkBtn + " font-medium"}>Regístrate</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── t-signup ─────────────────────────────────────────────────── */}
            {view === 't-signup' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  <input
                    type="text" placeholder="Nombre (opcional)" value={name}
                    onChange={e => setName(e.target.value)} autoFocus className={twInput}
                  />
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña (mín. 8 caracteres)" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-[var(--color-obs-100)] font-light">¿Ya tienes cuenta? </span>
                  <button onClick={() => nav('t-login', 'back')} className={twLinkBtn + " font-medium"}>Iniciar sesión</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── t-verify ─────────────────────────────────────────────────── */}
            {view === 't-verify' && (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl">
                  <div className="text-[var(--color-jade-400)]"><MailIcon /></div>
                  <span className="text-[14px] text-[var(--color-jade-50)] font-medium break-all">{email}</span>
                </div>
                <form onSubmit={handleVerify} className="flex flex-col gap-3.5 mt-2">
                  <input
                    type="text" placeholder="000 000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    className={twInput + " text-center text-[28px] tracking-[0.3em] font-bold py-4"}
                  />
                  <ErrorBox />
                  <SuccessBox />
                  <button type="submit" disabled={loading || code.length < 6} className={twPrimaryBtn}>
                    {loading ? 'Verificando...' : 'Verificar cuenta'}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <button onClick={handleResend} disabled={loading} className={twLinkBtn}>
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
                <button onClick={() => nav('t-signup', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── t-forgot ─────────────────────────────────────────────────── */}
            {view === 't-forgot' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleForgot} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus className={twInput}
                  />
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? 'Enviando...' : 'Enviar código'}
                  </button>
                </form>
                <button onClick={() => nav('t-login', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── t-reset ──────────────────────────────────────────────────── */}
            {view === 't-reset' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleReset} className="flex flex-col gap-3.5">
                  <input
                    type="text" placeholder="000 000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    className={twInput + " text-center text-[28px] tracking-[0.3em] font-bold py-4"}
                  />
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'} placeholder="Nueva contraseña" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showNewPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading || code.length < 6} className={twPrimaryBtn}>
                    {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                  </button>
                </form>
                <button onClick={() => nav('t-forgot', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}

            {/* ── business ─────────────────────────────────────────────────── */}
            {view === 'business' && (
              <div className="flex flex-col gap-3.5">
                <button onClick={handleGoogle} disabled={loading} className={twOutlineBtn}>
                  <GoogleIcon /> {loading ? 'Redirigiendo...' : 'Continuar con Google'}
                </button>

                {divider('o con correo')}

                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder="correo@ejemplo.com" value={email}
                    onChange={e => setEmail(e.target.value)} required className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  </button>
                </form>
                <button onClick={() => nav('select', 'back')} className={twBackBtn}>← Volver</button>
              </div>
            )}
          </div>
        </div>
        
        {/* Verification Footer Text */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-[11px] text-[var(--color-jade-100)]/40 tracking-[0.05em] font-medium uppercase">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Verificado por Ola México — Impact Hub
        </div>
      </div>
      
    </div>
  )
}
