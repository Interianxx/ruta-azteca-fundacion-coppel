import { notFound } from 'next/navigation'
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f3fbfa 0%, #dff2ec 100%)',
      color: '#1A2E26',
      paddingBottom: 40,
      fontFamily: 'var(--font-inter), sans-serif',
    }}>

      {/* Header flotante */}
      <header style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/turista/mapa" style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0D7C66', textDecoration: 'none', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(13,124,102,.1)',
          backdropFilter: 'blur(12px)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </Link>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0D7C66', letterSpacing: '0.05em' }}>RUTA AZTECA</div>
      </header>

      <main style={{ maxWidth: 500, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Imagen del Hero */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          {negocio.imagenUrl ? (
            <img
              src={negocio.imagenUrl}
              alt={negocio.nombre}
              style={{
                width: '100%', height: 240, objectFit: 'cover',
                borderRadius: 24, boxShadow: '0 12px 32px rgba(13,124,102,.15)'
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: 240,
              background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)',
              borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64, boxShadow: '0 12px 32px rgba(13,124,102,.2)'
            }}>
              {CATEGORIA_LABEL[negocio.categoria]?.split(' ')[0] ?? '🏪'}
            </div>
          )}
          {/* Calificación flotante */}
          {negocio.calificacion && (
            <div className="glass-panel-map" style={{
              position: 'absolute', bottom: 16, right: 16,
              padding: '6px 12px', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#C5A044" stroke="#C5A044" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{ fontWeight: 700 }}>{negocio.calificacion.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Tarjeta de Información Principal */}
        <div className="glass-panel-map" style={{ padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
              {CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E26', lineHeight: 1.2 }}>{negocio.nombre}</h1>
          </div>
          
          <p style={{ color: '#4d5d55', fontSize: 14, lineHeight: 1.6 }}>{negocio.descripcion}</p>

          {negocio.tags && negocio.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {negocio.tags.map(tag => (
                <span key={tag} style={{ padding: '4px 10px', background: 'rgba(13,124,102,0.08)', border: '1px solid rgba(13,124,102,0.1)', color: '#0D7C66', fontSize: 11, fontWeight: 600, borderRadius: 12 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tarjeta de Ubicación */}
        <div className="glass-panel-map" style={{ padding: 20, borderRadius: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700, color: '#1A2E26' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7C66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ubicación
          </div>
          <p style={{ fontSize: 14, color: '#4d5d55', marginBottom: 16 }}>{negocio.direccion}</p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px', background: '#0D7C66',
              border: '1px solid #0D7C66', borderRadius: 16, color: '#fff',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(13,124,102,.3)',
            }}
          >
            Cómo llegar →
          </a>
        </div>

        {/* Tarjeta de Contacto */}
        <div className="glass-panel-map" style={{ padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 700, color: '#1A2E26' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7C66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Contacto
          </div>
          
          <a href={`tel:${negocio.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.4)', textDecoration: 'none', color: '#1A2E26', border: '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{ width: 36, height: 36, background: '#e1f5ee', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D7C66' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{negocio.telefono}</span>
          </a>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.4)', textDecoration: 'none', color: '#1A2E26', border: '1px solid rgba(255,255,255,0.3)' }}>
             <div style={{ width: 36, height: 36, background: '#25D366', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Escribir por WhatsApp</span>
            </a>
          )}
        </div>

        {/* Botón asistente */}
        <Link
          href="/turista/chat"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '16px', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
            borderRadius: 20, color: '#fff', fontWeight: 600, fontSize: 16,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(13,124,102,.35)',
            marginTop: 8
          }}
        >
          <div style={{ width: 24, height: 24, background: '#C5A044', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>
            IA
          </div>
          Preguntarle al Asistente IA
        </Link>
      </main>
    </div>
  )
}
