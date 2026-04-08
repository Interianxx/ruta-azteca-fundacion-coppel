'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Clock, Store, LayoutGrid, Loader2, LogOut } from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pendientesCount, setPendientesCount] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    fetch('/api/admin/pendientes')
      .then(r => r.json())
      .then(d => setPendientesCount(d.data?.count ?? 0))
      .catch(() => {})
  }, [status, session])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f2' }}>
      <Loader2 size={32} color="#0D7C66" style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0efeb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Panel de administración</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A2E26' }}>Ruta Azteca</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session?.user?.image && (
            <img src={session.user.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <span style={{ fontSize: 13, color: '#4a5a52', fontWeight: 600 }}>{session?.user?.name ?? 'Admin'}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e8e6e0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#8a9690', fontSize: 13, fontWeight: 600 }}
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #f0efeb', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <Clock size={24} color="#C5A044" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 28, fontWeight: 900, color: '#C5A044', lineHeight: 1 }}>{pendientesCount ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#8a9690', marginTop: 4, fontWeight: 500 }}>Pendientes de aprobación</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #f0efeb', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <Store size={24} color="#0D7C66" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0D7C66', lineHeight: 1 }}>FIFA 2026</div>
            <div style={{ fontSize: 12, color: '#8a9690', marginTop: 4, fontWeight: 500 }}>Jun – Jul</div>
          </div>
        </div>

        {/* Nav cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <button
            onClick={() => router.push('/admin/pendientes')}
            style={{ background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', borderRadius: 18, padding: '24px 22px', border: 'none', boxShadow: '0 8px 24px rgba(13,124,102,.25)', cursor: 'pointer', textAlign: 'left' }}
          >
            <Store size={32} color="rgba(255,255,255,.9)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              Negocios pendientes
              {pendientesCount != null && pendientesCount > 0 && (
                <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                  {pendientesCount}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>Revisa y aprueba solicitudes de registro</div>
          </button>

          <button
            onClick={() => router.push('/admin/categorias')}
            style={{ background: '#fff', borderRadius: 18, padding: '24px 22px', border: '1px solid #f0efeb', boxShadow: '0 2px 8px rgba(0,0,0,.04)', cursor: 'pointer', textAlign: 'left' }}
          >
            <LayoutGrid size={32} color="#0D7C66" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1A2E26', marginBottom: 6 }}>Categorías</div>
            <div style={{ fontSize: 13, color: '#8a9690', lineHeight: 1.5 }}>Gestionar categorías del directorio</div>
          </button>
        </div>
      </div>
    </div>
  )
}
