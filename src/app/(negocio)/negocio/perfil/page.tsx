'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, MessageCircle, MapPin, Star, 
  Loader2, LogOut, Clock, 
  Check, X, ShieldCheck, Palette, Eye, TrendingUp,
  BedDouble, Bus, LayoutGrid, CheckCircle2, CreditCard, ArrowRight,
  Utensils, Plus, Trash2, Edit3, Save, Camera, ShoppingBag
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
  tours: '🗺️', transporte: '🚐', otro: '🏪'
}

type Tab = 'perfil' | 'menu' | 'metricas'

export default function PerfilNegocioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 768 : true
  
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [negocio, setNegocio] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<any>({})
  const [savingProfile, setSavingProfile] = useState(false)

  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)

  // Sales/Analytics State
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [stats, setStats] = useState({ vistas: 0, clicks_wa: 0, clicks_tel: 0 })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.replace('/login'); return }
    
    // Load real-time data from NegocioStore and API
    const loadData = async () => {
      try {
        const res = await fetch('/api/negocios/mio')
        const d = await res.json()
        const rawNegocio = d.data
        
        if (!rawNegocio) {
          setLoading(false)
          return
        }

        // Merge with local overrides
        const overrides = NegocioStore.getProfileOverride(rawNegocio.id)
        const finalNegocio = { ...rawNegocio, ...overrides }
        setNegocio(finalNegocio)
        setProfileDraft(finalNegocio)

        // Load Menu
        setMenuItems(NegocioStore.getMenu(rawNegocio.id, rawNegocio.categoria))

        // Load Pedidos
        setPedidos(NegocioStore.getPedidos(rawNegocio.id))

        // Metrics from API
        const mRes = await fetch(`/api/negocios/${rawNegocio.id}/metricas`)
        const mJson = await mRes.json()
        setStats(mJson.data ?? { vistas: 0, clicks_wa: 0, clicks_tel: 0 })

      } catch (e) {
        console.error("Error loading profile", e)
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
      imagenUrl: profileDraft.imagenUrl
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
      disponible: true
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
    <div className="bg-jade-air flex items-center justify-center min-h-screen">
      <Loader2 size={40} color="#0D7C66" className="animate-spin" />
    </div>
  )

  if (!negocio) return (
    <div className="bg-jade-air flex items-center justify-center min-h-screen p-6">
      <div className="glass-card" style={{ textAlign: 'center', maxWidth: 400, padding: '40px 32px' }}>
        <MapPin size={48} color="#0D7C66" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 20, marginBottom: 12, fontWeight: 800 }}>Negocio no encontrado</h2>
        <p style={{ fontSize: 14, marginBottom: 32, color: '#8a9690' }}>No encontramos datos asociados a tu cuenta. ¿Ya completaste tu registro?</p>
        <button onClick={() => router.push('/negocio/registro')} className="btn-jade" style={{ width: '100%', padding: '14px' }}>
          Registrar negocio ahora
        </button>
      </div>
    </div>
  )

  const TABS = [
    { id: 'perfil', label: 'Mi Perfil', icon: ShieldCheck },
    { id: 'menu', label: 'Menú / Catálogo', icon: Utensils },
    { id: 'metricas', label: 'Pedidos / Ventas', icon: TrendingUp, hasNotification: pedidos.length > 0 },
  ]

  // Rank best sellers
  const bestSellers = menuItems
    .map(item => ({
      ...item,
      ventas: pedidos.reduce((acc, p) => acc + (p.items.find(pi => pi.id === item.id)?.cantidad || 0), 0)
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .filter(i => i.ventas > 0)
    .slice(0, 3)

  return (
    <div className="bg-jade-air min-h-screen" style={{ fontFamily: 'system-ui', paddingBottom: 100 }}>
      {/* Header Premium */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)', 
        padding: '60px 24px 100px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>RUTA AZTECA</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Cerrar Sesión
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              {negocio.imagenUrl 
                ? <img src={negocio.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{CATEGORIA_EMOJI[negocio.categoria]}</div>
              }
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>{negocio.nombre}</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>Panel del Propietario</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '-40px auto 0', padding: '0 20px' }}>
        {/* Navigation Tabs */}
        <div className="glass-panel-map" style={{ display: 'flex', padding: 4, borderRadius: 18, marginBottom: 20, gap: 4, border: 'none', background: 'rgba(255,255,255,0.6)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 6px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === tab.id ? '#0D7C66' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#8a9690',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(13,124,102,0.2)' : 'none',
                position: 'relative'
              }}
            >
              <tab.icon size={16} /> 
              {isDesktop && tab.label}
              {tab.hasNotification && activeTab !== tab.id && (
                <div style={{ position: 'absolute', top: 10, right: isDesktop ? 12 : 18, width: 8, height: 8, background: '#EF4444', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'perfil' && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1A2E26' }}>Información del Negocio</h3>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(13,124,102,0.1)', color: '#0D7C66', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <Edit3 size={14} /> Editar Perfil
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                     <div style={{ display: 'flex', gap: 14 }}>
                       <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(13,124,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D7C66', flexShrink: 0 }}><ShieldCheck size={20} /></div>
                       <div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase' }}>Nombre</div>
                         <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2E26' }}>{negocio.nombre}</div>
                       </div>
                     </div>
                     <div style={{ display: 'flex', gap: 14 }}>
                       <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(13,124,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D7C66', flexShrink: 0 }}><LogOut size={20} /></div>
                       <div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase' }}>Descripción</div>
                         <div style={{ fontSize: 15, color: '#4a5a52', lineHeight: 1.5 }}>{negocio.descripcion}</div>
                       </div>
                     </div>
                     <div style={{ display: 'flex', gap: 14 }}>
                       <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(13,124,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D7C66', flexShrink: 0 }}><Phone size={20} /></div>
                       <div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase' }}>Contacto</div>
                         <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2E26' }}>{negocio.telefono}</div>
                       </div>
                     </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase', marginBottom: 8 }}>Foto del Negocio</label>
                      <ImageUploader 
                        onUploadComplete={(url) => setProfileDraft(p => ({ ...p, imagenUrl: url }))} 
                        onUploadClear={() => setProfileDraft(p => ({ ...p, imagenUrl: undefined }))} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#8a9690', marginBottom: 6 }}>Nombre Público</label>
                      <input value={profileDraft.nombre} onChange={e => setProfileDraft(p => ({ ...p, nombre: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#8a9690', marginBottom: 6 }}>Descripción</label>
                      <textarea rows={4} value={profileDraft.descripcion} onChange={e => setProfileDraft(p => ({ ...p, descripcion: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', resize: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#8a9690', marginBottom: 6 }}>WhatsApp / Teléfono</label>
                      <input value={profileDraft.telefono} onChange={e => setProfileDraft(p => ({ ...p, telefono: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button onClick={() => setIsEditingProfile(false)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e0ddd5', background: '#fff', color: '#8a9690', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={saveProfile} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#0D7C66', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1A2E26' }}>Gestión de Menú</h3>
                  <button onClick={() => { setEditingItem(null); setShowItemForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0D7C66', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,124,102,0.3)' }}>
                    <Plus size={16} /> Nuevo Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {menuItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed rgba(13,124,102,0.1)', borderRadius: 20 }}>
                      <Plus size={32} color="#0D7C66" style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 700, color: '#8a9690' }}>Aún no tienes platillos</div>
                      <div style={{ fontSize: 12, color: '#8a9690', marginTop: 4 }}>Agrega tus mejores productos para atraer turistas.</div>
                    </div>
                  )}
                  {menuItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 14, padding: 16, background: 'rgba(255,255,255,0.4)', borderRadius: 18, border: '1px solid rgba(13,124,102,0.06)' }}>
                       <div style={{ flex: 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#1A2E26' }}>{item.nombre}</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#0D7C66' }}>${item.precio}</span>
                         </div>
                         <div style={{ fontSize: 13, color: '#4a5a52' }}>{item.descripcion}</div>
                       </div>
                       <div style={{ display: 'flex', gap: 4 }}>
                         <button onClick={() => { setEditingItem(item); setShowItemForm(true) }} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(13,124,102,0.1)', color: '#0D7C66', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                         <button onClick={() => deleteItem(item.id)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(220,38,38,0.05)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metricas' && (
            <motion.div key="metricas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Resumen Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="glass-card" style={{ padding: 18, background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)', border: 'none' }}>
                  <ShoppingBag size={20} color="rgba(255,255,255,0.6)" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{pedidos.length}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Ventas Totales</div>
                </div>
                <div className="glass-card" style={{ padding: 18 }}>
                  <CreditCard size={20} color="#0D7C66" style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1A2E26' }}>${pedidos.reduce((a, b) => a + b.total, 0).toFixed(0)}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase' }}>Ingresos Pesos</div>
                </div>
              </div>

              {/* Best Sellers */}
              {bestSellers.length > 0 && (
                <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 900, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '.05em' }}>Lo más pedido</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {bestSellers.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: idx === 0 ? '#C5A044' : 'rgba(13,124,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#fff' : '#0D7C66', fontSize: 12, fontWeight: 900 }}>{idx + 1}</div>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#1A2E26' }}>{item.nombre}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#8a9690' }}>{item.ventas} un.</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 900, color: '#1A2E26' }}>Historial de Pedidos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pedidos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🧺</div>
                      <div style={{ fontSize: 14, color: '#8a9690' }}>No hay pedidos registrados aún.</div>
                    </div>
                  )}
                  {pedidos.slice().reverse().map(p => (
                    <div key={p.id} style={{ padding: 14, borderRadius: 16, background: '#fff', border: '1px solid rgba(13,124,102,0.06)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#1A2E26' }}>Folio: {p.folio}</span>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#0D7C66' }}>${p.total}</span>
                       </div>
                       <div style={{ fontSize: 12, color: '#8a9690', marginBottom: 8 }}>{new Date(p.fecha).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.items.map(it => (
                            <span key={it.id} style={{ fontSize: 10, fontWeight: 800, background: 'rgba(13,124,102,0.05)', padding: '4px 8px', borderRadius: 8 }}>{it.cantidad}x {it.nombre}</span>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => router.push('/turista/mapa')} className="btn-jade" style={{ width: '100%', marginTop: 24, padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Eye size={20} /> Ver como Turista
        </button>
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{editingItem ? 'Editar Platillo' : 'Nuevo Platillo'}</h3>
               <button onClick={() => setShowItemForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690' }}><X /></button>
            </div>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase', marginBottom: 6 }}>Nombre del platillo</label>
                  <input name="nombre" defaultValue={editingItem?.nombre} required style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase', marginBottom: 6 }}>Descripción / Ingredientes</label>
                  <textarea name="descripcion" defaultValue={editingItem?.descripcion} rows={3} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)', resize: 'none' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#8a9690', textTransform: 'uppercase', marginBottom: 6 }}>Precio ($ MXN)</label>
                  <input name="precio" type="number" step="0.5" defaultValue={editingItem?.precio} required style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(13,124,102,0.2)' }} />
               </div>
               <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#0D7C66', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                  {editingItem ? 'Guardar Cambios' : 'Agregar al Menú'}
               </button>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
