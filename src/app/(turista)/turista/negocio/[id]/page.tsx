import { notFound } from 'next/navigation'
import type { Negocio } from '@/types/negocio'
import { NegocioDetalle } from './NegocioDetalle'

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

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const negocio = await getNegocio(id)
  if (!negocio) return {}
  return {
    title: `${negocio.nombre} — Ruta Azteca`,
    description: negocio.descripcion,
    openGraph: {
      title: negocio.nombre,
      description: negocio.descripcion,
      images: negocio.imagenUrl ? [negocio.imagenUrl] : [],
    },
  }
}

export default async function NegocioPage({ params }: Props) {
  const { id }  = await params
  const negocio = await getNegocio(id)
  if (!negocio) notFound()
  return <NegocioDetalle negocio={negocio} />
}
