import { notFound } from 'next/navigation'
import { Metadata } from 'next'
// Dynamic metadata for each negocio
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const negocio = await getNegocio(params.id)
  if (!negocio) {
    return {
      title: 'Negocio no encontrado | Ruta Azteca',
      description: 'No se encontró el negocio solicitado.'
    }
  }
  return {
    title: `Ruta Azteca${" - " + negocio.nombre}`,
    description: negocio.descripcion,
    openGraph: {
      title: `Ruta Azteca${" - " + negocio.nombre}`,
      description: negocio.descripcion,
      images: negocio.imagenUrl ? [negocio.imagenUrl] : undefined,
    }
  }
}
import Link from 'next/link'
import type { Negocio } from '@/types/negocio'

interface Props { params: Promise<{ id: string }> }

async function getNegocio(id: string): Promise<Negocio | null> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/negocios/${id}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.data as Negocio
  } catch {
    return null
  }
}

const CATEGORIA_LABEL: Record<string, string> = {
  comida:      '🍜 Comida',
  artesanias:  '🎨 Artesanías',
  hospedaje:   '🏨 Hospedaje',
  tours:       '🗺️ Tours',
  transporte:  '🚌 Transporte',
  otro:        '🏪 Otro',
}

export default async function NegocioPage({ params }: Props) {
  const { id }  = await params
  const negocio = await getNegocio(id)

  if (!negocio) notFound()

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${negocio.lat},${negocio.lng}`
  const whatsappUrl   = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/turista/mapa" className="text-gray-500 hover:text-red-600 transition-colors text-lg">
          ←
        </Link>
        <span className="font-bold text-red-600">🌮 Ruta Azteca</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Imagen */}
        {negocio.imagenUrl ? (
          <img
            src={negocio.imagenUrl}
            alt={negocio.nombre}
            className="w-full h-52 object-cover rounded-2xl shadow-md"
          />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center text-6xl">
            {CATEGORIA_LABEL[negocio.categoria]?.split(' ')[0] ?? '🏪'}
          </div>
        )}

        {/* Info principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
            {CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{negocio.nombre}</h1>

          {negocio.calificacion && (
            <p className="text-yellow-500 font-medium">
              ★ {negocio.calificacion.toFixed(1)}
              <span className="text-gray-400 text-sm font-normal ml-1">
                ({negocio.totalReviews ?? 0} reseñas)
              </span>
            </p>
          )}

          <p className="text-gray-700 leading-relaxed">{negocio.descripcion}</p>

          {negocio.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {negocio.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-2">📍 Ubicación</h2>
          <p className="text-gray-600 text-sm">{negocio.direccion}</p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            Cómo llegar →
          </a>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800">📞 Contacto</h2>

          <a
            href={`tel:${negocio.telefono}`}
            className="flex items-center gap-3 text-gray-700 hover:text-red-600 transition-colors"
          >
            <span className="text-xl">📱</span>
            <span className="text-sm">{negocio.telefono}</span>
          </a>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors"
            >
              <span className="text-xl">💬</span>
              <span className="text-sm">Escribir por WhatsApp</span>
            </a>
          )}
        </div>

        {/* Botón chat IA */}
        <Link
          href="/turista/chat"
          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3.5 font-semibold transition-colors shadow-md"
        >
          🤖 Preguntarle al asistente IA
        </Link>

      </main>
    </div>
  )
}
