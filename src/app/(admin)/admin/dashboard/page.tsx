'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, Store, Eye, Star, Globe, Clock, 
  CheckCircle, XCircle, LogOut, Loader2, ArrowUpRight,
  TrendingUp, Languages, AlertCircle
} from 'lucide-react'

// --- Tipos para Métricas ---
interface MetricasBase { negociosActivos: number; negociosPendientes: number }
interface MetricaVistas { totalVistas: number; porNegocio: { nombre: string; vistas: number }[] }
interface MetricaPuntaje { promedioGlobal: number; totalResenas: number; porNegocio: { nombre: string; calificacion: number }[] }
interface MetricaIdiomas { total: number; porIdioma: { idioma: string; visitas: number; porcentaje: number }[] }

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<MetricasBase | null>(null)
  const [vistas, setVistas] = useState<MetricaVistas | null>(null)
  const [puntaje, setPuntaje] = useState<MetricaPuntaje | null>(null)
  const [idiomas, setIdiomas] = useState<MetricaIdiomas | null>(null)
  const [pendientes, setPendientes] = useState<any[]>([])
  const [procesandoId, setProcesandoId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }

    const fetchData = async () => {
      try {
        const [m, v, p, i, pend] = await Promise.all([
          fetch('/api/admin/metricas').then(r => r.json()),
          fetch('/api/admin/metricas/vistas').then(r => r.json()),
          fetch('/api/admin/metricas/puntuacion').then(r => r.json()),
          fetch('/api/admin/metricas/idiomas').then(r => r.json()),
          fetch('/api/admin/pendientes').then(r => r.json())
        ])
        setMetricas(m.data)
        setVistas(v.data)
        setPuntaje(p.data)
        setIdiomas(i.data)
        setPendientes(pend.data?.items ?? [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [status, session])
  const handleAccion = async (negocio: any, accion: 'aprobar' | 'rechazar') => {
    setProcesandoId(negocio.id)
    try {
      const res = await fetch('/api/admin/aprobar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocioId: negocio.id,
          propietarioId: negocio.propietarioId,
          propietarioEmail: negocio.propietarioEmail,
          accion
        })
      })
      if (res.ok) {
        setPendientes(prev => prev.filter(p => p.id !== negocio.id))
        setMetricas(prev => prev ? { 
          ...prev, 
          negociosPendientes: prev.negociosPendientes - 1,
          negociosActivos: accion === 'aprobar' ? prev.negociosActivos + 1 : prev.negociosActivos
        } : null)
      }
    } catch (err) {
      alert('Error al procesar la solicitud')
    } finally {
      setProcesandoId(null)
    }
  }

  if (status === 'loading' || loading) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen">
      <Loader2 size={40} color="var(--color-jade-air-accent)" className="animate-spin" />
    </div>
  )

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 60 }}>
      {/* Header Premium Jade Air Dense */}
      <header style={{ 
        padding: isDesktop ? '16px 40px' : '12px 20px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid rgba(13, 102, 102, 0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'var(--color-jade-air-accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users color="#fff" size={24} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--color-jade-air-accent)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>RUTA AZTECA</div>
            <div className="text-jade-title" style={{ fontSize: 18 }}>Admin Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{session?.user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Administrador Central</div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-jade"
            style={{ width: 44, height: 44, padding: 0 }}
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* KPI Cards Dense Design */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard title="Negocios Activos" value={metricas?.negociosActivos ?? 0} icon={<Store color="#0D7C66" />} color="#0D7C66" />
          <KPICard title="Vistas Totales" value={vistas?.totalVistas ?? 0} icon={<Eye color="#1A9E78" />} color="#1A9E78" />
          <KPICard title="Puntuación Global" value={puntaje?.promedioGlobal?.toFixed(1) ?? '—'} icon={<Star color="#C5A044" />} color="#C5A044" />
          <KPICard title="Visitantes" value={idiomas?.total ?? 0} icon={<Languages color="#0D7C66" />} color="#0D7C66" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitudes Pendientes Dense Glass */}
          <section className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock color="var(--color-jade-air-accent)" size={22} />
                <h2 className="text-jade-title" style={{ fontSize: 18 }}>Solicitudes Pendientes</h2>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(13, 124, 102, 0.1)', color: 'var(--color-jade-air-accent)', padding: '4px 12px', borderRadius: 12, fontWeight: 800 }}>
                {pendientes.length} POR REVISAR
              </span>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendientes.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <CheckCircle size={40} color="var(--color-jade-air-accent)" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p className="text-jade-title" style={{ fontSize: 14 }}>¡Todo al día!</p>
                  <p className="text-jade-muted" style={{ fontSize: 12 }}>No hay negocios esperando aprobación.</p>
                </div>
              ) : (
                pendientes.map(p => (
                  <div key={p.id} style={{ 
                    padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.4)', 
                    border: '1px solid rgba(13,102,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(13, 124, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                         {CATEGORIA_ICON[p.categoria] ?? '🏪'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.propietarioEmail}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        disabled={!!procesandoId}
                        onClick={() => handleAccion(p, 'aprobar')}
                        className="btn-jade"
                        style={{ width: 38, height: 38, borderRadius: 10, opacity: procesandoId === p.id ? 0.5 : 1 }}
                      >
                        {procesandoId === p.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      </button>
                      <button 
                         disabled={!!procesandoId}
                         onClick={() => handleAccion(p, 'rechazar')}
                         style={{ 
                          width: 38, height: 38, borderRadius: 10, background: 'rgba(229, 62, 62, 0.1)', color: '#fc8181', 
                          border: '1px solid rgba(229, 62, 62, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             {/* Idiomas Dense Glass */}
             <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Languages color="var(--color-jade-air-accent)" size={20} />
                  <h3 className="text-jade-title" style={{ fontSize: 16 }}>Visitantes por Idioma</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {idiomas?.porIdioma.map(i => (
                    <div key={i.idioma}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                        <span>{i.idioma === 'es' ? 'Español' : i.idioma === 'en' ? 'Inglés' : i.idioma === 'fr' ? 'Francés' : i.idioma}</span>
                        <span>{i.porcentaje}%</span>
                      </div>
                      <div style={{ height: 6, width: '100%', background: 'rgba(13, 124, 102, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${i.porcentaje}%`, background: 'var(--color-jade-air-accent)', borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Top Negocios Dense Glass */}
             <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <TrendingUp color="#1A9E78" size={20} />
                  <h3 className="text-jade-title" style={{ fontSize: 16 }}>Top Negocios (Vistas)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vistas?.porNegocio.slice(0, 5).map((n, idx) => (
                    <div key={n.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.3)', borderRadius: 12, border: '1px solid rgba(13,102,102,0.05)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--color-jade-air-accent)' }}>#{idx+1}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{n.nombre}</span>
                       </div>
                       <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{n.vistas} <Eye size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 2 }} /></span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

// --- Componentes Atómicos ---
function KPICard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-panel-map" style={{ 
      padding: '24px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 20,
      transition: 'transform 0.2s', cursor: 'default'
    }}>
      <div style={{ 
        width: 56, height: 56, borderRadius: 18, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1A2E26', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#8a9690', fontWeight: 600, marginTop: 4 }}>{title}</div>
      </div>
    </div>
  )
}

const CATEGORIA_ICON: Record<string, string> = {
  comida: '🥘', artesanias: '🎨', hospedaje: '🏨',
  tours: '🗺️', transporte: '🚐', otro: '🏪'
}

const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 768 : true

