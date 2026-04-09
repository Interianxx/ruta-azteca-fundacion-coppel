'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, MessageCircle, MapPin, Star,
  Loader2, LogOut, Eye, TrendingUp,
  Utensils, Plus, Trash2, Edit3, Save, X,
  ShieldCheck, Store, FileText, CheckCircle, AlertCircle, Clock,
} from 'lucide-react'
import { NegocioStore } from '@/lib/negocioStore'
import { MenuItem, Pedido } from '@/types/negocio'
import { ImageUploader } from '@/components/Business/ImageUploader'

const CATEGORIA_LABELS: Record<string, string> = {
  comida: 'Comida y bebida', artesanias: 'Artesanías', hospedaje: 'Hospedaje',
  tours: 'Tours y guías', transporte: 'Transporte', otro: 'Otro',
}

const CATEGORIA_EMOJI: Record<string, string> = {
  comida: '🥘', artesanias: '🎨', hospedaje: '🏨',
  tours: '🗺️', transporte: '🚐', otro: '🏪',
}

type Tab = 'perfil' | 'menu' | 'metricas'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',   label: 'Perfil',   icon: ShieldCheck },
  { id: 'menu',     label: 'Catálogo', icon: Utensils },
  { id: 'metricas', label: 'Métricas', icon: TrendingUp },
]

export default function PerfilNegocioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isDesktop, setIsDesktop] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [negocio, setNegocio] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<any>({})
  const [savingProfile, setSavingProfile] = useState(false)

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [stats, setStats] = useState<{
    vistas: number; clicks_whatsapp: number; clicks_telefono: number
    calificacion: number | null; totalReviews: number
  }>({ vistas: 0, clicks_whatsapp: 0, clicks_telefono: 0, calificacion: null, totalReviews: 0 })

  useEffect(() => { setIsDesktop(window.innerWidth > 768) }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }

    const loadData = async () => {
      try {
        const res = await fetch('/api/negocios/mio')
        const d = await res.json()
        const rawNegocio = d.data
        if (!rawNegocio) { setLoading(false); return }

        const overrides = NegocioStore.getProfileOverride(rawNegocio.id)
        const finalNegocio = { ...rawNegocio, ...overrides }
        setNegocio(finalNegocio)
        setProfileDraft(finalNegocio)
        setMenuItems(NegocioStore.getMenu(rawNegocio.id, rawNegocio.categoria))
        setPedidos(NegocioStore.getPedidos(rawNegocio.id))

        const mRes = await fetch(`/api/negocios/${rawNegocio.id}/metricas`)
        const mJson = await mRes.json()
        setStats(mJson.data ?? { vistas: 0, clicks_whatsapp: 0, clicks_telefono: 0, calificacion: null, totalReviews: 0 })
      } catch (e) {
        console.error('Error loading profile', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [status, router])

  const saveProfile = () => {
    if (!negocio) return
    setSavingProfile(true)
    NegocioStore.saveProfileOverride(negocio.id, {
      nombre: profileDraft.nombre,
      descripcion: profileDraft.descripcion,
      telefono: profileDraft.telefono,
      imagenUrl: profileDraft.imagenUrl,
    })
    setNegocio((prev: any) => ({ ...prev, ...profileDraft }))
    setIsEditingProfile(false)
    setSavingProfile(false)
  }

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      nombre: formData.get('nombre') as string,
      descripcion: formData.get('descripcion') as string,
      precio: parseFloat(formData.get('precio') as string),
      categoria: editingItem?.categoria ?? 'General',
      disponible: true,
    }
    const updated = editingItem
      ? menuItems.map(it => it.id === editingItem.id ? newItem : it)
      : [...menuItems, newItem]
    setMenuItems(updated)
    NegocioStore.saveMenu(negocio.id, updated)
    setShowItemForm(false)
    setEditingItem(null)
  }

  const deleteItem = (id: string) => {
    const updated = menuItems.filter(it => it.id !== id)
    setMenuItems(updated)
    NegocioStore.saveMenu(negocio.id, updated)
  }

  if (status === 'loading' || loading) return (
    <div className="bg-jade-air" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 size={40} color="#0D7C66" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!negocio) return (
    <div className="bg-jade-air" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="glass-card" style={{ textAlign: 'center', maxWidth: 380, padding: '40px 32px' }}>
        <MapPin size={48} color="#0D7C66" style={{ margin: '0 auto 20px' }} />
        <div className="text-jade-title" style={{ fontSize: 20, marginBottom: 10 }}>Negocio no encontrado</div>
        <p className="text-jade-muted" style={{ fontSize: 14, marginBottom: 28 }}>No encontramos datos asociados a tu cuenta. ¿Ya completaste tu registro?</p>
        <button onClick={() => router.push('/negocio/registro')} className="btn-jade" style={{ width: '100%', padding: 14 }}>
          Registrar negocio
        </button>
      </div>
    </div>
  )

  const estadoBadge = {
    ACTIVE:   { label: 'Activo',      bg: '#d1fae5', color: '#065f46', Icon: CheckCircle },
    REJECTED: { label: 'Rechazado',   bg: '#fee2e2', color: '#991b1b', Icon: AlertCircle },
    PENDING:  { label: 'En revisión', bg: '#fef3c7', color: '#92400e', Icon: Clock },
  }[negocio.estado as string] ?? { label: 'En revisión', bg: '#fef3c7', color: '#92400e', Icon: Clock }

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingBottom: 80 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── Header glass ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(60px) saturate(120%)',
        borderBottom: '1px solid rgba(13,102,102,0.1)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '.1em' }}>RUTA AZTECA</div>
            <div className="text-jade-title" style={{ fontSize: 15 }}>Panel del Negocio</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'rgba(229,62,62,0.06)', border: '1px solid rgba(229,62,62,0.15)', color: '#e53e3e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          <LogOut size={14} /> Salir
        </button>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Hero card del negocio ── */}
        <div className="glass-card" style={{ padding: 0, marginBottom: 16 }}>
          {/* Barra de acento */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0D7C66 0%, #1A9E78 60%, #C5A044 100%)', borderRadius: '24px 24px 0 0' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <div style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', background: 'var(--color-jade-air-light)', flexShrink: 0, border: '2px solid rgba(13,124,102,0.12)' }}>
                {negocio.imagenUrl
                  ? <img src={negocio.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{CATEGORIA_EMOJI[negocio.categoria] ?? '🏪'}</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-jade-title" style={{ fontSize: 20, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {negocio.nombre}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-jade-air-accent)', background: 'var(--color-jade-air-light)', padding: '4px 10px', borderRadius: 8 }}>
                    {CATEGORIA_EMOJI[negocio.categoria]} {CATEGORIA_LABELS[negocio.categoria] ?? negocio.categoria}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: estadoBadge.bg, color: estadoBadge.color }}>
                    <estadoBadge.Icon size={11} /> {estadoBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats — solo si hay datos */}
            {(stats.vistas > 0 || stats.calificacion != null) && (
              <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(13,124,102,0.08)' }}>
                {stats.vistas > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={14} color="var(--color-jade-air-accent)" />
                    <span className="text-jade-title" style={{ fontSize: 14 }}>{stats.vistas}</span>
                    <span className="text-jade-muted" style={{ fontSize: 12 }}>vistas</span>
                  </div>
                )}
                {stats.calificacion != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={14} color="#C5A044" fill="#C5A044" />
                    <span className="text-jade-title" style={{ fontSize: 14 }}>{stats.calificacion.toFixed(1)}</span>
                    <span className="text-jade-muted" style={{ fontSize: 12 }}>({stats.totalReviews} reseñas)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{
          display: 'flex', gap: 4, padding: 4, marginBottom: 16,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 20px rgba(13,124,102,0.06)',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: isDesktop ? '11px 12px' : '11px 6px',
                borderRadius: 13, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #0D7C66, #1A9E78)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(13,124,102,0.25)' : 'none',
              }}
            >
              <tab.icon size={15} />
              {isDesktop ? tab.label : <span style={{ fontSize: 11 }}>{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* ── Contenido de tabs ── */}
        <AnimatePresence mode="wait">

          {/* ── PERFIL ── */}
          {activeTab === 'perfil' && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div className="glass-card" style={{ padding: 0 }}>
                {/* Header de sección */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
                  <span className="text-jade-title" style={{ fontSize: 16 }}>Información del negocio</span>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--color-jade-air-light)', color: 'var(--color-jade-air-accent)', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Edit3 size={13} /> Editar
                    </button>
                  )}
                </div>
                <div style={{ height: 1, background: 'rgba(13,124,102,0.07)', margin: '0 20px' }} />

                {!isEditingProfile ? (
                  <div style={{ padding: '8px 20px 20px' }}>
                    {[
                      { icon: Store,       label: 'Nombre',    value: negocio.nombre },
                      { icon: Phone,       label: 'Teléfono',  value: negocio.telefono },
                      { icon: MapPin,      label: 'Dirección', value: negocio.direccion },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(13,124,102,0.06)' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <row.icon size={17} color="var(--color-jade-air-accent)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{row.label}</div>
                          <div className="text-jade-title" style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ paddingTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={17} color="var(--color-jade-air-accent)" />
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Descripción</div>
                      </div>
                      <p className="text-jade-muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.65, paddingLeft: 48 }}>{negocio.descripcion}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Foto del negocio</label>
                      <ImageUploader
                        onUploadComplete={(url) => setProfileDraft((p: any) => ({ ...p, imagenUrl: url }))}
                        onUploadClear={() => setProfileDraft((p: any) => ({ ...p, imagenUrl: undefined }))}
                      />
                    </div>
                    {[
                      { label: 'Nombre público', key: 'nombre', type: 'input' },
                      { label: 'WhatsApp / Teléfono', key: 'telefono', type: 'input' },
                      { label: 'Descripción', key: 'descripcion', type: 'textarea' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{f.label}</label>
                        {f.type === 'input' ? (
                          <input
                            value={profileDraft[f.key] ?? ''}
                            onChange={e => setProfileDraft((p: any) => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: 14, color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <textarea
                            rows={4}
                            value={profileDraft[f.key] ?? ''}
                            onChange={e => setProfileDraft((p: any) => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: 14, color: 'var(--text-main)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button onClick={() => setIsEditingProfile(false)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.15)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                      <button onClick={saveProfile} className="btn-jade" style={{ flex: 2, padding: '13px', gap: 8, fontSize: 14 }}>
                        {savingProfile ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={17} />}
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => router.push('/turista/mapa')} className="btn-jade" style={{ width: '100%', marginTop: 16, padding: 16, gap: 8, fontSize: 14 }}>
                <Eye size={18} /> Ver mi negocio como turista
              </button>
            </motion.div>
          )}

          {/* ── MENÚ / CATÁLOGO ── */}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div className="glass-card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
                  <span className="text-jade-title" style={{ fontSize: 16 }}>Menú / Catálogo</span>
                  <button
                    onClick={() => { setEditingItem(null); setShowItemForm(true) }}
                    className="btn-jade"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 12 }}
                  >
                    <Plus size={15} /> Nuevo item
                  </button>
                </div>
                <div style={{ height: 1, background: 'rgba(13,124,102,0.07)', margin: '0 20px' }} />

                <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {menuItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <Utensils size={40} color="#0D7C66" style={{ opacity: 0.2, margin: '0 auto 14px' }} />
                      <div className="text-jade-title" style={{ fontSize: 15, marginBottom: 6 }}>Catálogo vacío</div>
                      <div className="text-jade-muted" style={{ fontSize: 13 }}>Agrega tus productos o platillos para atraer más turistas.</div>
                    </div>
                  )}
                  {menuItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', background: 'rgba(255,255,255,0.55)', borderRadius: 16, border: '1px solid rgba(13,124,102,0.07)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--color-jade-air-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {CATEGORIA_EMOJI[negocio.categoria] ?? '🍽️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                          <span className="text-jade-title" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--color-jade-air-accent)', flexShrink: 0 }}>${item.precio}</span>
                        </div>
                        {item.descripcion && <div className="text-jade-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setEditingItem(item); setShowItemForm(true) }} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'var(--color-jade-air-light)', color: 'var(--color-jade-air-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(220,38,38,0.06)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MÉTRICAS ── */}
          {activeTab === 'metricas' && (
            <motion.div key="metricas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {/* KPI: Vistas + contactos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { Icon: Eye,            color: '#0D7C66', label: 'Vistas',    value: stats.vistas,            bg: 'linear-gradient(135deg, #0D7C66, #1A9E78)', light: false },
                  { Icon: MessageCircle,  color: '#25D366', label: 'WhatsApp',  value: stats.clicks_whatsapp,   bg: undefined, light: true },
                  { Icon: Phone,          color: '#0D7C66', label: 'Teléfono',  value: stats.clicks_telefono,   bg: undefined, light: true },
                ].map(({ Icon, color, label, value, bg, light }) => (
                  <div key={label} className="glass-card" style={{ padding: '18px 10px', textAlign: 'center', ...(bg ? { background: bg, border: 'none' } : {}) }}>
                    <Icon size={20} color={light ? color : 'rgba(255,255,255,0.8)'} style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 26, fontWeight: 900, color: light ? 'var(--text-main)' : '#fff' }}>{value}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: light ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Calificación */}
              <div className="glass-card" style={{ padding: 20, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #C5A044, #E8C25A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={22} color="#fff" fill="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Calificación promedio</div>
                    {stats.calificacion != null ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                          <span className="text-jade-title" style={{ fontSize: 28, lineHeight: 1 }}>{stats.calificacion.toFixed(1)}</span>
                          <span className="text-jade-muted" style={{ fontSize: 13 }}>/ 5</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} color="#C5A044" fill={s <= Math.round(stats.calificacion!) ? '#C5A044' : 'transparent'} />
                            ))}
                          </div>
                          <span className="text-jade-muted" style={{ fontSize: 12 }}>{stats.totalReviews} reseña{stats.totalReviews !== 1 ? 's' : ''}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-jade-muted" style={{ fontSize: 14 }}>Sin reseñas aún</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasa de contacto */}
              {stats.vistas > 0 && (
                <div className="glass-card" style={{ padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Tasa de contacto</div>
                  {(() => {
                    const tasa = Math.round(((stats.clicks_whatsapp + stats.clicks_telefono) / stats.vistas) * 100)
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span className="text-jade-muted" style={{ fontSize: 14 }}>Contactos / Vistas</span>
                          <span className="text-jade-title" style={{ fontSize: 20, color: 'var(--color-jade-air-accent)' }}>{tasa}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 8, background: 'var(--color-jade-air-light)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg, #0D7C66, #1A9E78)', width: `${Math.min(tasa, 100)}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <div className="text-jade-muted" style={{ fontSize: 12, marginTop: 8 }}>
                          {stats.clicks_whatsapp + stats.clicks_telefono} de {stats.vistas} visitas resultaron en contacto
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Empty state */}
              {stats.vistas === 0 && stats.clicks_whatsapp === 0 && stats.clicks_telefono === 0 && stats.calificacion == null && (
                <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <TrendingUp size={40} color="#0D7C66" style={{ opacity: 0.25, margin: '0 auto 14px' }} />
                  <div className="text-jade-title" style={{ fontSize: 16, marginBottom: 6 }}>Sin actividad registrada</div>
                  <div className="text-jade-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Cuando un turista visite tu perfil o te contacte, aquí verás las estadísticas.
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Modal agregar/editar item ── */}
      <AnimatePresence>
        {showItemForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', padding: '0' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowItemForm(false) }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.1)', margin: '0 auto 24px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span className="text-jade-title" style={{ fontSize: 18 }}>{editingItem ? 'Editar item' : 'Nuevo item'}</span>
                <button onClick={() => setShowItemForm(false)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { name: 'nombre', label: 'Nombre del producto', type: 'input' },
                  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
                  { name: 'precio', label: 'Precio ($ MXN)', type: 'number' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea name={f.name} defaultValue={editingItem?.descripcion} rows={3}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', fontSize: 14, resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
                    ) : (
                      <input name={f.name} type={f.type === 'number' ? 'number' : 'text'}
                        step={f.type === 'number' ? '0.5' : undefined}
                        defaultValue={f.name === 'nombre' ? editingItem?.nombre : editingItem?.precio}
                        required
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                    )}
                  </div>
                ))}
                <button type="submit" className="btn-jade" style={{ width: '100%', padding: 15, fontSize: 15, marginTop: 4 }}>
                  {editingItem ? 'Guardar cambios' : 'Agregar al catálogo'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
