'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, MapPin, Star, Utensils, Palette, BedDouble, Map as MapIcon, Bus, Store } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { Negocio, CategoriaSlug } from '@/types/negocio'

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORIA_COLOR: Record<string, string> = {
  comida: '#E85D04', artesanias: '#7B2D8B', hospedaje: '#0077B6',
  tours: '#2DC653', transporte: '#F4A261', otro: '#1A9E78',
}
const CATEGORIA_LUCIDE: Record<string, React.FC<{ size?: number; color?: string }>> = {
  comida: Utensils, artesanias: Palette, hospedaje: BedDouble,
  tours: MapIcon, transporte: Bus, otro: Store,
}

// ─── Translations ─────────────────────────────────────────────────────────────
const UI: Record<string, Record<string, string>> = {
  es: {
    title: 'Mis favoritos',
    back: 'Volver al mapa',
    empty_title: 'Aún no tienes favoritos',
    empty_hint: 'Dale ❤️ a un negocio en el mapa para guardarlo aquí.',
    go_map: 'Ir al mapa',
    login_title: 'Inicia sesión para ver tus favoritos',
    login_hint: 'Guarda los negocios que más te gusten y encuéntralos fácilmente.',
    login_btn: 'Iniciar sesión',
    remove: 'Quitar de favoritos',
    view: 'Ver detalle',
  },
  en: {
    title: 'My favorites',
    back: 'Back to map',
    empty_title: 'No favorites yet',
    empty_hint: '❤️ a business on the map to save it here.',
    go_map: 'Go to map',
    login_title: 'Sign in to see your favorites',
    login_hint: 'Save the businesses you love and find them easily.',
    login_btn: 'Sign in',
    remove: 'Remove from favorites',
    view: 'View details',
  },
  fr: {
    title: 'Mes favoris',
    back: 'Retour à la carte',
    empty_title: 'Pas encore de favoris',
    empty_hint: '❤️ un commerce sur la carte pour le sauvegarder ici.',
    go_map: 'Aller à la carte',
    login_title: 'Connectez-vous pour voir vos favoris',
    login_hint: 'Sauvegardez vos commerces préférés et retrouvez-les facilement.',
    login_btn: 'Se connecter',
    remove: 'Retirer des favoris',
    view: 'Voir le détail',
  },
  pt: {
    title: 'Meus favoritos',
    back: 'Voltar ao mapa',
    empty_title: 'Nenhum favorito ainda',
    empty_hint: '❤️ um negócio no mapa para salvá-lo aqui.',
    go_map: 'Ir ao mapa',
    login_title: 'Entre para ver seus favoritos',
    login_hint: 'Salve os negócios que você ama e encontre-os facilmente.',
    login_btn: 'Entrar',
    remove: 'Remover dos favoritos',
    view: 'Ver detalhes',
  },
  de: {
    title: 'Meine Favoriten',
    back: 'Zurück zur Karte',
    empty_title: 'Noch keine Favoriten',
    empty_hint: '❤️ Sie ein Unternehmen auf der Karte, um es hier zu speichern.',
    go_map: 'Zur Karte',
    login_title: 'Anmelden um Favoriten zu sehen',
    login_hint: 'Speichern Sie Ihre Lieblingsgeschäfte und finden Sie sie leicht wieder.',
    login_btn: 'Anmelden',
    remove: 'Aus Favoriten entfernen',
    view: 'Details ansehen',
  },
}

export default function FavoritosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { idioma } = useTranslation()
  const ui = UI[idioma] ?? UI.es

  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { setLoading(false); return }

    fetch('/api/favoritos')
      .then(r => r.json())
      .then(async json => {
        const ids: string[] = json.data ?? []
        const items = await Promise.all(
          ids.map(id =>
            fetch(`/api/negocios/${id}`)
              .then(r => r.json())
              .then(j => j.data as Negocio)
              .catch(() => null)
          )
        )
        setNegocios(items.filter(Boolean) as Negocio[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session, status])

  async function handleRemove(negocioId: string) {
    setRemoving(negocioId)
    try {
      await fetch('/api/favoritos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId }),
      })
      setNegocios(prev => prev.filter(n => n.id !== negocioId))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F7F5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(244,247,245,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26,46,38,0.08)',
        padding: '12px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.push('/turista/mapa')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(26,46,38,0.06)', border: 'none', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} color="#1A2E26" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={18} color="#E85D04" fill="#E85D04" />
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1A2E26' }}>{ui.title}</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 40px', maxWidth: 600, margin: '0 auto' }}>
        {/* Not logged in */}
        {status !== 'loading' && !session && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>❤️</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26', marginBottom: 8 }}>
              {ui.login_title}
            </div>
            <div style={{ fontSize: 14, color: '#8a9690', marginBottom: 28, lineHeight: 1.5 }}>
              {ui.login_hint}
            </div>
            <Link
              href="/login"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#0D7C66', color: '#fff', borderRadius: 12,
                fontWeight: 600, fontSize: 15, textDecoration: 'none',
              }}
            >
              {ui.login_btn}
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && session && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 88, borderRadius: 16,
                background: 'linear-gradient(90deg, #e8ece9 25%, #f0f3f1 50%, #e8ece9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }} />
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && session && negocios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔖</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26', marginBottom: 8 }}>
              {ui.empty_title}
            </div>
            <div style={{ fontSize: 14, color: '#8a9690', marginBottom: 28, lineHeight: 1.5 }}>
              {ui.empty_hint}
            </div>
            <button
              onClick={() => router.push('/turista/mapa')}
              style={{
                padding: '12px 28px', background: '#0D7C66', color: '#fff',
                borderRadius: 12, fontWeight: 600, fontSize: 15,
                border: 'none', cursor: 'pointer',
              }}
            >
              {ui.go_map}
            </button>
          </div>
        )}

        {/* Favorites list */}
        {!loading && negocios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {negocios.map(n => {
              const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
              const color = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
              const isRemov = removing === n.id

              return (
                <div
                  key={n.id}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: '1px solid rgba(26,46,38,0.09)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    opacity: isRemov ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Business image */}
                  {n.imagenUrl && (
                    <div style={{ position: 'relative', height: 160 }}>
                      <img
                        src={n.imagenUrl}
                        alt={n.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => handleRemove(n.id)}
                        disabled={isRemov}
                        title={ui.remove}
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 34, height: 34, borderRadius: 10,
                          background: 'rgba(255,255,255,0.85)', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Heart size={16} color="#E85D04" fill="#E85D04" />
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '14px 16px 16px' }}>
                    {/* No image: heart button inline */}
                    {!n.imagenUrl && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                          background: `${color}20`, border: `1.5px solid ${color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CatIcon size={22} color={color} />
                        </div>
                        <div style={{ flex: 1 }} />
                        <button
                          onClick={() => handleRemove(n.id)}
                          disabled={isRemov}
                          title={ui.remove}
                          style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: '#fff0ec', border: '1px solid #ffd0c0',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Heart size={16} color="#E85D04" fill="#E85D04" />
                        </button>
                      </div>
                    )}

                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2E26', marginBottom: 4 }}>
                      {n.nombre}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {n.calificacion != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Star size={12} color="#F4A261" fill="#F4A261" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A2E26' }}>
                            {n.calificacion.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#8a9690" />
                        <span style={{ fontSize: 12, color: '#8a9690' }}>
                          {n.direccion.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    {n.descripcion && (
                      <div style={{
                        fontSize: 13, color: '#5a6e66', lineHeight: 1.45, marginBottom: 14,
                        overflow: 'hidden', maxHeight: '3em',
                      }}>
                        {n.descripcion}
                      </div>
                    )}

                    <Link
                      href={`/turista/negocio/${n.id}`}
                      style={{
                        display: 'block', textAlign: 'center',
                        padding: '10px 0', background: '#0D7C66', color: '#fff',
                        borderRadius: 10, fontWeight: 600, fontSize: 14,
                        textDecoration: 'none',
                      }}
                    >
                      {ui.view}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
