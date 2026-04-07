'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, Eye, Star, MessageSquare, Phone, 
  MessageCircle, Loader2, LogOut, ArrowLeft, 
  TrendingUp, MousePointer2 
} from 'lucide-react'

interface MetricasNegocio {
  vistas: number
  calificacion: number | null
  totalReviews: number
  clicks_whatsapp: number
  clicks_telefono: number
}

export default function MetricasNegocioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [negocio, setNegocio] = useState<any>(null)
  const [metricas, setMetricas] = useState<MetricasNegocio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }

    const fetchData = async () => {
      try {
        // 1. Obtener mi negocio
        const resMio = await fetch('/api/negocios/mio')
        const dataMio = await resMio.json()
        
        if (!dataMio.data) {
          setLoading(false)
          return
        }
        
        setNegocio(dataMio.data)

        // 2. Obtener métricas usando el ID del negocio
        const resMet = await fetch(`/api/negocios/${dataMio.data.id}/metricas`)
        const dataMet = await resMet.json()
        setMetricas(dataMet.data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status, router])

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f3fbfa 0%, #dff2ec 100%)' }}>
      <Loader2 size={40} color="#0D7C66" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!negocio) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2', padding: 24 }}>
      <div className="glass-panel-map" style={{ padding: 32, borderRadius: 24, textAlign: 'center', maxWidth: 400 }}>
        <TrendingUp size={48} color="#8a9690" style={{ marginBottom: 16, opacity: 0.5 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Sin negocio registrado</h2>
        <p style={{ fontSize: 14, color: '#8a9690', marginBottom: 24 }}>Registra tu negocio para empezar a ver tus métricas de rendimiento.</p>
        <button 
          onClick={() => router.push('/negocio/registro')}
          style={{ width: '100%', padding: 14, background: '#0D7C66', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Ir a registro
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f3fbfa 0%, #dff2ec 100%)',
      fontFamily: 'var(--font-inter), sans-serif',
      color: '#1A2E26',
      paddingBottom: 40
    }}>
      {/* Header Jade Aura */}
      <div style={{ background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', padding: '40px 24px 80px', color: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button 
              onClick={() => router.push('/negocio/perfil')}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
            >
              <ArrowLeft size={16} /> Perfil
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={16} /> Salir
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={28} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Centro de Rendimiento</div>
              <h1 style={{ fontSize: 24, fontWeight: 900 }}>{negocio.nombre}</h1>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 600, margin: '-40px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Fila Principal de Impacto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <StatCard 
            label="Vistas al Perfil" 
            value={metricas?.vistas ?? 0} 
            icon={<Eye size={20} color="#0D7C66" />} 
            subtitle="Alcance total"
          />
          <StatCard 
            label="Calificación" 
            value={metricas?.calificacion?.toFixed(1) ?? '—'} 
            icon={<Star size={20} color="#C5A044" />} 
            subtitle={`${metricas?.totalReviews ?? 0} reseñas`}
          />
        </div>

        {/* Clicks e Interacciones */}
        <div className="glass-panel-map" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MousePointer2 size={20} color="#0D7C66" />
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>Interacciones de Contacto</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InteractionRow 
              label="Clics en WhatsApp" 
              value={metricas?.clicks_whatsapp ?? 0} 
              icon={<MessageCircle size={18} color="#25D366" />} 
              color="#25D366" 
            />
            <InteractionRow 
              label="Clics en Teléfono" 
              value={metricas?.clicks_telefono ?? 0} 
              icon={<Phone size={18} color="#0D7C66" />} 
              color="#0D7C66" 
            />
          </div>

          <div style={{ 
            marginTop: 8, padding: 16, borderRadius: 16, background: 'rgba(13, 124, 102, 0.05)', 
            border: '1px solid rgba(13, 124, 102, 0.1)', fontSize: 13, color: '#4d5d55', lineHeight: 1.5
          }}>
            <strong>Tip:</strong> Los clics reflejan el interés directo de los turistas en contactarte para servicios o reservas.
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
           <p style={{ fontSize: 11, color: '#8a9690', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Métricas actualizadas en tiempo real · Ruta Azteca 2026
           </p>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, subtitle }: { label: string; value: string | number; icon: React.ReactNode; subtitle: string }) {
  return (
    <div className="glass-panel-map" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 8px 24px rgba(13,124,102,0.08)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1A2E26' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26', marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>{subtitle}</div>
      </div>
    </div>
  )
}

function InteractionRow({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '14px 16px', background: 'rgba(255,255,255,0.4)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      </div>
      <span style={{ fontSize: 18, fontWeight: 900, color: '#1A2E26' }}>{value}</span>
    </div>
  )
}
