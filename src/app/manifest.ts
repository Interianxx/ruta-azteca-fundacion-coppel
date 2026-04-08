import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Ruta Azteca',
        short_name: 'Ruta Azteca',
        description: 'Descubre los mejores negocios locales en México con Ruta Azteca. Explora comida, artesanías, hospedaje, tours y transporte, todo en un solo lugar.',
        start_url: '/login',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    }
}