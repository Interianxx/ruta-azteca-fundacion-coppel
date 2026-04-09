'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Store, Eye, Star, Globe, Clock,
  CheckCircle, XCircle, LogOut, Loader2,
  TrendingUp, Languages, RefreshCw, LayoutGrid, Tag,
} from 'lucide-react'

interface MetricasBase { negociosActivos: number; negociosPendientes: number }
interface MetricaVistas { totalVistas: number; porNegocio: { nombre: string; vistas: number }[] }
interface MetricaPuntaje { promedioGlobal: number; totalResenas: number; porNegocio: { nombre: string; calificacion: number; totalReviews: number }[] }
interface MetricaIdiomas { total: number; porIdioma: { idioma: string; visitas: number; porcentaje: number }[] }

const IDIOMA_LABEL: Record<string, string> = {
  es: 'Español', en: 'Inglés', fr: 'Francés', pt: 'Portugués', de: 'Alemán',
}

const CATEGORIA_ICON: Record<string, string> = {
  comida: '🥘', artesanias: '🎨', hospedaje: '🏨',
  tours: '🗺️', transporte: '🚐', otro: '🏪',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [isDesktop, setIsDesktop] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<MetricasBase | null>(null)
  const [vistas, setVistas] = useState<MetricaVistas | null>(null)
  const [puntaje, setPuntaje] = useState<MetricaPuntaje | null>(null)
  const [idiomas, setIdiomas] = useState<MetricaIdiomas | null>(null)
  const [pendientes, setPendientes] = useState<any[]>([])
  const [procesandoId, setProcesandoId] = useState<string | null>(null)

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768)
  }, [])

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [m, v, p, i, pend] = await Promise.all([
        fetch('/api/admin/metricas').then(r => r.json()),
        fetch('/api/admin/metricas/vistas').then(r => r.json()),
        fetch('/api/admin/metricas/puntuacion').then(r => r.json()),
        fetch('/api/admin/metricas/idiomas').then(r => r.json()),
        fetch('/api/admin/pendientes').then(r => r.json()),
      ])
      setMetricas(m.data)
      setVistas(v.data)
      setPuntaje(p.data)
      setIdiomas(i.data)
      setPendientes(pend.data?.items ?? [])
    } catch {
      // silencioso — datos previos se mantienen
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    if ((session as any).rol !== 'admin') { router.push('/login'); return }
    fetchData()
  }, [status, session, fetchData, router])

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
          accion,
        }),
      })
      if (res.ok) {
        setPendientes(prev => prev.filter(p => p.id !== negocio.id))
        setMetricas(prev => prev ? {
          ...prev,
          negociosPendientes: prev.negociosPendientes - 1,
          negociosActivos: accion === 'aprobar' ? prev.negociosActivos + 1 : prev.negociosActivos,
        } : null)
      }
    } catch {
      alert('Error al procesar la solicitud')
    } finally {
      setProcesandoId(null)
    }
  }

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3fbfa' }}>
      <Loader2 size={40} color="#0D7C66" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 60 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{
        padding: isDesktop ? '16px 40px' : '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(13,102,102,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: '#0D7C66', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users color="#fff" size={22} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '0.12em' }}>RUTA AZTECA</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2E26' }}>Admin Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refrescar métricas"
            style={{
              width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(13,102,102,0.15)',
              background: 'rgba(13,124,102,0.06)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RefreshCw size={18} color="#0D7C66" style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2E26' }}>{session?.user?.name}</div>
            <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 600 }}>Administrador</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
            style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(229,62,62,0.2)', background: 'rgba(229,62,62,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={18} color="#e53e3e" />
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '8px 24px', borderBottom: '1px solid rgba(13,102,102,0.08)',
        background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
        overflowX: 'auto',
      }}>
        {[
          { href: '/admin/dashboard', label: 'Dashboard', icon: <Globe size={15} />, active: true },
          { href: '/admin/pendientes', label: `Pendientes${metricas?.negociosPendientes ? ` (${metricas.negociosPendientes})` : ''}`, icon: <Clock size={15} />, active: false },
          { href: '/admin/categorias', label: 'Categorías', icon: <Tag size={15} />, active: false },
        ].map(tab => (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
            background: tab.active ? '#0D7C66' : 'transparent',
            color: tab.active ? '#fff' : '#8a9690',
            transition: 'all 0.15s',
          }}>
            {tab.icon} {tab.label}
          </Link>
        ))}
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* KPI Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 16 }}>
          <KPICard title="Negocios Activos"  value={metricas?.negociosActivos ?? 0}            icon={<Store size={24} color="#0D7C66" />}    color="#0D7C66" />
          <KPICard title="Vistas Totales"    value={vistas?.totalVistas ?? 0}                  icon={<Eye size={24} color="#1A9E78" />}       color="#1A9E78" />
          <KPICard title="Puntuación Global" value={puntaje?.promedioGlobal ? puntaje.promedioGlobal.toFixed(1) : '—'} icon={<Star size={24} color="#C5A044" />} color="#C5A044" />
          <KPICard title="Visitantes"        value={idiomas?.total ?? 0}                       icon={<Languages size={24} color="#0D7C66" />} color="#0D7C66" />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 20 }}>

          {/* Solicitudes Pendientes */}
          <section style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(13,102,102,0.1)', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock color="#0D7C66" size={20} />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#1A2E26' }}>Solicitudes Pendientes</span>
              </div>
              <Link href="/admin/pendientes" style={{
                fontSize: 11, background: 'rgba(13,124,102,0.1)', color: '#0D7C66',
                padding: '4px 12px', borderRadius: 10, fontWeight: 800, textDecoration: 'none',
              }}>
                {pendientes.length} por revisar →
              </Link>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.5 }}>
                  <CheckCircle size={36} color="#0D7C66" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A2E26' }}>¡Todo al día!</p>
                </div>
              ) : (
                pendientes.map(p => (
                  <div key={p.id} style={{
                    padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(13,102,102,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(13,124,102,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {CATEGORIA_ICON[p.categoria] ?? '🏪'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2E26' }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: '#8a9690' }}>{p.propietarioEmail}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        disabled={!!procesandoId}
                        onClick={() => handleAccion(p, 'aprobar')}
                        style={{ width: 34, height: 34, borderRadius: 9, background: '#0D7C66', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: procesandoId === p.id ? 0.5 : 1 }}
                      >
                        {procesandoId === p.id
                          ? <Loader2 size={16} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                          : <CheckCircle size={16} color="#fff" />}
                      </button>
                      <button
                        disabled={!!procesandoId}
                        onClick={() => handleAccion(p, 'rechazar')}
                        style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <XCircle size={16} color="#e53e3e" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Visitantes por Idioma */}
            <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(13,102,102,0.1)', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Languages color="#0D7C66" size={18} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1A2E26' }}>Visitantes por Idioma</span>
              </div>
              {!idiomas || idiomas.porIdioma.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.4 }}>
                  <Globe size={28} color="#0D7C66" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 12, color: '#8a9690' }}>Sin datos aún — se registran al ver negocios</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {idiomas.porIdioma.map(i => (
                    <div key={i.idioma}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#1A2E26' }}>
                        <span>{IDIOMA_LABEL[i.idioma] ?? i.idioma}</span>
                        <span style={{ color: '#8a9690' }}>{i.visitas.toLocaleString()} ({i.porcentaje}%)</span>
                      </div>
                      <div style={{ height: 7, width: '100%', background: 'rgba(13,124,102,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${i.porcentaje}%`, background: 'linear-gradient(90deg,#0D7C66,#1A9E78)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Negocios — Vistas */}
            <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(13,102,102,0.1)', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp color="#1A9E78" size={18} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1A2E26' }}>Top Negocios — Vistas</span>
              </div>
              {!vistas || vistas.porNegocio.length === 0 ? (
                <p style={{ fontSize: 12, color: '#8a9690', textAlign: 'center', padding: '16px 0', opacity: 0.5 }}>Sin vistas registradas aún</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vistas.porNegocio.slice(0, 5).map((n, idx) => (
                    <div key={n.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.4)', borderRadius: 10, border: '1px solid rgba(13,102,102,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: idx === 0 ? '#C5A044' : '#0D7C66', minWidth: 22 }}>#{idx + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2E26' }}>{n.nombre}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} color="#8a9690" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#8a9690' }}>{n.vistas}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Puntuaciones */}
        {puntaje && puntaje.porNegocio.length > 0 && (
          <section style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(13,102,102,0.1)', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Star color="#C5A044" size={18} fill="#C5A044" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1A2E26' }}>Top Negocios — Puntuación</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8a9690', fontWeight: 600 }}>{puntaje.totalResenas} reseñas en total</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: 10 }}>
              {puntaje.porNegocio.slice(0, 6).map((n, idx) => (
                <div key={n.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.45)', borderRadius: 12, border: '1px solid rgba(13,102,102,0.07)' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: idx === 0 ? '#C5A044' : '#0D7C66', minWidth: 24 }}>#{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</div>
                    <div style={{ fontSize: 11, color: '#8a9690' }}>{n.totalReviews} reseñas</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#FEF9C3', borderRadius: 8, padding: '4px 8px' }}>
                    <Star size={11} color="#C5A044" fill="#C5A044" />
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#854D0E' }}>{n.calificacion.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: 14 }}>
          {[
            { href: '/admin/pendientes', label: 'Validar Solicitudes', sub: `${metricas?.negociosPendientes ?? 0} pendientes`, icon: <Clock size={22} color="#0D7C66" />, color: '#0D7C66' },
            { href: '/admin/categorias', label: 'Gestionar Categorías', sub: '6 categorías activas', icon: <LayoutGrid size={22} color="#1A9E78" />, color: '#1A9E78' },
            { href: '/turista/mapa', label: 'Ver como Turista', sub: 'Vista pública del mapa', icon: <Globe size={22} color="#C5A044" />, color: '#C5A044' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
              background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
              borderRadius: 16, border: `1px solid ${item.color}20`,
              textDecoration: 'none', transition: 'transform 0.15s',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2E26' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#8a9690', marginTop: 2 }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </section>

      </main>
    </div>
  )
}

function KPICard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{
      padding: 20, borderRadius: 18,
      background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
      border: `1px solid ${color}20`,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#1A2E26', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8a9690', fontWeight: 600, marginTop: 4 }}>{title}</div>
      </div>
    </div>
  )
}
