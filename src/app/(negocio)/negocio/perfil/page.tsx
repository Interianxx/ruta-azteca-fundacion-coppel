'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Phone, MessageCircle, MapPin, Map, Star, 
  MessageSquare, Tag, Loader2, LogOut, Clock, 
  Pencil, Check, X, ShieldCheck, Palette, 
  BedDouble, Bus, LayoutGrid, CheckCircle2 
} from 'lucide-react'
import type { Horario, HorarioDia } from '@/types/negocio'

const CATEGORIA_LABELS: Record<string, string> = {
  comida: 'Comida y bebida', artesanias: 'Artesanías', hospedaje: 'Hospedaje',
  tours: 'Tours y guías', transporte: 'Transporte', otro: 'Otro',
}

const CATEGORIA_ICONS: Record<string, any> = {
  comida: Phone, // Fallback logic handles special cases
  artesanias: Palette,
  hospedaje: BedDouble,
  tours: Map,
  transporte: Bus,
  otro: LayoutGrid,
}

const CATEGORIA_EMOJI: Record<string, string> = {
  comida: '🥘', artesanias: '🎨', hospedaje: '🏨',
  tours: '🗺️', transporte: '🚐', otro: '🏪'
}

const DIAS: { key: keyof Horario; label: string }[] = [
  { key: 'lun', label: 'Lunes' },     { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' }, { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },   { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

const DEFAULT_HORARIO: Horario = {
  lun: { abierto: true,  apertura: '09:00', cierre: '20:00' },
  mar: { abierto: true,  apertura: '09:00', cierre: '20:00' },
  mie: { abierto: true,  apertura: '09:00', cierre: '20:00' },
  jue: { abierto: true,  apertura: '09:00', cierre: '20:00' },
  vie: { abierto: true,  apertura: '09:00', cierre: '20:00' },
  sab: { abierto: true,  apertura: '10:00', cierre: '18:00' },
  dom: { abierto: false, apertura: '10:00', cierre: '16:00' },
}

export default function PerfilNegocioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 768 : true
  
  const [negocio, setNegocio] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  const [horario,       setHorario]       = useState<Horario>(DEFAULT_HORARIO)
  const [editingHorario, setEditingHorario] = useState(false)
  const [draftHorario,  setDraftHorario]  = useState<Horario>(DEFAULT_HORARIO)
  const [savingHorario, setSavingHorario] = useState(false)

  const userEmail = session?.user?.email ?? null

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }
    fetch('/api/negocios/mio')
      .then(r => r.json())
      .then(d => {
        setNegocio(d.data ?? null)
        if (d.data?.horario) {
          setHorario(d.data.horario)
          setDraftHorario(d.data.horario)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, router, userEmail])

  const startEditHorario = () => { setDraftHorario(horario); setEditingHorario(true) }
  const cancelEditHorario = () => setEditingHorario(false)

  const toggleDia = (key: keyof Horario) =>
    setDraftHorario(prev => ({ ...prev, [key]: { ...prev[key], abierto: !prev[key].abierto } }))

  const updateTime = (key: keyof Horario, field: 'apertura' | 'cierre', val: string) =>
    setDraftHorario(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }))

  const saveHorario = async () => {
    if (!negocio?.id) return
    setSavingHorario(true)
    try {
      const res = await fetch(`/api/negocios/${negocio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horario: draftHorario }),
      })
      if (res.ok) {
        setHorario(draftHorario)
        setEditingHorario(false)
      }
    } finally {
      setSavingHorario(false)
    }
  }

  if (status === 'loading' || loading) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen">
      <Loader2 size={40} color="var(--color-jade-air-accent)" className="animate-spin" />
    </div>
  )

  if (!negocio) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen p-6">
      <div className="glass-card" style={{ textAlign: 'center', maxWidth: 400, padding: '40px 32px' }}>
        <MapPin size={48} color="var(--color-jade-air-accent)" style={{ margin: '0 auto 20px' }} />
        <h2 className="text-jade-title" style={{ fontSize: 20, marginBottom: 12 }}>Negocio no encontrado</h2>
        <p className="text-jade-muted" style={{ fontSize: 14, marginBottom: 32 }}>No encontramos datos asociados a tu cuenta. ¿Ya completaste tu registro?</p>
        <button onClick={() => router.push('/negocio/registro')} className="btn-jade" style={{ width: '100%', padding: '14px' }}>
          Registrar negocio ahora
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 60 }}>
      {/* Header Premium Jade Air Dense */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)', 
        padding: '60px 24px 100px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Aura */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '.05em' }}>RUTA AZTECA</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ padding: isDesktop ? '8px 16px' : '8px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
              <LogOut size={14} /> {isDesktop && 'Salir'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 24, 
              background: 'rgba(255,255,255,0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 40, flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(12px)'
            }}>
              {CATEGORIA_EMOJI[negocio.categoria] ?? '🏪'}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>{negocio.nombre}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '5px 12px', fontWeight: 700, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {CATEGORIA_LABELS[negocio.categoria] ?? negocio.categoria}
                </span>
                {negocio.estado === 'PENDING' ? (
                  <span style={{ fontSize: 12, color: '#FEF3C7', background: 'rgba(217, 119, 6, 0.2)', borderRadius: 12, padding: '5px 12px', fontWeight: 700, border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> En revisión
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#D1FAE5', background: 'rgba(5, 150, 105, 0.2)', borderRadius: 12, padding: '5px 12px', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={12} /> Verificado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '-50px auto 0', padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
        
        {/* Warning Banner if Pending */}
        {negocio.estado === 'PENDING' && (
          <div className="glass-panel-map" style={{ 
            borderRadius: 20, padding: '16px 24px', 
            background: 'rgba(255, 251, 235, 0.9)', 
            border: '1px solid #FEF3C7', 
            color: '#92400e', 
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={20} color="#D97706" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
              <strong>Tu negocio aún no es público en el mapa.</strong> El equipo de Ruta Azteca lo activará en las próximas 24–48 horas tras validar tu información.
            </div>
          </div>
        )}

        {/* Stats Grid Jade Air Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { Icon: Star,          label: 'Ranking',   value: negocio.calificacion ? `${Number(negocio.calificacion).toFixed(1)}` : '—' },
            { Icon: MessageSquare, label: 'Opiniones',  value: negocio.totalReviews ?? 0 },
            { Icon: MapPin,        label: 'Estado Map', value: negocio.estado === 'PENDING' ? '⏳' : '✓' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
              <s.Icon size={20} color="var(--color-jade-air-accent)" style={{ margin: '0 auto 8px' }} />
              <div className="text-jade-title" style={{ fontSize: 24, marginBottom: 2 }}>{s.value}</div>
              <div className="text-jade-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info card Jade Air */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '24px 24px', borderBottom: '1px solid rgba(13,124,102,0.06)' }}>
            <div className="text-jade-muted" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Perfil del negocio</div>

            <p className="text-jade-muted" style={{ fontSize: 15, marginBottom: 24, color: 'var(--text-main)', fontWeight: 500 }}>{negocio.descripcion}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { Icon: Phone,          label: 'Contacto',    val: negocio.telefono,    show: true },
                { Icon: MessageCircle,  label: 'Plataforma',    val: 'WhatsApp',    show: !!negocio.whatsapp },
                { Icon: MapPin,         label: 'Ubicación',   val: negocio.direccion.split(',')[0],   show: true },
                { Icon: Map,            label: 'Mapa', val: 'Coordenadas ✓', show: true },
              ].filter(d => d.show).map(d => (
                <div key={d.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <d.Icon size={16} color="var(--color-jade-air-accent)" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{d.label}</div>
                    <div className="text-jade-title" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {negocio.tags?.length > 0 && (
            <div style={{ padding: '20px 24px' }}>
              <div className="text-jade-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Especialidades</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(negocio.tags as string[]).map(t => (
                  <span key={t} style={{ fontSize: 12, background: 'var(--color-jade-air-light)', color: 'var(--color-jade-air-accent)', border: '1px solid rgba(13,124,102,0.1)', borderRadius: 10, padding: '6px 14px', fontWeight: 700 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horarios Jade Air */}
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(13,124,102,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--color-jade-air-accent)" />
              <span className="text-jade-muted" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>Horario de atención</span>
            </div>
            {!editingHorario && (
              <button onClick={startEditHorario} style={{ fontSize: 12, color: 'var(--color-jade-air-accent)', fontWeight: 800, background: 'var(--color-jade-air-light)', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 10 }}>
                EDITAR
              </button>
            )}
          </div>

          {/* Vista de solo lectura */}
          {!editingHorario && (
            <div style={{ padding: '10px 20px 14px' }}>
              {DIAS.map(({ key, label }, i) => {
                const h: HorarioDia = horario[key]
                const todayKey = (['dom','lun','mar','mie','jue','vie','sab'] as const)[new Date().getDay()]
                const isToday = key === todayKey
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: i < 6 ? '1px solid rgba(13,124,102,0.05)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--color-jade-air-accent)' : '#1A2E26', width: 90 }}>{label}</span>
                    {h.abierto
                      ? <span style={{ fontSize: 13, color: isToday ? 'var(--color-jade-air-accent)' : '#4a5a52', fontWeight: isToday ? 600 : 400 }}>{h.apertura} – {h.cierre}</span>
                      : <span style={{ fontSize: 13, color: '#DC2626' }}>Cerrado</span>
                    }
                  </div>
                )
              })}
            </div>
          )}

          {/* Editor */}
          {editingHorario && (
            <div style={{ padding: '10px 20px 16px' }}>
              {DIAS.map(({ key, label }, i) => {
                const h: HorarioDia = draftHorario[key]
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 6 ? '1px solid rgba(13,124,102,0.05)' : 'none', flexWrap: 'wrap' }}>
                    {/* Toggle */}
                    <button onClick={() => toggleDia(key)} style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: h.abierto ? 'var(--color-jade-air-accent)' : '#d0cec8', position: 'relative', transition: 'background .2s',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                        position: 'absolute', top: 2, left: h.abierto ? 18 : 2, transition: 'left .2s',
                      }} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2E26', width: 82 }}>{label}</span>
                    {h.abierto ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="time" value={h.apertura} onChange={e => updateTime(key, 'apertura', e.target.value)}
                          style={{ fontSize: 13, border: '1.5px solid #e0ddd5', borderRadius: 8, padding: '4px 8px', color: '#1A2E26', background: '#fafaf8', width: 90 }} />
                        <span style={{ fontSize: 12, color: '#8a9690' }}>–</span>
                        <input type="time" value={h.cierre} onChange={e => updateTime(key, 'cierre', e.target.value)}
                          style={{ fontSize: 13, border: '1.5px solid #e0ddd5', borderRadius: 8, padding: '4px 8px', color: '#1A2E26', background: '#fafaf8', width: 90 }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Cerrado</span>
                    )}
                  </div>
                )
              })}

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={cancelEditHorario} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e0ddd5', background: '#fff', color: '#8a9690', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={saveHorario} disabled={savingHorario} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0D7C66,#1A9E78)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {savingHorario ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Guardar horarios
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/turista/mapa')}
          className="btn-jade"
          style={{ width: '100%', padding: '18px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Map size={20} /> Preview en el mapa
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
