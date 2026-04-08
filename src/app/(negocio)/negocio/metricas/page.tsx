'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, MessageCircle, Phone, Star, TrendingUp, Loader2, ArrowLeft, MousePointer2 } from 'lucide-react'

interface MetricasData {
  vistas: number
  calificacion: number | null
  totalReviews: number
  clicks_whatsapp: number
  clicks_telefono: number
}

export default function MetricasPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [metricas, setMetricas] = useState<MetricasData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }

    const fetchMetricas = async () => {
      try {
        const resMio = await fetch('/api/negocios/mio')
        const dataMio = await resMio.json()
        
        if (dataMio.data?.id) {
          const resMet = await fetch(`/api/negocios/${dataMio.data.id}/metricas`)
          const j = await resMet.json()
          setMetricas(j.data ?? null)
        }
      } catch (err) {
        console.error('Error fetching metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetricas()
  }, [status, router])

  if (status === 'loading' || loading) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen">
      <Loader2 size={40} color="var(--color-jade-air-accent)" className="animate-spin" />
    </div>
  )

  const cards = [
    { title: 'Visualizaciones', value: metricas?.vistas ?? 0, icon: Eye, color: 'var(--color-jade-air-accent)', label: 'Vistas totales' },
    { title: 'WhatsApp', value: metricas?.clicks_whatsapp ?? 0, icon: MessageCircle, color: '#25D366', label: 'Clicks en botón' },
    { title: 'Llamadas', value: metricas?.clicks_telefono ?? 0, icon: Phone, color: '#3B82F6', label: 'Clicks en teléfono' },
    { title: 'Reputación', value: metricas?.calificacion ? metricas.calificacion.toFixed(1) : '—', icon: Star, color: '#C5A044', label: `${metricas?.totalReviews ?? 0} opiniones` },
  ]

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 40 }}>
      {/* Header Premium Jade Air Dense */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)', 
        padding: '32px 24px 60px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-jade-title" style={{ fontSize: 22, color: '#fff' }}>Estadísticas de Impacto</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Descubre cómo interactúan los turistas con tu negocio</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '-30px auto 0', padding: '0 16px' }}>
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {cards.map(card => (
            <div key={card.title} className="glass-card" style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={18} color={card.color} />
                </div>
                <TrendingUp size={14} color="var(--color-jade-air-accent)" style={{ opacity: 0.3 }} />
              </div>
              <div className="text-jade-title" style={{ fontSize: 28, marginBottom: 2 }}>{card.value}</div>
              <div className="text-jade-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' }}>{card.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Resumen card Dense */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-jade-air-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MousePointer2 size={20} color="#fff" />
             </div>
             <div>
                <h3 className="text-jade-title" style={{ fontSize: 16 }}>Rendimiento Actual</h3>
                <p className="text-jade-muted" style={{ fontSize: 12 }}>Tu negocio está ganando visibilidad en la plataforma.</p>
             </div>
          </div>
          
          <div style={{ background: 'rgba(13, 124, 102, 0.05)', borderRadius: 16, padding: '16px', border: '1px solid rgba(13,124,102,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-jade-air-accent)' }}>Tasa de Conversión</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--color-jade-air-accent)' }}>
                {metricas?.vistas ? (((metricas.clicks_whatsapp + metricas.clicks_telefono) / metricas.vistas) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(13,124,102,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${Math.min(100, (metricas?.vistas ? ((metricas.clicks_whatsapp + metricas.clicks_telefono) / metricas.vistas) * 100 : 0))}%`, 
                background: 'var(--color-jade-air-accent)',
                borderRadius: 4
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>Calculado en base a clics directos (WhatsApp/Teléfono) vs visualizaciones.</p>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', padding: '32px 0 16px' }}>
           <p style={{ fontSize: 11, color: 'var(--color-jade-air-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>
             Métricas actualizadas en tiempo real · Ruta Azteca 2026
           </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
