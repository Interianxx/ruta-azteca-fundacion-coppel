'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Phone, MessageCircle, MapPin, Map, Star, MessageSquare, Tag, Loader2, LogOut, Clock, Pencil, Check, X } from 'lucide-react'
import type { Horario, HorarioDia } from '@/types/negocio'

const CATEGORIA_LABELS: Record<string, string> = {
  comida: 'Comida y bebida', artesanias: 'Artesanías', hospedaje: 'Hospedaje',
  tours: 'Tours y guías', transporte: 'Transporte', otro: 'Otro',
}
const CATEGORIA_EMOJI: Record<string, string> = {
  comida: '🍜', artesanias: '🎨', hospedaje: '🏠', tours: '🗺️', transporte: '🚌', otro: '🏪',
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
  const [negocio, setNegocio] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  const [horario,       setHorario]       = useState<Horario>(DEFAULT_HORARIO)
  const [editingHorario, setEditingHorario] = useState(false)
  const [draftHorario,  setDraftHorario]  = useState<Horario>(DEFAULT_HORARIO)
  const [savingHorario, setSavingHorario] = useState(false)

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
  }, [status, router])

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2' }}>
      <Loader2 size={32} color="#0D7C66" style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!negocio) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2', fontFamily: 'system-ui,-apple-system,sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <MapPin size={48} color="#0D7C66" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1A2E26', marginBottom: 8 }}>Negocio no encontrado</div>
        <div style={{ fontSize: 14, color: '#8a9690', marginBottom: 24 }}>No encontramos datos de tu negocio.</div>
        <button onClick={() => router.push('/negocio/registro')}
          style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          Registrar negocio
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.9)', letterSpacing: '.06em' }}>RUTA AZTECA</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.3)', background: 'transparent', color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
              {CATEGORIA_EMOJI[negocio.categoria] ?? '🏪'}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{negocio.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                  {CATEGORIA_LABELS[negocio.categoria] ?? negocio.categoria}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                  ✓ Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '-40px auto 0', padding: '0 16px 40px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { Icon: Star,          label: 'Calificación', value: negocio.calificacion ? `${Number(negocio.calificacion).toFixed(1)}` : '—' },
            { Icon: MessageSquare, label: 'Reseñas',      value: negocio.totalReviews ?? 0 },
            { Icon: MapPin,        label: 'En el mapa',   value: '✓' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f0efeb' }}>
              <s.Icon size={18} color="#0D7C66" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1A2E26', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8e6e0', overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0efeb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Información del negocio</div>

            <p style={{ fontSize: 14, color: '#4a5a52', lineHeight: 1.7, margin: '0 0 16px' }}>{negocio.descripcion}</p>

            {[
              { Icon: Phone,          label: 'Teléfono',    val: negocio.telefono,    show: true },
              { Icon: MessageCircle,  label: 'WhatsApp',    val: negocio.whatsapp,    show: !!negocio.whatsapp },
              { Icon: MapPin,         label: 'Dirección',   val: negocio.direccion,   show: true },
              { Icon: Map,            label: 'Coordenadas', val: `${Number(negocio.lat).toFixed(5)}, ${Number(negocio.lng).toFixed(5)}`, show: true },
            ].filter(d => d.show).map(d => (
              <div key={d.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <d.Icon size={16} color="#0D7C66" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontSize: 14, color: '#1A2E26', fontWeight: 500 }}>{d.val}</div>
                </div>
              </div>
            ))}
          </div>

          {negocio.tags?.length > 0 && (
            <div style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Tag size={13} color="#8a9690" />
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.06em' }}>Etiquetas</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(negocio.tags as string[]).map(t => (
                  <span key={t} style={{ fontSize: 12, background: '#E0F7F1', color: '#0D7C66', borderRadius: 20, padding: '4px 12px', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horarios card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8e6e0', overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0efeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="#8a9690" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8a9690', textTransform: 'uppercase', letterSpacing: '.06em' }}>Horario de atención</span>
            </div>
            {!editingHorario && (
              <button onClick={startEditHorario} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0D7C66', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                <Pencil size={12} /> Editar
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
                    padding: '5px 0', borderBottom: i < 6 ? '1px solid #f8f7f4' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? '#0D7C66' : '#1A2E26', width: 90 }}>{label}</span>
                    {h.abierto
                      ? <span style={{ fontSize: 13, color: isToday ? '#0D7C66' : '#4a5a52', fontWeight: isToday ? 600 : 400 }}>{h.apertura} – {h.cierre}</span>
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
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 6 ? '1px solid #f8f7f4' : 'none', flexWrap: 'wrap' }}>
                    {/* Toggle */}
                    <button onClick={() => toggleDia(key)} style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: h.abierto ? '#0D7C66' : '#d0cec8', position: 'relative', transition: 'background .2s',
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
                  {savingHorario ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={14} />}
                  Guardar horarios
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/turista/mapa')}
          style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,124,102,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Map size={18} /> Ver mi negocio en el mapa
        </button>
      </div>
    </div>
  )
}
