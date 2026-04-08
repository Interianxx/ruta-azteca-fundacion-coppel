import { defaultCache } from '@serwist/next/worker'
import { openDB } from 'idb'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    }
}

declare const self: WorkerGlobalScope


const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    precacheOptions: {
        cleanupOutdatedCaches: true,
    }
    
})

async function syncNegocios() {
try {
const response = await fetch('/api/negocios');
const { data: negocios } = await response.json();
const db = await openDB('negocio-db', 1);
for (const negocio of negocios) {
await db.put('negocios', { id: negocio.id, negocio, synced: true });
}
} catch (e) {
// Optionally log error
}
}

serwist.addEventListeners()
