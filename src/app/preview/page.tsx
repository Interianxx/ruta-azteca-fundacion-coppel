import MapaRutaAztecaUI from '@/components/MapaRutaAztecaUI'

export default function PreviewPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <MapaRutaAztecaUI />
    </div>
  )
}
