'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Phone, MessageCircle, MapPin, Map, CheckCircle, XCircle, Loader2, PartyPopper } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0efeb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/admin/dashboard')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f7f6f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color="#4a5a52" />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2E26' }}>Negocios pendientes</div>
          <div style={{ fontSize: 11, color: '#8a9690' }}>{loading ? 'Cargando...' : `${negocios.length} solicitud${negocios.length !== 1 ? 'es' : ''}`}</div>
        </div>
        <button onClick={cargar} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', border: '1px solid #e8e6e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RefreshCw size={16} color="#4a5a52" />
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={32} color="#0D7C66" style={{ animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {!loading && negocios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <PartyPopper size={48} color="#0D7C66" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A2E26', marginBottom: 8 }}>Todo al día</div>
            <div style={{ fontSize: 14, color: '#8a9690' }}>No hay negocios pendientes de aprobación.</div>
          </div>
        )}

        {negocios.map(neg => (
          <div key={neg.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8e6e0', padding: '22px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            {/* Nombre + categoría */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1A2E26', marginBottom: 4 }}>{neg.nombre}</div>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#0D7C66', background: '#E0F7F1', borderRadius: 20, padding: '3px 10px' }}>
                  {CATEGORIA_LABELS[neg.categoria] ?? neg.categoria}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8a9690', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {new Date(neg.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Descripción */}
            <p style={{ fontSize: 13, color: '#4a5a52', lineHeight: 1.6, margin: '0 0 14px' }}>
              {neg.descripcion}
            </p>

            {/* Datos de contacto */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#4a5a52', background: '#f7f6f2', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={13} color="#4a5a52" /> {neg.telefono}
              </span>
              {neg.whatsapp && (
                <span style={{ fontSize: 12, color: '#4a5a52', background: '#f7f6f2', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MessageCircle size={13} color="#4a5a52" /> {neg.whatsapp}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#4a5a52', background: '#f7f6f2', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} color="#4a5a52" /> {neg.direccion}
              </span>
              <span style={{ fontSize: 12, color: '#4a5a52', background: '#f7f6f2', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Map size={13} color="#4a5a52" /> {neg.lat?.toFixed(4)}, {neg.lng?.toFixed(4)}
              </span>
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
