'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Loader2, LayoutGrid, Store } from 'lucide-react'

interface Categoria {
  slug: string
  nombre: string
  nombre_en: string
  emoji: string
  descripcion: string
  negociosActivos: number
  negociosTotales: number
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/categorias')
      .then(r => r.json())
      .then(d => setCategorias(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="bg-jade-air" style={{ fontFamily: 'var(--font-inter), sans-serif', minHeight: '100vh' }}>
      {/* Header */}
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
            <span className="text-jade-title" style={{ fontSize: 18 }}>Categorías</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-jade-air-accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              {loading ? 'Cargando...' : `${categorias.length} categorías`}
            </span>
          </div>
        </div>
        <button onClick={cargar}
          style={{ marginLeft: 'auto', width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(13,124,102,0.1)', background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
          <RefreshCw size={18} color="var(--color-jade-air-accent)" className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Loader2 size={32} color="var(--color-jade-air-accent)" className="animate-spin" />
          </div>
        )}

        {!loading && categorias.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <LayoutGrid size={48} color="var(--color-jade-air-accent)" style={{ margin: '0 auto 16px' }} />
            <div className="text-jade-title" style={{ fontSize: 20, marginBottom: 8 }}>Sin categorías</div>
            <div className="text-jade-muted">No se encontraron categorías en la base de datos.</div>
          </div>
        )}

        {!loading && categorias.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {categorias.map(cat => (
              <div key={cat.slug} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Emoji + nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                    {cat.emoji || '🏪'}
                  </div>
                  <div>
                    <div className="text-jade-title" style={{ fontSize: 17, marginBottom: 2 }}>{cat.nombre}</div>
                    {cat.nombre_en && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{cat.nombre_en}</div>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                {cat.descripcion && (
                  <p className="text-jade-muted" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                    {cat.descripcion}
                  </p>
                )}

                {/* Conteos */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <div style={{ flex: 1, background: 'var(--color-jade-air-light)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-jade-air-accent)' }}>{cat.negociosActivos}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Activos</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{cat.negociosTotales}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Totales</div>
                  </div>
                </div>

                {/* Slug badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Store size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'monospace' }}>{cat.slug}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
