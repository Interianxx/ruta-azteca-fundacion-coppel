'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Phone, MessageCircle, MapPin, Map, CheckCircle, XCircle, Loader2, PartyPopper, Palette, BedDouble, Bus, LayoutGrid } from 'lucide-react'

interface NegocioPendiente {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  telefono: string
  whatsapp?: string
  direccion: string
  lat: number
  lng: number
  propietarioId: string
  propietarioEmail?: string
  createdAt: string
}

const CATEGORIA_ICONS: Record<string, any> = {
  comida: ({ size, color }: any) => <MapPin size={size} color={color} />, // Fallback or specific icons
  artesanias: Palette,
  hospedaje: BedDouble,
  tours: Map,
  transporte: Bus,
  otro: LayoutGrid,
}

const CATEGORIA_LABELS: Record<string, string> = {
  comida: 'Comida y bebida', artesanias: 'Artesanías', hospedaje: 'Hospedaje',
  tours: 'Tours y guías', transporte: 'Transporte', otro: 'Otro',
}

export default function PendientesPage() {
  const router = useRouter()
  const [negocios, setNegocios] = useState<NegocioPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; tipo: 'ok' | 'err'; msg: string } | null>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/pendientes')
      .then(r => r.json())
      .then(d => setNegocios(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const accion = async (negocio: NegocioPendiente, tipo: 'aprobar' | 'rechazar') => {
    setAccionando(negocio.id)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/aprobar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocio.id, propietarioId: negocio.propietarioId, propietarioEmail: negocio.propietarioEmail, accion: tipo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error')
      setFeedback({ id: negocio.id, tipo: 'ok', msg: tipo === 'aprobar' ? 'Negocio aprobado — ya aparece en el mapa' : 'Negocio rechazado' })
      setTimeout(() => { setNegocios(prev => prev.filter(n => n.id !== negocio.id)); setFeedback(null) }, 2000)
    } catch (e: any) {
      setFeedback({ id: negocio.id, tipo: 'err', msg: e.message ?? 'Error al procesar' })
    } finally {
      setAccionando(null)
    }
  }

  return (
    <div className="bg-jade-air" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      {/* Header Premium Jade Air Dense */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'var(--glass-blur)', 
        borderBottom: '1px solid rgba(13,124,102,0.1)', 
        padding: '16px 24px', 
        display: 'flex', alignItems: 'center', gap: 16, 
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <button onClick={() => router.push('/admin/dashboard')}
          className="btn-jade"
          style={{ width: 40, height: 40, borderRadius: 14, padding: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-jade-title" style={{ fontSize: 18 }}>Validaciones</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-jade-air-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{loading ? 'Cargando...' : `${negocios.length} trámites`}</span>
          </div>
        </div>
        <button onClick={cargar} 
          style={{ marginLeft: 'auto', width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(13,124,102,0.1)', background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
          <RefreshCw size={18} color="var(--color-jade-air-accent)" className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Loader2 size={32} color="var(--color-jade-air-accent)" className="animate-spin" />
          </div>
        )}

        {!loading && negocios.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <PartyPopper size={48} color="var(--color-jade-air-accent)" style={{ margin: '0 auto 16px' }} />
            <div className="text-jade-title" style={{ fontSize: 20, marginBottom: 8 }}>Todo al día</div>
            <div className="text-jade-muted">No hay solicitudes pendientes de aprobación en este momento.</div>
          </div>
        )}

        {negocios.map(neg => (
          <div key={neg.id} className="glass-card" style={{ padding: '24px', marginBottom: 20 }}>
            {/* Header Highlight */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(13,124,102,0.1), transparent)' }} />

            {/* Nombre + categoría */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   {(() => {
                     const Icon = (CATEGORIA_ICONS as any)[neg.categoria] || LayoutGrid
                     return <Icon size={24} color="var(--color-jade-air-accent)" />
                   })()}
                </div>
                <div>
                  <div className="text-jade-title" style={{ fontSize: 18, marginBottom: 2 }}>{neg.nombre}</div>
                  <span style={{ display: 'inline-flex', fontSize: 10, fontWeight: 800, color: 'var(--color-jade-air-accent)', background: 'var(--color-jade-air-light)', borderRadius: 8, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {CATEGORIA_LABELS[neg.categoria] ?? neg.categoria}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700, background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: 8 }}>
                {new Date(neg.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </div>
            </div>

            {/* Descripción */}
            <p className="text-jade-muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', fontWeight: 500 }}>
              {neg.descripcion}
            </p>

            {/* Datos de contacto Jade Air */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-main)', background: 'var(--color-jade-air-light)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Phone size={14} color="var(--color-jade-air-accent)" /> {neg.telefono}
              </div>
              {neg.whatsapp && (
                <div style={{ fontSize: 12, color: 'var(--text-main)', background: 'var(--color-jade-air-light)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <MessageCircle size={14} color="var(--color-jade-air-accent)" /> WhatsApp
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-main)', background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2', fontWeight: 500 }}>
                <MapPin size={14} color="var(--color-jade-air-accent)" /> {neg.direccion.split(',')[0]}
              </div>
            </div>

            {/* Feedback */}
            {feedback?.id === neg.id && (
              <div style={{ borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: feedback.tipo === 'ok' ? '#E0F7F1' : '#FEE2E2', color: feedback.tipo === 'ok' ? '#0D7C66' : '#DC2626', fontSize: 13, fontWeight: 600 }}>
                {feedback.tipo === 'ok'
                  ? <CheckCircle size={16} />
                  : <XCircle size={16} />}
                {feedback.msg}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => accion(neg, 'aprobar')}
                disabled={accionando === neg.id}
                style={{ flex: 1, padding: '12px', background: accionando === neg.id ? '#a0c8bc' : 'linear-gradient(135deg, #0D7C66, #1A9E78)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: accionando === neg.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                {accionando === neg.id
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando...</>
                  : <><CheckCircle size={16} /> Aprobar</>}
              </button>
              <button
                onClick={() => accion(neg, 'rechazar')}
                disabled={accionando === neg.id}
                style={{ flex: 1, padding: '12px', background: '#fff', border: '1.5px solid #fca5a5', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#DC2626', cursor: accionando === neg.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <XCircle size={16} /> Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
