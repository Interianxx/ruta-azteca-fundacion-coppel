import { MenuItem, Pedido, CategoriaSlug } from '@/types/negocio'

const STORAGE_KEYS = {
  MENUS: 'ra_menus',
  PEDIDOS: 'ra_pedidos',
  PROFILE_OVERRIDE: 'ra_profile_overrides'
}

// ─── MOCK DATA GENERATOR ─────────────────────────────────────────────────────

const DEFAULT_PLATES: Record<CategoriaSlug, Partial<MenuItem>[]> = {
  comida: [
    { nombre: 'Tacos al Pastor', descripcion: '3 tacos con piña, cebolla y cilantro', precio: 85, categoria: 'Platos Fuertes' },
    { nombre: 'Enchiladas Verdes', descripcion: 'Rellenas de pollo con crema y queso', precio: 120, categoria: 'Platos Fuertes' },
    { nombre: 'Pozole Rojo', descripcion: 'Pozole tradicional con guarnición', precio: 110, categoria: 'Sopas' },
    { nombre: 'Agua de Jamaica', descripcion: 'Refrescante y natural (500ml)', precio: 35, categoria: 'Bebidas' },
    { nombre: 'Tamal de Dulce', descripcion: 'Tamal rosa con pasas', precio: 25, categoria: 'Antojitos' },
  ],
  artesanias: [
    { nombre: 'Máscara de Lucha Libre', descripcion: 'Réplica profesional ajustable', precio: 250, categoria: 'Recuerdos' },
    { nombre: 'Cráneo de Barro Negro', descripcion: 'Hecho a mano en Oaxaca', precio: 450, categoria: 'Decoración' },
    { nombre: 'Pulsera Tejida', descripcion: 'Colores vibrantes típicos', precio: 45, categoria: 'Accesorios' },
    { nombre: 'Sombrero Charro', descripcion: 'Tamaño minidatado con bordado', precio: 180, categoria: 'Vestimenta' },
  ],
  hospedaje: [
    { nombre: 'Noche Sencilla', descripcion: 'Cama matrimonial, baño privado y WiFi', precio: 850, categoria: 'Habitaciones' },
    { nombre: 'Noche Doble', descripcion: 'Dos camas, ideal para familias', precio: 1250, categoria: 'Habitaciones' },
    { nombre: 'Desayuno Buffet', descripcion: 'Chilaquiles, fruta y café ilimitado', precio: 180, categoria: 'Extras' },
  ],
  tours: [
    { nombre: 'Tour Gastronómico', descripcion: '4 horas probando la mejor comida callejera', precio: 650, categoria: 'Experiencias' },
    { nombre: 'Ruta de Museos', descripcion: 'Entrada a 3 museos con guía bilingüe', precio: 950, categoria: 'Cultura' },
    { nombre: 'Cata de Mezcal', descripcion: 'Degustación de 5 variedades artesanales', precio: 400, categoria: 'Experiencias' },
  ],
  transporte: [
    { nombre: 'Traslado Aeropuerto', descripcion: 'Servicio privado punto a punto', precio: 450, categoria: 'Traslados' },
    { nombre: 'Renta por Hora', descripcion: 'Chofer privado a tu disposición', precio: 300, categoria: 'Servicios' },
  ],
  otro: [
    { nombre: 'Servicio Básico', descripcion: 'Atención personalizada express', precio: 100, categoria: 'General' },
    { nombre: 'Paquete Turista', descripcion: 'Mapa físico + chip de datos local', precio: 250, categoria: 'Kits' },
  ]
}

// ─── STORE FUNCTIONS ─────────────────────────────────────────────────────────

export const NegocioStore = {
  // --- MENUS ---
  getMenu: (negocioId: string, categoria: CategoriaSlug): MenuItem[] => {
    if (typeof window === 'undefined') return []
    const allMenus = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || '{}')
    
    if (allMenus[negocioId]) return allMenus[negocioId]

    // Seed data if not exists
    const defaults = DEFAULT_PLATES[categoria] || DEFAULT_PLATES['otro']
    const seededMenu: MenuItem[] = defaults.map((p, i) => ({
      ...p,
      id: `${negocioId}-item-${i}`,
      popularidad: Math.floor(Math.random() * 50),
    } as MenuItem))

    NegocioStore.saveMenu(negocioId, seededMenu)
    return seededMenu
  },

  saveMenu: (negocioId: string, menu: MenuItem[]) => {
    const allMenus = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || '{}')
    allMenus[negocioId] = menu
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(allMenus))
  },

  // --- PEDIDOS ---
  getPedidos: (negocioId: string): Pedido[] => {
    if (typeof window === 'undefined') return []
    const allPedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]')
    return allPedidos.filter((p: Pedido) => p.negocioId === negocioId)
  },

  addPedido: (pedido: Pedido) => {
    const allPedidos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEDIDOS) || '[]')
    allPedidos.unshift(pedido) // Newest first
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(allPedidos))
    
    // Update local analytics (popularity)
    const allMenus = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS) || '{}')
    const menu = allMenus[pedido.negocioId]
    if (menu) {
      pedido.items.forEach(orderItem => {
        const menuItem = menu.find((m: MenuItem) => m.id === orderItem.id)
        if (menuItem) {
          menuItem.popularidad = (menuItem.popularidad || 0) + orderItem.cantidad
        }
      })
      NegocioStore.saveMenu(pedido.negocioId, menu)
    }
  },

  // --- PROFILE OVERRIDES (para editar info sin backend) ---
  getProfileOverride: (negocioId: string) => {
    if (typeof window === 'undefined') return null
    const overrides = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE_OVERRIDE) || '{}')
    return overrides[negocioId] || null
  },

  saveProfileOverride: (negocioId: string, data: any) => {
    const overrides = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE_OVERRIDE) || '{}')
    overrides[negocioId] = { ...(overrides[negocioId] || {}), ...data }
    localStorage.setItem(STORAGE_KEYS.PROFILE_OVERRIDE, JSON.stringify(overrides))
  }
}
