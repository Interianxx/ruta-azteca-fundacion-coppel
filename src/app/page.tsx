import { redirect } from 'next/navigation'

// Landing — redirige al login (punto de entrada principal)
export default function Home() {
  redirect('/login')
}
