// SSR para SEO — detalle de negocio
export default async function NegocioPage({ params }: { params: { id: string } }) {
  return <div>Negocio {params.id}</div>
}
