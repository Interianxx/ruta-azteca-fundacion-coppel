'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Clock, CheckCircle, Map, BarChart2, Loader2, 
  ShieldCheck, Check, ArrowLeft, MapPin, Phone, 
  Store, Smartphone, LocateFixed, Utensils, Palette, 
  BedDouble, Bus, LayoutGrid, type LucideIcon 
} from 'lucide-react'
import type { CategoriaSlug } from '@/types/negocio'
import { ImageUploader } from '@/components/Business/ImageUploader'

// ─── Categorías ──────────────────────────────────────────────────────────────

const CATEGORIAS: { slug: CategoriaSlug; label: string; Icon: LucideIcon; desc: string }[] = [
  { slug: 'comida',     label: 'Comida y bebida',  Icon: Utensils,   desc: 'Fondas, taquerías, restaurantes' },
  { slug: 'artesanias', label: 'Artesanías',        Icon: Palette,    desc: 'Arte, souvenirs, manualidades' },
  { slug: 'hospedaje',  label: 'Hospedaje',         Icon: BedDouble,  desc: 'Posadas, hostales, cuartos' },
  { slug: 'tours',      label: 'Tours y guías',     Icon: Map,        desc: 'Recorridos, experiencias locales' },
  { slug: 'transporte', label: 'Transporte',        Icon: Bus,        desc: 'Traslados, renta de vehículos' },
  { slug: 'otro',       label: 'Otro',              Icon: LayoutGrid, desc: 'Servicios, tiendas, otros' },
]

const CATEGORIA_EMOJI_REG: Record<string, string> = {
  comida: '🥘', artesanias: '🎨', hospedaje: '🏨', tours: '🗺️', transporte: '🚐', otro: '🏪'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px 16px', borderRadius: 16,
  border: `1.5px solid ${focused ? 'var(--color-jade-air-accent)' : 'rgba(13, 124, 102, 0.25)'}`,
  outline: 'none', fontSize: 16, color: 'var(--text-main)', 
  background: '#ffffff',
  boxSizing: 'border-box',
  boxShadow: focused ? '0 0 0 4px rgba(13,124,102,.12)' : '0 4px 12px rgba(0,0,0,0.03)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
})

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0A2E26', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: '#4a5a52', fontWeight: 500 }}>{hint}</p>}
    </div>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: i < current ? '#0D7C66' : i === current ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${i <= current ? 'transparent' : 'rgba(13,124,102,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all .4s ease',
            boxShadow: i === current ? '0 4px 12px rgba(13,124,102,0.3)' : 'none'
          }}>
            {i < current
              ? <Check size={16} color="#fff" strokeWidth={3} />
              : <span style={{ fontSize: 13, fontWeight: 800, color: i === current ? '#fff' : '#8a9690' }}>{i + 1}</span>
            }
          </div>
          {i < total - 1 && (
            <div style={{
              height: 2, width: 40, borderRadius: 2,
              background: i < current ? '#0D7C66' : 'rgba(13,124,102,0.1)',
              transition: 'all .4s ease',
            }} />
          )}
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 10, color: '#4a5a52', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.05em' }}>Progreso</span>
        <span style={{ fontSize: 14, color: '#0D7C66', fontWeight: 900 }}>{Math.round(((current + 1) / total) * 100)}%</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RegistroNegocioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [negocioExistente, setNegocioExistente] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  // Focus states
  const [focused, setFocused] = useState<string>('')

  // Form fields
  const [nombre,      setNombre]      = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria,   setCategoria]   = useState<CategoriaSlug | ''>('')
  const [telefono,    setTelefono]    = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [direccion,   setDireccion]   = useState('')
  const [lat,         setLat]         = useState<number | ''>('')
  const [lng,         setLng]         = useState<number | ''>('')
  const [tags,        setTags]        = useState('')
  const [imagenUrl,   setImagenUrl]   = useState<string | undefined>(undefined)

  const userEmail = session?.user?.email ?? null
  const userRol   = (session as { rol?: string } | null)?.rol ?? null

  useEffect(() => {
    console.log('[registro/useEffect] status:', status, '| userRol:', userRol, '| userEmail:', userEmail)
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      console.log('[registro/useEffect] unauthenticated — redirecting to /login')
      router.replace('/login?next=/negocio/registro')
      return
    }
    if (userRol === 'admin') { router.replace('/admin/dashboard'); return }

    console.log('[registro/useEffect] authenticated — fetching /api/negocios/mio')
    fetch('/api/negocios/mio')
      .then(r => { console.log('[registro/negocios/mio] status:', r.status); return r.json() })
      .then(d => {
        console.log('[registro/negocios/mio] data:', d)
        setNegocioExistente(d.data ?? null)
        setChecking(false)
      })
      .catch(err => { console.log('[registro/negocios/mio] error:', err); setChecking(false) })
  }, [status, router, userEmail, userRol])

  const usarUbicacion = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGeoLoading(false) },
      ()  => { setGeoLoading(false) }
    )
  }

  const canNext0 = nombre.trim().length >= 3 && descripcion.trim().length >= 10 && categoria !== ''
  const canNext1 = telefono.trim().length >= 8 && direccion.trim().length >= 5 && lat !== '' && lng !== ''

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/negocios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:      nombre.trim(),
          descripcion: descripcion.trim(),
          categoria,
          telefono:    telefono.trim(),
          whatsapp:    whatsapp.trim() || undefined,
          direccion:   direccion.trim(),
          lat:         Number(lat),
          lng:         Number(lng),
          tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
          imagenUrl,
        }),
      })
      if (!res.ok) throw new Error('Error al registrar')
      setDone(true)
    } catch (err) {
      setError('Ocurrió un error al enviar tu registro. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || checking) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen">
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={42} color="var(--color-jade-air-accent)" className="animate-spin mb-4" />
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-jade-air-accent)', letterSpacing: '.08em' }}>SINCRONIZANDO REGISTRO...</div>
      </div>
    </div>
  )

  // ── Ya registró su negocio — en revisión ──
  if (negocioExistente && !done) {
    const neg = negocioExistente
    return (
      <div className="bg-jade-air flex items-center justify-center min-h-screen p-6 overflow-hidden relative">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(13,124,102,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 460, width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13,124,102,0.2)' }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
              <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(197, 160, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(197, 160, 68, 0.2)' }}>
                <Clock size={32} color="#C5A044" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#C5A044', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Solicitud en Curso</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1A2E26', letterSpacing: '-0.02em' }}>{neg.nombre ?? 'Tu negocio'}</div>
              </div>
            </div>

            <p style={{ fontSize: 15, color: '#4a5a52', lineHeight: 1.7, marginBottom: 28 }}>
              Estamos validando tu información. Recibimos tu solicitud el <strong>{neg.createdAt ? new Date(neg.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : 'recientemente'}</strong>.
            </p>

            <div style={{ background: 'rgba(13, 124, 102, 0.05)', borderRadius: 24, padding: 20, border: '1px solid rgba(13, 124, 102, 0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Hoja de ruta</div>
              {[
                { Icon: CheckCircle, t: 'Validación Técnica',   d: 'Verificamos fotos y coordenadas' },
                { Icon: Map,         t: 'Publicación en Mapa',   d: 'Visibilidad para fans de la FIFA' },
                { Icon: BarChart2,   t: 'Dashboard Activo',       d: 'Acceso a métricas de impacto' },
              ].map(({ Icon, t, d }) => (
                <div key={t} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(13, 124, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#0D7C66" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2E26' }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#8a9690' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.replace('/turista/mapa')}
            style={{ 
              width: '100%', padding: '18px', 
              background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', 
              border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800, color: '#fff', 
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(13,124,102,0.3)',
              transition: 'transform 0.2s'
            }}
          >
            Explorar como Turista
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de éxito ──
  if (done) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen p-6">
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ 
          width: 88, height: 88, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', 
          boxShadow: '0 12px 32px rgba(13,124,102,0.25)', borderRadius: '50%'
        }}>
          <Check size={40} color="#fff" strokeWidth={3} />
        </div>
        
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A2E26', marginBottom: 12 }}>¡Solicitud Enviada!</h1>
        <p style={{ fontSize: 16, color: '#4a5a52', lineHeight: 1.6, marginBottom: 32 }}>
          Tu negocio <strong>{nombre}</strong> ha iniciado su proceso de registro de manera exitosa.
        </p>

        <div className="glass-card" style={{ padding: 24, paddingBottom: 16, textAlign: 'left', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-jade-air-accent)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>¿Qué sigue?</div>
          {[
            { n: '1', t: 'Verificación', d: 'Validamos fotos y datos del local.' },
            { n: '2', t: 'Aprobación', d: 'Tu pin aparece activo en el mapa.' },
          ].map(({ n, t, d }) => (
            <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(13, 124, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#0D7C66' }}>{n}</span>
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2E26' }}>{t}: </span>
                <span style={{ fontSize: 13, color: '#8a9690' }}>{d}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '12px 14px', background: 'rgba(197, 160, 68, 0.08)', borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, fontWeight: 600 }}>Cierra sesión y vuelve a entrar para activar tus permisos.</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ 
            width: '100%', padding: '18px', 
            background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', 
            border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800, color: '#fff', 
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(13,124,102,0.3)'
          }}
        >
          Cerrar sesión ahora
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 40 }}>
      {/* Header Premium Jade Air Dense */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'var(--glass-blur)', 
        borderBottom: '1px solid rgba(13,124,102,0.12)', 
        padding: '16px 24px', 
        display: 'flex', alignItems: 'center', gap: 16, 
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <button onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
          style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(13, 124, 102, 0.1)', background: 'rgba(13, 124, 102, 0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <ArrowLeft size={20} color="#0D7C66" />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1A9E78' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Registro</span>
          </div>
        </div>
        {session?.user?.image && (
          <img src={session.user.image} alt="" referrerPolicy="no-referrer"
            style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', marginLeft: 'auto', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        )}
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '32px 20px' }}>
        
        <div className="glass-card" style={{ padding: 32 }}>

          <StepIndicator current={step} total={3} />

          {/* ── Paso 0: Info básica ── */}
          {step === 0 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', marginBottom: 14 }}>
                  <Store size={24} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>Cuéntanos de tu negocio</h1>
                <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Esta información aparecerá en el mapa para los turistas del Mundial.</p>
              </div>

              <Field label="Nombre del negocio *" hint="Máximo 80 caracteres">
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onFocus={() => setFocused('nombre')}
                  onBlur={() => setFocused('')}
                  placeholder="Ej. Tacos de Canasta El Rey"
                  maxLength={80}
                  style={inputStyle(focused === 'nombre')}
                />
              </Field>

              <Field label="Descripción *" hint="Cuéntale al turista qué ofreces (mín 10 car.)">
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused('')}
                  placeholder="Ej. Los mejores tacos de guisado en el área, hechos al momento..."
                  maxLength={300}
                  rows={4}
                  style={{ ...inputStyle(focused === 'desc'), resize: 'vertical', minHeight: 96 }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: descripcion.length > 250 ? '#C5A044' : '#8a9690', textAlign: 'right' }}>{descripcion.length}/300</p>
              </Field>

              <Field label="Categoría *">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  {CATEGORIAS.map(cat => {
                    const selected = categoria === cat.slug
                    return (
                      <button key={cat.slug} onClick={() => setCategoria(cat.slug)}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 10,
                          padding: '16px 14px', borderRadius: 18, textAlign: 'left',
                          background: selected ? 'rgba(13, 124, 102, 0.04)' : '#fff',
                          border: `1.5px solid ${selected ? 'var(--color-jade-air-accent)' : 'rgba(13,102,102,0.1)'}`,
                          cursor: 'pointer', transition: 'all .2s',
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: selected ? 'var(--color-jade-air-accent)' : 'rgba(13, 124, 102, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                          <cat.Icon size={20} color={selected ? '#fff' : 'var(--color-jade-air-accent)'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: selected ? 'var(--color-jade-air-accent)' : '#1A2E26' }}>{cat.label}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* ── Paso 1: Contacto y ubicación ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', marginBottom: 14 }}>
                  <MapPin size={24} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>¿Dónde estás?</h1>
                <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Indica tu ubicación exacta para el mapa.</p>
              </div>

              <Field label="Foto representativa" hint="Una foto de tu local o productos estrella">
                <ImageUploader
                  onUploadComplete={(url) => setImagenUrl(url)}
                  onUploadClear={() => setImagenUrl(undefined)}
                />
              </Field>

              <Field label="Teléfono de contacto *" hint="Para llamadas directas de turistas">
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}><Phone size={16} /></div>
                  <input
                    value={telefono}
                    onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    onFocus={() => setFocused('tel')}
                    onBlur={() => setFocused('')}
                    placeholder="Ej. 5512345678"
                    type="tel"
                    style={{ ...inputStyle(focused === 'tel'), paddingLeft: 40 }}
                  />
                </div>
              </Field>

              <Field label="Dirección exacta *" hint="Calle, número, colonia">
                <textarea
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  onFocus={() => setFocused('dir')}
                  onBlur={() => setFocused('')}
                  placeholder="Ej. Av. Reforma 123, Col. Juárez..."
                  rows={2}
                  style={{ ...inputStyle(focused === 'dir'), resize: 'none' }}
                />
              </Field>

              <Field label="Ubicación GPS *" hint="Presiona el botón para mejores resultados">
                <button onClick={usarUbicacion} disabled={geoLoading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 16, marginBottom: 12,
                    background: geoLoading ? 'rgba(13, 124, 102, 0.05)' : 'rgba(13, 124, 102, 0.05)',
                    border: '1.5px dashed var(--color-jade-air-accent)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 14, fontWeight: 700, color: 'var(--color-jade-air-accent)',
                  }}>
                  {geoLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Localizando...</>
                    : <><LocateFixed size={18} /> Obtener ubicación actual</>}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input
                    value={lat}
                    onChange={e => setLat(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setFocused('lat')}
                    onBlur={() => setFocused('')}
                    placeholder="Latitud"
                    type="number"
                    style={inputStyle(focused === 'lat')}
                  />
                  <input
                    value={lng}
                    onChange={e => setLng(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setFocused('lng')}
                    onBlur={() => setFocused('')}
                    placeholder="Longitud"
                    type="number"
                    style={inputStyle(focused === 'lng')}
                  />
                </div>
              </Field>

              <Field label="Etiquetas (Tags)" hint="Separadas por comas (ej: tacos, barato, vegano)">
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  onFocus={() => setFocused('tags')}
                  onBlur={() => setFocused('')}
                  placeholder="tacos, tortas, local..."
                  style={inputStyle(focused === 'tags')}
                />
              </Field>
            </div>
          )}

          {/* ── Paso 2: Resumen ── */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', marginBottom: 14 }}>
                  <CheckCircle size={24} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>Todo listo</h1>
                <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Revisa tu registro por última vez.</p>
              </div>

              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, background: 'rgba(255,255,255,0.6)' }}>
                <div style={{ background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32 }}>{CATEGORIA_EMOJI_REG[categoria] ?? '🏪'}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{nombre}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{CATEGORIAS.find(c => c.slug === categoria)?.label}</div>
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { l: 'Descripción', v: descripcion },
                    { l: 'Ubicación', v: direccion },
                    { l: 'Contacto', v: telefono },
                  ].map(x => (
                    <div key={x.l}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-jade-air-accent)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{x.l}</div>
                      <div style={{ fontSize: 14, color: '#1A2E26', fontWeight: 500 }}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '12px 16px', borderRadius: 16, color: '#DC2626', fontSize: 13, marginBottom: 20 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Navegación ── */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ 
                  flex: 1, padding: '18px', 
                  background: 'rgba(255,255,255,0.5)', 
                  border: '1.5px solid rgba(13, 102, 102, 0.12)', 
                  borderRadius: 20, fontSize: 15, fontWeight: 700, color: '#4a5a52', 
                  cursor: 'pointer'
                }}>
                Atrás
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !canNext0 : !canNext1}
                style={{
                  flex: 2, padding: '18px',
                  background: (step === 0 ? canNext0 : canNext1) ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : 'rgba(13, 102, 102, 0.1)',
                  border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800,
                  color: (step === 0 ? canNext0 : canNext1) ? '#fff' : '#8a9690',
                  cursor: (step === 0 ? canNext0 : canNext1) ? 'pointer' : 'not-allowed',
                  boxShadow: (step === 0 ? canNext0 : canNext1) ? '0 8px 24px rgba(13,124,102,0.2)' : 'none',
                }}>
                Siguiente Paso
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  flex: 2, padding: '18px',
                  background: submitting ? 'rgba(13, 102, 102, 0.1)' : 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                  border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800,
                  color: submitting ? '#8a9690' : '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(13,124,102,0.2)',
                }}>
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Registrar Negocio'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer style={{
        margin: '24px 20px 20px',
        background: 'linear-gradient(135deg, #04342C 0%, #0A5C48 100%)',
        borderRadius: 24,
        padding: '24px 20px 20px',
        border: '1px solid rgba(255,255,255,0.06)',
        maxWidth: 640,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: 'calc(100% - 40px)',
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
  )
}
