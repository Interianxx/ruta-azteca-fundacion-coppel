'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, Map, BarChart2, Loader2, ShieldCheck, Check, ArrowLeft, MapPin, Phone, Store, Smartphone, LocateFixed, Utensils, Palette, BedDouble, Bus, LayoutGrid, type LucideIcon } from 'lucide-react'
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: `1.5px solid ${focused ? '#0D7C66' : '#e0ddd5'}`,
  outline: 'none', fontSize: 14, color: '#1A2E26', background: '#fafaf8',
  boxSizing: 'border-box',
  boxShadow: focused ? '0 0 0 3px rgba(13,124,102,.1)' : 'none',
  transition: 'border-color .2s, box-shadow .2s',
})

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A2E26', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: '#8a9690' }}>{hint}</p>}
    </div>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i < current ? '#0D7C66' : i === current ? '#0D7C66' : '#e8e6e0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background .3s',
          }}>
            {i < current
              ? <Check size={14} color="#fff" strokeWidth={3} />
              : <span style={{ fontSize: 12, fontWeight: 700, color: i === current ? '#fff' : '#8a9690' }}>{i + 1}</span>
            }
          </div>
          {i < total - 1 && (
            <div style={{
              height: 2, width: 32, borderRadius: 2,
              background: i < current ? '#0D7C66' : '#e8e6e0',
              transition: 'background .3s',
            }} />
          )}
        </div>
      ))}
      <span style={{ marginLeft: 4, fontSize: 12, color: '#8a9690', fontWeight: 500 }}>
        Paso {current + 1} de {total}
      </span>
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
  const [negocioExistente, setNegocioExistente] = useState<Record<string, unknown> | null | 'loading'>('loading')

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

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login?next=/negocio/registro'); return }
    // Verificar si ya tiene negocio registrado
    fetch('/api/negocios/mio')
      .then(r => r.json())
      .then(d => setNegocioExistente(d.data ?? null))
      .catch(() => setNegocioExistente(null))
  }, [status, router])

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
    } catch {
      setError('Ocurrió un error al enviar tu registro. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || negocioExistente === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2' }}>
      <Loader2 size={32} color="#0D7C66" style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Ya registró su negocio — en revisión ──
  if (negocioExistente && !done) {
    const neg = negocioExistente as { nombre?: string; categoria?: string; createdAt?: string }
    return (
      <div style={{ minHeight: '100vh', background: '#f7f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
              <ShieldCheck size={16} color="#1A9E78" />
            </div>
          </div>

          {/* Status card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #e8e6e0', boxShadow: '0 4px 20px rgba(0,0,0,.06)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #FFF8E7, #FEF3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={28} color="#C5A044" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C5A044', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>En revisión</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2E26' }}>{neg.nombre ?? 'Tu negocio'}</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#4a5a52', lineHeight: 1.7, marginBottom: 20 }}>
              Recibimos tu solicitud el <strong>{neg.createdAt ? new Date(neg.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : '—'}</strong>. El equipo de Ruta Azteca la está revisando.
            </p>

            <div style={{ background: '#f7f6f2', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Próximos pasos</div>
              {[
                { Icon: CheckCircle, t: 'Revisión del equipo',   d: 'Verificamos que tu negocio cumpla los requisitos' },
                { Icon: Map,         t: 'Aprobación',             d: 'Apareces en el mapa para turistas del Mundial' },
                { Icon: BarChart2,   t: 'Tu perfil activo',       d: 'Recibes reseñas y métricas de visitas' },
              ].map(({ Icon, t, d }) => (
                <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <Icon size={16} color="#0D7C66" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E26' }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#8a9690' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#8a9690', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
            Si tienes preguntas, contacta al equipo en la sección de soporte.
          </p>

          <button
            onClick={() => router.replace('/turista/mapa')}
            style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Explorar el mapa
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de éxito ──
  if (done) return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(13,124,102,.3)' }}>
          <Check size={36} color="#fff" strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E26', marginBottom: 12 }}>¡Registro enviado!</h1>
        <p style={{ fontSize: 15, color: '#4a5a52', lineHeight: 1.6, marginBottom: 8 }}>
          Tu negocio <strong>{nombre}</strong> está en revisión por el equipo de Ola México.
        </p>
        <p style={{ fontSize: 13, color: '#8a9690', lineHeight: 1.6, marginBottom: 32 }}>
          Recibirás una notificación cuando sea aprobado y aparezca en el mapa.
        </p>
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e8e6e0', marginBottom: 28, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>¿Qué sigue?</div>
          {[
            ['1', 'El equipo revisa tu información'],
            ['2', 'Te contactamos si necesitamos algo más'],
            ['3', 'Tu negocio aparece en el mapa para turistas FIFA 2026'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0f7f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0D7C66' }}>{n}</span>
              </div>
              <span style={{ fontSize: 13, color: '#4a5a52', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.replace('/turista/mapa')}
          style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          Explorar el mapa
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0efeb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f7f6f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5a52' }}>
          <ArrowLeft size={20} color="#4a5a52" />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
            <ShieldCheck size={16} color="#1A9E78" />
          </div>
          <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 500 }}>Registrar negocio</div>
        </div>
        {session?.user?.image && (
          <img src={session.user.image} alt="" referrerPolicy="no-referrer"
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', border: '2px solid #e0f7f1' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 20px 60px' }}>

        <StepIndicator current={step} total={3} />

        {/* ── Paso 0: Info básica ── */}
        {step === 0 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', marginBottom: 14 }}>
                <Store size={24} color="#fff" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>Cuéntanos de tu negocio</h1>
              <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Esta información aparecerá en el mapa para los turistas del Mundial FIFA 2026.</p>
            </div>

            <Field label="Nombre del negocio *" hint="El nombre que los turistas verán en el mapa">
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onFocus={() => setFocused('nombre')}
                onBlur={() => setFocused('')}
                placeholder="Ej. Tacos de Canasta Don Memo"
                maxLength={80}
                style={inputStyle(focused === 'nombre')}
              />
            </Field>

            <Field label="Descripción *" hint="Mínimo 10 caracteres — qué ofreces, qué te hace especial">
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                onFocus={() => setFocused('desc')}
                onBlur={() => setFocused('')}
                placeholder="Ej. Auténticos tacos de canasta con 30 años de tradición familiar, a media cuadra del metro..."
                maxLength={300}
                rows={4}
                style={{ ...inputStyle(focused === 'desc'), resize: 'vertical', minHeight: 96 }}
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: descripcion.length > 250 ? '#C5A044' : '#8a9690', textAlign: 'right' }}>{descripcion.length}/300</p>
            </Field>

            <Field label="Categoría *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CATEGORIAS.map(cat => {
                  const selected = categoria === cat.slug
                  return (
                    <button key={cat.slug} onClick={() => setCategoria(cat.slug)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', borderRadius: 14, textAlign: 'left',
                        background: selected ? '#f0fdf8' : '#fff',
                        border: `1.5px solid ${selected ? '#0D7C66' : '#e8e6e0'}`,
                        cursor: 'pointer', transition: 'all .2s',
                      }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: selected ? '#0D7C66' : '#f7f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
                        <cat.Icon size={18} color={selected ? '#fff' : '#4a5a52'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#0D7C66' : '#1A2E26' }}>{cat.label}</div>
                        <div style={{ fontSize: 10, color: '#8a9690', lineHeight: 1.3 }}>{cat.desc}</div>
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
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>¿Cómo encontrarte?</h1>
              <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Los turistas necesitan saber dónde estás y cómo contactarte.</p>
            </div>

            <Field label="Foto del negocio" hint="Opcional — ayuda a los turistas a reconocer tu negocio">
              <ImageUploader
                onUploadComplete={(url) => setImagenUrl(url)}
                onUploadClear={() => setImagenUrl(undefined)}
              />
            </Field>

            <Field label="Teléfono *" hint="Con código de área, ej. 5512345678">
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a9690', display: 'flex' }}><Phone size={16} color="#8a9690" /></div>
                <input
                  value={telefono}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  onFocus={() => setFocused('tel')}
                  onBlur={() => setFocused('')}
                  placeholder="5512345678"
                  type="tel"
                  style={{ ...inputStyle(focused === 'tel'), paddingLeft: 36 }}
                />
              </div>
            </Field>

            <Field label="WhatsApp" hint="Opcional — si tienes número diferente al teléfono">
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Smartphone size={16} color="#8a9690" /></div>
                <input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  onFocus={() => setFocused('wa')}
                  onBlur={() => setFocused('')}
                  placeholder="5512345678"
                  type="tel"
                  style={{ ...inputStyle(focused === 'wa'), paddingLeft: 36 }}
                />
              </div>
            </Field>

            <Field label="Dirección *" hint="Calle, número, colonia, ciudad">
              <textarea
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                onFocus={() => setFocused('dir')}
                onBlur={() => setFocused('')}
                placeholder="Ej. Calle Madero 45, Col. Centro, CDMX"
                rows={2}
                style={{ ...inputStyle(focused === 'dir'), resize: 'none' }}
              />
            </Field>

            <Field label="Coordenadas GPS *" hint="Necesarias para aparecer en el mapa">
              <button onClick={usarUbicacion} disabled={geoLoading}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 10,
                  background: geoLoading ? '#f0efeb' : '#e0f7f1',
                  border: '1.5px dashed #0D7C66', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, color: '#0D7C66',
                }}>
                {geoLoading
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Obteniendo ubicación…</>
                  : <><LocateFixed size={15} /> Usar mi ubicación actual</>}
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8a9690', display: 'block', marginBottom: 4 }}>Latitud</label>
                  <input
                    value={lat}
                    onChange={e => setLat(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setFocused('lat')}
                    onBlur={() => setFocused('')}
                    placeholder="19.4326"
                    type="number"
                    step="any"
                    style={inputStyle(focused === 'lat')}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#8a9690', display: 'block', marginBottom: 4 }}>Longitud</label>
                  <input
                    value={lng}
                    onChange={e => setLng(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => setFocused('lng')}
                    onBlur={() => setFocused('')}
                    placeholder="-99.1332"
                    type="number"
                    step="any"
                    style={inputStyle(focused === 'lng')}
                  />
                </div>
              </div>
            </Field>

            <Field label="Etiquetas" hint="Opcional — palabras clave separadas por coma">
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                onFocus={() => setFocused('tags')}
                onBlur={() => setFocused('')}
                placeholder="Ej. vegano, tradicional, barato, familiar"
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
                <ShieldCheck size={16} color="#1A9E78" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>Confirma tu registro</h1>
              <p style={{ fontSize: 14, color: '#8a9690', lineHeight: 1.6 }}>Revisa que todo esté correcto antes de enviar.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8e6e0', overflow: 'hidden', marginBottom: 20 }}>
              {/* Cat badge */}
              <div style={{ background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{CATEGORIAS.find(c => c.slug === categoria)?.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{nombre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>{CATEGORIAS.find(c => c.slug === categoria)?.label}</div>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Descripción', value: descripcion },
                  { label: 'Teléfono',    value: telefono },
                  { label: 'WhatsApp',    value: whatsapp || '—' },
                  { label: 'Dirección',   value: direccion },
                  { label: 'Coordenadas', value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` },
                  { label: 'Etiquetas',   value: tags || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#1A2E26', lineHeight: 1.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #f0e68c', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>Revisión en 24–48 horas</div>
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>El equipo de Ola México verificará tu negocio antes de que aparezca en el mapa.</div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#C53030' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Botones de navegación ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '14px', background: '#fff', border: '1.5px solid #e0ddd5', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#4a5a52', cursor: 'pointer' }}>
              Atrás
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !canNext0 : !canNext1}
              style={{
                flex: 1, padding: '14px',
                background: (step === 0 ? canNext0 : canNext1) ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : '#e0ddd5',
                border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
                color: (step === 0 ? canNext0 : canNext1) ? '#fff' : '#aaa',
                cursor: (step === 0 ? canNext0 : canNext1) ? 'pointer' : 'not-allowed',
                transition: 'background .2s',
              }}>
              Continuar →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{
                flex: 1, padding: '14px',
                background: submitting ? '#e0ddd5' : 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
                color: submitting ? '#aaa' : '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
              {submitting ? 'Enviando…' : '✅ Enviar registro'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
