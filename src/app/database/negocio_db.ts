import { Negocio, NegocioCache } from '@/types/negocio'
import { openDB, IDBPDatabase } from 'idb'

let dbInstance: IDBPDatabase | null = null
export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB('negocio-db', 1, {
    upgrade(db) {
      const negocioStore = db.createObjectStore('negocios', { keyPath: 'id' })
      negocioStore.createIndex('by-synced', 'synced')
    },
  })
  return dbInstance
}
export async function addNegocio(
    nombre: string,
    descripcion: string,
    categoria: string,
    lat: number,
    lng: number): Promise<NegocioCache> {
        const db = await getDB()
        const business: NegocioCache = {
            negocio: {
                id: crypto.randomUUID(),
                nombre: nombre,
                descripcion: descripcion,
                categoria: categoria as Negocio['categoria'],
                estado: 'PENDING',
                lat: lat,
                lng: lng,
                telefono: '',
                propietarioId: '',
                direccion: '',
                tags: [],
                createdAt: Date.now().toString(),
                updatedAt: Date.now().toString(),
                imagenUrl: undefined,
            },
            synced: false
        }
    await db.add('negocios', business)
    return business
}
export async function getNegocios(): Promise<Negocio[]> {
  const db = await getDB()
  return db.getAll('negocios')
}
export async function updateNegocio(id: string, updates: Partial<Negocio>): Promise<void> {
  const db = await getDB()
  const business = await db.get('negocios', id)
  if (!business) return
  const updated = { ...business, ...updates, synced: false }
  await db.put('negocios', updated)
}
export async function deleteNegocio(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('negocios', id)
}
export async function getUnsyncedNegocios(): Promise<Negocio[]> {
  const db = await getDB()
  const allNegocios = await db.getAll('negocios')
  const unsyncedNegocios = allNegocios.filter((business: NegocioCache) => !business.synced)
  const negociosList: Negocio[] = []
  for (const business of unsyncedNegocios) {
    negociosList.push(business.negocio)
  }
  return negociosList
}
export async function markAsSynced(id: string): Promise<void> {
  const db = await getDB()
  const business = await db.get('negocios', id)
  if (!business) return
  business.synced = true
  await db.put('negocios', business)
}