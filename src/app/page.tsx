import { redirect } from 'next/navigation'

// Landing — redirige al mapa (punto de entrada principal)
export default function Home() {
  redirect('/turista/mapa')
}
