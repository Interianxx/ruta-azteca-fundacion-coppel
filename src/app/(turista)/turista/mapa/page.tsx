'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { MapView, CATEGORIA_COLOR, CATEGORIA_LUCIDE, type MapViewHandle } from '@/components/Map/MapView'
import type { Negocio, CategoriaSlug, Horario } from '@/types/negocio'
import { LayoutGrid, Utensils, Palette, BedDouble, Map, Bus, Store, Compass, Heart, Navigation2, User, Globe, Bot, Footprints, Car } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

// ─── Config ────────────────────────────────────────────────────────────────

const CATS: { slug: CategoriaSlug | ''; label: string; icon: React.ReactNode }[] = [
  { slug: '',            label: 'Todos',      icon: <LayoutGrid size={14} /> },
  { slug: 'comida',      label: 'Fondas',     icon: <Utensils   size={14} /> },
  { slug: 'artesanias',  label: 'Artesanos',  icon: <Palette    size={14} /> },
  { slug: 'hospedaje',   label: 'Hostales',   icon: <BedDouble  size={14} /> },
  { slug: 'tours',       label: 'Guías',      icon: <Map        size={14} /> },
  { slug: 'transporte',  label: 'Transporte', icon: <Bus        size={14} /> },
  { slug: 'otro',        label: 'Otro',       icon: <Store      size={14} /> },
]

const CAT_LABELS: Record<string, Record<string, string>> = {
  es: { '': 'Todos',  comida: 'Fondas',       artesanias: 'Artesanos',     hospedaje: 'Hostales', tours: 'Guías',   transporte: 'Transporte', otro: 'Otro'  },
  en: { '': 'All',    comida: 'Food',         artesanias: 'Crafts',        hospedaje: 'Hostels',  tours: 'Tours',   transporte: 'Transport',  otro: 'Other' },
  fr: { '': 'Tous',   comida: 'Nourriture',   artesanias: 'Artisanat',     hospedaje: 'Auberges', tours: 'Visites', transporte: 'Transport',  otro: 'Autre' },
  pt: { '': 'Todos',  comida: 'Comida',       artesanias: 'Artesanato',    hospedaje: 'Hostels',  tours: 'Tours',   transporte: 'Transporte', otro: 'Outro' },
  de: { '': 'Alle',   comida: 'Essen',        artesanias: 'Kunsthandwerk', hospedaje: 'Hostels',  tours: 'Touren',  transporte: 'Transport',  otro: 'Andere'},
}

const MAP_UI: Record<string, Record<string, string>> = {
  es: {
    search_ph: 'Buscar negocios locales...', loading: 'Cargando…',
    count_verified: '{n} negocios verificados', more_results: '+{n} resultados más — sigue escribiendo para filtrar',
    back: 'Volver al mapa', directions: 'Cómo llegar',
    reviews: 'Reseñas', write_review: '+ Escribir reseña', cancel: 'Cancelar',
    login_to_review: 'Inicia sesión para reseñar', your_rating: 'Tu calificación',
    review_ph: 'Cuéntanos tu experiencia...', submitting: 'Enviando…', publish_review: 'Publicar reseña',
    no_reviews: 'Sin reseñas todavía. ¡Sé el primero!', thanks_review: '¡Gracias por tu reseña!',
    route_to: 'Ruta a', on_foot: 'A pie', by_car: 'Auto', by_metro: 'Metro',
    locating: 'Obteniendo tu ubicación…', calculating: 'Calculando ruta…',
    location_error: 'No se pudo obtener tu ubicación', route_error: 'No se pudo calcular la ruta',
    distance: 'Distancia', duration_min: 'min', steps_label: 'Pasos', exit_nav: 'Salir',
    mode_walk: 'A pie', mode_drive: 'En auto',
    chat_title: 'Asistente Ruta Azteca', chat_greeting: '¡Hola! Soy tu guía de Ruta Azteca. ¿Qué experiencia buscas hoy?',
    chat_typing: 'Escribiendo…', chat_ph: '¿Qué buscas hoy?',
    chat_error: 'Lo siento, intenta de nuevo.', chat_conn_error: 'Error de conexión. Intenta de nuevo.',
    saved: 'Guardados', saved_places: '{n} lugares', no_saved: 'Sin lugares guardados',
    no_saved_hint: 'Dale ❤️ a un negocio para guardarlo aquí',
    tourist_fallback: 'Turista', my_saved: 'Mis guardados', sign_out: 'Cerrar sesión',
    anon_user: 'Explorador anónimo', login_to_personalize: 'Inicia sesión para personalizar tu experiencia',
    sign_in: 'Iniciar sesión', nav_explore: 'Explorar', nav_favorites: 'Favoritos', nav_routes: 'Rutas',
    hours: 'Horarios', open_now: 'Abierto', closed_now: 'Cerrado', closed_day: 'Cerrado',
    days_short: 'Lun,Mar,Mié,Jue,Vie,Sáb,Dom',
  },
  en: {
    search_ph: 'Search local businesses...', loading: 'Loading…',
    count_verified: '{n} verified businesses', more_results: '+{n} more results — keep typing to filter',
    back: 'Back to map', directions: 'Get directions',
    reviews: 'Reviews', write_review: '+ Write a review', cancel: 'Cancel',
    login_to_review: 'Sign in to leave a review', your_rating: 'Your rating',
    review_ph: 'Tell us about your experience...', submitting: 'Sending…', publish_review: 'Post review',
    no_reviews: 'No reviews yet. Be the first!', thanks_review: 'Thanks for your review!',
    route_to: 'Route to', on_foot: 'Walking', by_car: 'Car', by_metro: 'Metro',
    locating: 'Getting your location…', calculating: 'Calculating route…',
    location_error: 'Could not get your location', route_error: 'Could not calculate route',
    distance: 'Distance', duration_min: 'min', steps_label: 'Steps', exit_nav: 'Exit',
    mode_walk: 'Walking', mode_drive: 'Driving',
    chat_title: 'Ruta Azteca Assistant', chat_greeting: "Hi! I'm your Ruta Azteca guide. What experience are you looking for today?",
    chat_typing: 'Typing…', chat_ph: 'What are you looking for?',
    chat_error: 'Sorry, please try again.', chat_conn_error: 'Connection error. Please try again.',
    saved: 'Saved', saved_places: '{n} places', no_saved: 'No saved places',
    no_saved_hint: 'Heart a business to save it here',
    tourist_fallback: 'Tourist', my_saved: 'My saved', sign_out: 'Sign out',
    anon_user: 'Anonymous explorer', login_to_personalize: 'Sign in to personalize your experience',
    sign_in: 'Sign in', nav_explore: 'Explore', nav_favorites: 'Favorites', nav_routes: 'Routes',
    hours: 'Hours', open_now: 'Open now', closed_now: 'Closed', closed_day: 'Closed',
    days_short: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  },
  fr: {
    search_ph: 'Rechercher des commerces locaux...', loading: 'Chargement…',
    count_verified: '{n} commerces vérifiés', more_results: '+{n} résultats — continuez à taper pour filtrer',
    back: 'Retour à la carte', directions: 'Itinéraire',
    reviews: 'Avis', write_review: '+ Écrire un avis', cancel: 'Annuler',
    login_to_review: 'Connectez-vous pour laisser un avis', your_rating: 'Votre note',
    review_ph: 'Parlez-nous de votre expérience...', submitting: 'Envoi…', publish_review: "Publier l'avis",
    no_reviews: "Pas encore d'avis. Soyez le premier!", thanks_review: 'Merci pour votre avis!',
    route_to: 'Itinéraire vers', on_foot: 'À pied', by_car: 'Voiture', by_metro: 'Métro',
    locating: 'Obtention de votre position…', calculating: "Calcul de l'itinéraire…",
    location_error: 'Impossible d\'obtenir votre position', route_error: "Impossible de calculer l'itinéraire",
    distance: 'Distance', duration_min: 'min', steps_label: 'Étapes', exit_nav: 'Quitter',
    mode_walk: 'À pied', mode_drive: 'En voiture',
    chat_title: 'Assistant Ruta Azteca', chat_greeting: 'Bonjour! Je suis votre guide Ruta Azteca. Quelle expérience cherchez-vous?',
    chat_typing: "En train d'écrire…", chat_ph: 'Que cherchez-vous?',
    chat_error: 'Désolé, veuillez réessayer.', chat_conn_error: 'Erreur de connexion. Veuillez réessayer.',
    saved: 'Enregistrés', saved_places: '{n} lieux', no_saved: 'Aucun lieu enregistré',
    no_saved_hint: '❤️ un commerce pour le sauvegarder ici',
    tourist_fallback: 'Touriste', my_saved: 'Mes enregistrés', sign_out: 'Se déconnecter',
    anon_user: 'Explorateur anonyme', login_to_personalize: 'Connectez-vous pour personnaliser votre expérience',
    sign_in: 'Se connecter', nav_explore: 'Explorer', nav_favorites: 'Favoris', nav_routes: 'Itinéraires',
    hours: 'Horaires', open_now: 'Ouvert', closed_now: 'Fermé', closed_day: 'Fermé',
    days_short: 'Lun,Mar,Mer,Jeu,Ven,Sam,Dim',
  },
  pt: {
    search_ph: 'Pesquisar negócios locais...', loading: 'Carregando…',
    count_verified: '{n} negócios verificados', more_results: '+{n} resultados — continue digitando para filtrar',
    back: 'Voltar ao mapa', directions: 'Como chegar',
    reviews: 'Avaliações', write_review: '+ Escrever avaliação', cancel: 'Cancelar',
    login_to_review: 'Entre para deixar uma avaliação', your_rating: 'Sua avaliação',
    review_ph: 'Conte-nos sobre sua experiência...', submitting: 'Enviando…', publish_review: 'Publicar avaliação',
    no_reviews: 'Sem avaliações ainda. Seja o primeiro!', thanks_review: 'Obrigado pela sua avaliação!',
    route_to: 'Rota para', on_foot: 'A pé', by_car: 'Carro', by_metro: 'Metrô',
    locating: 'Obtendo sua localização…', calculating: 'Calculando rota…',
    location_error: 'Não foi possível obter sua localização', route_error: 'Não foi possível calcular a rota',
    distance: 'Distância', duration_min: 'min', steps_label: 'Passos', exit_nav: 'Sair',
    mode_walk: 'A pé', mode_drive: 'De carro',
    chat_title: 'Assistente Ruta Azteca', chat_greeting: 'Olá! Sou seu guia Ruta Azteca. Que experiência você procura hoje?',
    chat_typing: 'Digitando…', chat_ph: 'O que você está procurando?',
    chat_error: 'Desculpe, tente novamente.', chat_conn_error: 'Erro de conexão. Tente novamente.',
    saved: 'Salvos', saved_places: '{n} lugares', no_saved: 'Nenhum lugar salvo',
    no_saved_hint: 'Curta ❤️ um negócio para salvá-lo aqui',
    tourist_fallback: 'Turista', my_saved: 'Meus salvos', sign_out: 'Sair',
    anon_user: 'Explorador anônimo', login_to_personalize: 'Entre para personalizar sua experiência',
    sign_in: 'Entrar', nav_explore: 'Explorar', nav_favorites: 'Favoritos', nav_routes: 'Rotas',
    hours: 'Horários', open_now: 'Aberto', closed_now: 'Fechado', closed_day: 'Fechado',
    days_short: 'Seg,Ter,Qua,Qui,Sex,Sáb,Dom',
  },
  de: {
    search_ph: 'Lokale Unternehmen suchen...', loading: 'Laden…',
    count_verified: '{n} verifizierte Unternehmen', more_results: '+{n} weitere Ergebnisse — tippen Sie weiter zum Filtern',
    back: 'Zurück zur Karte', directions: 'Route',
    reviews: 'Bewertungen', write_review: '+ Bewertung schreiben', cancel: 'Abbrechen',
    login_to_review: 'Anmelden um zu bewerten', your_rating: 'Ihre Bewertung',
    review_ph: 'Erzählen Sie uns von Ihrer Erfahrung...', submitting: 'Senden…', publish_review: 'Bewertung veröffentlichen',
    no_reviews: 'Noch keine Bewertungen. Seien Sie der Erste!', thanks_review: 'Vielen Dank für Ihre Bewertung!',
    route_to: 'Route nach', on_foot: 'Zu Fuß', by_car: 'Auto', by_metro: 'U-Bahn',
    locating: 'Standort wird ermittelt…', calculating: 'Route wird berechnet…',
    location_error: 'Standort konnte nicht ermittelt werden', route_error: 'Route konnte nicht berechnet werden',
    distance: 'Entfernung', duration_min: 'Min', steps_label: 'Schritte', exit_nav: 'Beenden',
    mode_walk: 'Zu Fuß', mode_drive: 'Mit dem Auto',
    chat_title: 'Ruta Azteca Assistent', chat_greeting: 'Hallo! Ich bin Ihr Ruta Azteca Guide. Was suchen Sie heute?',
    chat_typing: 'Schreiben…', chat_ph: 'Was suchen Sie?',
    chat_error: 'Entschuldigung, bitte versuchen Sie es erneut.', chat_conn_error: 'Verbindungsfehler. Bitte erneut versuchen.',
    saved: 'Gespeichert', saved_places: '{n} Orte', no_saved: 'Keine gespeicherten Orte',
    no_saved_hint: '❤️ Sie ein Unternehmen um es hier zu speichern',
    tourist_fallback: 'Tourist', my_saved: 'Meine Gespeicherten', sign_out: 'Abmelden',
    anon_user: 'Anonymer Entdecker', login_to_personalize: 'Anmelden um Ihr Erlebnis zu personalisieren',
    sign_in: 'Anmelden', nav_explore: 'Erkunden', nav_favorites: 'Favoriten', nav_routes: 'Routen',
    hours: 'Öffnungszeiten', open_now: 'Geöffnet', closed_now: 'Geschlossen', closed_day: 'Geschlossen',
    days_short: 'Mo,Di,Mi,Do,Fr,Sa,So',
  },
}

// ─── Horario helpers ────────────────────────────────────────────────────────

const HORARIO_DIAS = ['dom','lun','mar','mie','jue','vie','sab'] as const

function isOpenNow(horario: Horario): boolean {
  const now  = new Date()
  const key  = HORARIO_DIAS[now.getDay()]
  const dia  = horario[key]
  if (!dia || !dia.abierto) return false
  const cur  = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = dia.apertura.split(':').map(Number)
  const [ch, cm] = dia.cierre.split(':').map(Number)
  return cur >= oh * 60 + om && cur < ch * 60 + cm
}

// ─── SVG icons ─────────────────────────────────────────────────────────────

const SearchIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
const MicIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
const StarIcon    = ({ size = 12 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#C5A044" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const VerifiedBadge = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#1A9E78" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const BackIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const RouteIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>
const ClockIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const CloseIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChatFabIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SendIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
const ShareIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2E26" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
const PersonIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const BookmarkIcon  = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#0D7C66' : 'none'} stroke={filled ? '#0D7C66' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)


// ─── Types ──────────────────────────────────────────────────────────────────

interface Resena {
  id: string; negocioId: string; userId: string; userName: string
  userImage?: string; calificacion: number; comentario: string; createdAt: string
}

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <svg width="28" height="28" viewBox="0 0 24 24"
            fill={n <= (hover || value) ? '#C5A044' : 'none'}
            stroke={n <= (hover || value) ? '#C5A044' : '#ccc'} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

// ─── Detail bottom sheet ────────────────────────────────────────────────────

function DetailSheet({ negocio, session, isDesktop, onBack, onRoute, onFullPage }: {
  negocio: Negocio
  session: ReturnType<typeof useSession>['data']
  isDesktop: boolean
  onBack: () => void
  onRoute: () => void
  onFullPage: () => void
}) {
  const color   = CATEGORIA_COLOR[negocio.categoria] ?? '#1A9E78'
  const CatIcon = CATEGORIA_LUCIDE[negocio.categoria] ?? Store
  const cat     = CATS.find(c => c.slug === negocio.categoria)

  const { t, idioma } = useTranslation()
  const ui = MAP_UI[idioma] ?? MAP_UI.en
  const [descripcionT, setDescripcionT] = useState(negocio.descripcion)
  const [tagsT,        setTagsT]        = useState(negocio.tags ?? [])
  const [catLabelT,    setCatLabelT]    = useState(cat?.label ?? negocio.categoria)
  const [traduciendo,  setTraduciendo]  = useState(false)

  useEffect(() => {
    setDescripcionT(negocio.descripcion)
    setTagsT(negocio.tags ?? [])
    setCatLabelT(cat?.label ?? negocio.categoria)
  }, [negocio.id])

  useEffect(() => {
    if (idioma === 'es') return
    setTraduciendo(true)
    Promise.all([
      t(negocio.descripcion),
      t(cat?.label ?? negocio.categoria),
      Promise.all((negocio.tags ?? []).map(tag => t(tag))),
    ]).then(([desc, catL, tags]) => {
      setDescripcionT(desc as string)
      setCatLabelT(catL as string)
      setTagsT(tags as string[])
    }).finally(() => setTraduciendo(false))
  }, [idioma, negocio.id])

  const [isFav,        setIsFav]       = useState(false)
  const [favLoading,   setFavLoading]  = useState(false)
  const [resenas,      setResenas]     = useState<Resena[]>([])
  const [showForm,     setShowForm]    = useState(false)
  const [stars,        setStars]       = useState(0)
  const [comentario,   setComentario]  = useState('')
  const [submitting,   setSubmitting]  = useState(false)
  const [submitMsg,    setSubmitMsg]   = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Fetch favorites status + reviews on mount
  useEffect(() => {
    fetch(`/api/resenas?negocioId=${negocio.id}`)
      .then(r => r.json())
      .then(j => setResenas(j.data ?? []))
      .catch(() => {})

    if (session) {
      fetch('/api/favoritos')
        .then(r => r.json())
        .then(j => setIsFav((j.data ?? []).includes(negocio.id)))
        .catch(() => {})
    }
  }, [negocio.id, session])

  const toggleFav = async () => {
    if (!session) return
    setFavLoading(true)
    try {
      const method = isFav ? 'DELETE' : 'POST'
      await fetch('/api/favoritos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocio.id }),
      })
      setIsFav(prev => !prev)
    } finally {
      setFavLoading(false)
    }
  }

  const submitResena = async () => {
    if (stars === 0 || !comentario.trim()) return
    setSubmitting(true)
    try {
      const res  = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId: negocio.id, calificacion: stars, comentario }),
      })
      if (res.ok) {
        const newResena: Resena = {
          id: Date.now().toString(),
          negocioId: negocio.id,
          userId: '',
          userName: session?.user?.name ?? 'Tú',
          userImage: session?.user?.image ?? undefined,
          calificacion: stars,
          comentario: comentario.trim(),
          createdAt: new Date().toISOString(),
        }
        setResenas(prev => [newResena, ...prev])
        setShowForm(false)
        setStars(0)
        setComentario('')
        setSubmitMsg(ui.thanks_review)
        setTimeout(() => setSubmitMsg(''), 3000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const avgCal = resenas.length
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : negocio.calificacion?.toFixed(1)

  return (
    <div className="glass-panel-map text-[#1A2E26]" style={{
      position: 'absolute', 
      bottom: isDesktop ? 16 : 20, 
      left: isDesktop ? 412 : 0, 
      right: isDesktop ? 16 : 0,
      borderRadius: isDesktop ? 24 : '20px 20px 0 0',
      padding: '8px 20px 36px',
      zIndex: 30, maxHeight: '72vh', overflowY: 'auto',
      borderTop: 'none',
    }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#0D7C66', opacity: 0.6, margin: '0 auto 12px' }} />

      {/* Back + Fav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8a9690', fontSize: 13, padding: 0,
        }}>
          <BackIcon /> {ui.back}
        </button>
        <button onClick={toggleFav} disabled={!session || favLoading} style={{
          width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(26, 46, 38, 0.12)',
          background: isFav ? 'rgba(229,62,62,0.15)' : 'rgba(26, 46, 38, 0.08)',
          cursor: session ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill={isFav ? '#e53e3e' : 'none'}
            stroke={isFav ? '#e53e3e' : '#8a9690'} strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && negocio.imagenUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={negocio.imagenUrl}
            alt={negocio.nombre}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '92vw', maxHeight: '80vh',
              borderRadius: 16, objectFit: 'contain',
              boxShadow: '0 8px 40px rgba(0,0,0,.6)',
            }}
          />
        </div>
      )}

      {/* Hero */}
      <div style={{
        width: '100%', height: 150, borderRadius: 14,
        background: `linear-gradient(135deg, ${color}20, ${color}40)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, position: 'relative',
        cursor: negocio.imagenUrl ? 'zoom-in' : 'default',
      }} onClick={() => negocio.imagenUrl && setLightboxOpen(true)}>
        {negocio.imagenUrl
          ? <img src={negocio.imagenUrl} alt={negocio.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
          : <CatIcon size={52} color={color} />
        }
        {negocio.imagenUrl && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,.45)', borderRadius: 8, padding: '4px 6px',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </div>
        )}
        {avgCal && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#fff', borderRadius: 8, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600,
          }}>
            <StarIcon size={14} /> {avgCal}
            {resenas.length > 0 && <span style={{ color: '#8a9690', fontWeight: 400 }}>({resenas.length})</span>}
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2E26' }}>{negocio.nombre}</h2>
        <VerifiedBadge />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          padding: '3px 10px', borderRadius: 8,
          background: `rgba(26, 46, 38, 0.1)`, color: color,
          fontSize: 12, fontWeight: 700, textShadow: '0 0 8px rgba(0,0,0,0.4)',
          opacity: traduciendo ? 0.5 : 1, transition: 'opacity .3s',
        }}>{catLabelT}</span>
        <span style={{ fontSize: 12, color: '#8a9690', display: 'flex', alignItems: 'center', gap: 3 }}>
          <ClockIcon /> {negocio.direccion.split(',')[0]}
        </span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#1A2E26', lineHeight: 1.6, opacity: traduciendo ? 0.5 : 0.9, transition: 'opacity .3s' }}>
        {descripcionT}
      </p>

      {tagsT.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {tagsT.map(t => (
            <span key={t} style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(26, 46, 38, 0.08)', color: '#8a9690', border: '1px solid rgba(26, 46, 38, 0.12)', fontSize: 12,
            }}>{t}</span>
          ))}
        </div>
      )}

      {/* Horarios */}
      {negocio.horario && (() => {
        const abierto = isOpenNow(negocio.horario)
        const dayNames = ui.days_short.split(',')
        const todayIdx = new Date().getDay() // 0=Sun
        return (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClockIcon /> {ui.hours}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: abierto ? 'rgba(13,124,102,0.12)' : 'rgba(220,38,38,0.1)',
                color: abierto ? '#0D7C66' : '#DC2626',
              }}>
                {abierto ? ui.open_now : ui.closed_now}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {HORARIO_DIAS.map((key, i) => {
                const dia = negocio.horario![key]
                const isToday = i === todayIdx
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '3px 6px', borderRadius: 6,
                    background: isToday ? 'rgba(13,124,102,0.07)' : 'transparent',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#0D7C66' : '#8a9690', width: 32 }}>
                      {dayNames[i === 0 ? 6 : i - 1]}
                    </span>
                    {dia?.abierto
                      ? <span style={{ fontSize: 12, color: isToday ? '#0D7C66' : '#1A2E26', fontWeight: isToday ? 600 : 400 }}>{dia.apertura} – {dia.cierre}</span>
                      : <span style={{ fontSize: 12, color: '#DC2626' }}>{ui.closed_day}</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={onRoute} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', background: '#0D7C66',
          border: '1px solid #0D7C66', borderRadius: 14, cursor: 'pointer',
          color: '#fff', fontWeight: 600, fontSize: 15,
        }}>
          <RouteIcon /> {ui.directions}
        </button>
        <button onClick={onFullPage} style={{
          width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(26, 46, 38, 0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, cursor: 'pointer',
          color: '#1A2E26'
        }}>
          <ShareIcon />
        </button>
      </div>

      {/* ── Reseñas ── */}
      <div style={{ borderTop: '1px solid rgba(26, 46, 38, 0.12)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1A2E26' }}>
            {ui.reviews} {resenas.length > 0 && `(${resenas.length})`}
          </span>
          {session
            ? <button onClick={() => setShowForm(f => !f)} style={{
                padding: '6px 14px', borderRadius: 20,
                background: showForm ? 'rgba(26, 46, 38, 0.08)' : '#0D7C66',
                border: showForm ? '1px solid rgba(26, 46, 38, 0.15)' : '1px solid #0D7C66', cursor: 'pointer',
                color: '#1A2E26', fontSize: 13, fontWeight: 600,
              }}>
                {showForm ? ui.cancel : ui.write_review}
              </button>
            : <span style={{ fontSize: 12, color: '#8a9690' }}>{ui.login_to_review}</span>
          }
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px',
            marginBottom: 16, border: '1px solid rgba(26, 46, 38, 0.1)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#1A2E26' }}>{ui.your_rating}</p>
            <StarPicker value={stars} onChange={setStars} />
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder={ui.review_ph}
              rows={3}
              style={{
                width: '100%', marginTop: 12, padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                fontSize: 14, resize: 'none', outline: 'none',
                background: 'rgba(26, 46, 38, 0.08)', color: '#1A2E26', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={submitResena}
              disabled={submitting || stars === 0 || !comentario.trim()}
              style={{
                marginTop: 10, width: '100%', padding: '12px',
                background: stars > 0 && comentario.trim() ? '#0D7C66' : 'rgba(255,255,255,0.03)',
                border: stars > 0 && comentario.trim() ? '1px solid #0D7C66' : '1px solid rgba(26, 46, 38, 0.12)', borderRadius: 12, cursor: stars > 0 && comentario.trim() ? 'pointer' : 'default',
                color: stars > 0 && comentario.trim() ? '#fff' : '#8a9690',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {submitting ? ui.submitting : ui.publish_review}
            </button>
          </div>
        )}

        {submitMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(26, 46, 38, 0.1)', border: '1px solid #0D7C66', borderRadius: 10, marginBottom: 12, fontSize: 13, color: '#8a9690', fontWeight: 600 }}>
            {submitMsg}
          </div>
        )}

        {/* Reviews list */}
        {resenas.length === 0 && !showForm && (
          <p style={{ fontSize: 13, color: '#8a9690', textAlign: 'center', padding: '16px 0', opacity: 0.8 }}>
            {ui.no_reviews}
          </p>
        )}
        {resenas.map(r => (
          <div key={r.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(26, 46, 38, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: '#0D7C66', border: '1px solid rgba(26, 46, 38, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {r.userImage
                  ? <img src={r.userImage} alt={r.userName} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{r.userName[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26' }}>{r.userName}</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="11" height="11" viewBox="0 0 24 24"
                      fill={n <= r.calificacion ? '#C5A044' : 'rgba(26, 46, 38, 0.15)'} stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#8a9690', opacity: 0.7 }}>
                {new Date(r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#1A2E26', lineHeight: 1.55, opacity: 0.9 }}>{r.comentario}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Route panel ─────────────────────────────────────────────────────────────

import { MAPBOX_TOKEN } from '@/lib/mapbox'

type RouteMode = 'walking' | 'driving'

interface RouteStep {
  instruction: string
  distance: number
  duration: number
  type: string      // maneuver type: turn, arrive, depart, etc.
  modifier?: string // left, right, straight, etc.
}
interface RouteResult { distance: number; duration: number; steps: RouteStep[]; geometry: GeoJSON.LineString }

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}
function formatMin(s: number) {
  const m = Math.round(s / 60)
  return m < 60 ? `${m}` : `${Math.floor(m / 60)}h ${m % 60}`
}

// Flecha de maniobra según tipo y modificador
function ManeuverArrow({ type, modifier, size = 32, color = '#fff' }: { type: string; modifier?: string; size?: number; color?: string }) {
  const s = size
  // arrive
  if (type === 'arrive') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill={color} stroke="none"/>
      <circle cx="12" cy="12" r="9"/>
    </svg>
  )
  // turn left
  if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V9M9 9l-4 4M9 9l4 4"/><path d="M15 18v-3a4 4 0 00-4-4H9"/>
    </svg>
  )
  // turn right
  if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18V9M15 9l4 4M15 9l-4 4"/><path d="M9 18v-3a4 4 0 014-4h2"/>
    </svg>
  )
  // uturn
  if (modifier === 'uturn') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 18V8a4 4 0 018 0v2"/><path d="M16 10l2-2-2-2"/>
    </svg>
  )
  // straight / depart / default
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M12 5l-4 4M12 5l4 4"/>
    </svg>
  )
}

function RoutePanel({
  negocio, onClose, mapRef, isDesktop,
}: {
  negocio: Negocio
  onClose: () => void
  mapRef: React.RefObject<MapViewHandle | null>
  isDesktop?: boolean
}) {
  const { idioma } = useTranslation()
  const ui = MAP_UI[idioma] ?? MAP_UI.en
  const lang = idioma === 'es' ? 'es' : idioma === 'fr' ? 'fr' : idioma === 'pt' ? 'pt' : idioma === 'de' ? 'de' : 'en'

  const [mode, setMode]       = useState<RouteMode>('walking')
  const [status, setStatus]   = useState<'locating' | 'calculating' | 'done' | 'error'>('locating')
  const [errorMsg, setErrorMsg] = useState('')
  const [route, setRoute]     = useState<RouteResult | null>(null)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [showSteps, setShowSteps] = useState(false)

  const fetchRoute = useCallback(async (origin: [number, number], m: RouteMode) => {
    setStatus('calculating')
    setRoute(null)
    setStepIdx(0)
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${m}/` +
        `${origin[0]},${origin[1]};${negocio.lng},${negocio.lat}` +
        `?geometries=geojson&steps=true&language=${lang}&access_token=${MAPBOX_TOKEN}`
      const res  = await fetch(url)
      const data = await res.json()
      if (!data.routes?.length) throw new Error('no routes')
      const r = data.routes[0]
      const result: RouteResult = {
        distance: r.distance,
        duration: r.duration,
        geometry: r.geometry,
        steps: r.legs[0].steps.map((s: { maneuver: { instruction: string; type: string; modifier?: string }; distance: number; duration: number }) => ({
          instruction: s.maneuver.instruction,
          distance: s.distance,
          duration: s.duration,
          type: s.maneuver.type,
          modifier: s.maneuver.modifier,
        })),
      }
      setRoute(result)
      setStatus('done')
      const coords = r.geometry.coordinates as [number, number][]
      const lngs = coords.map((c: [number, number]) => c[0])
      const lats = coords.map((c: [number, number]) => c[1])
      mapRef.current?.drawRoute(r.geometry, [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ])
    } catch {
      setStatus('error')
      setErrorMsg(ui.route_error)
    }
  }, [negocio, lang, ui.route_error, mapRef])

  useEffect(() => {
    if (!navigator.geolocation) { setStatus('error'); setErrorMsg(ui.location_error); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        setUserLoc(loc)
        fetchRoute(loc, mode)
      },
      () => { setStatus('error'); setErrorMsg(ui.location_error) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userLoc) fetchRoute(userLoc, mode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleClose = () => { mapRef.current?.clearRoute(); onClose() }

  const reCenter = () => {
    // Usar el GeolocateControl de Mapbox ya existente en el mapa
    const btn = document.querySelector('.mapboxgl-ctrl-geolocate') as HTMLButtonElement | null
    btn?.click()
  }

  const steps = route?.steps.filter(s => s.instruction) ?? []
  const currentStep = steps[stepIdx]
  const nextStep    = steps[stepIdx + 1]
  // Altura estimada del bottom bar para posicionar el recentrar (incluye el margen inferior de 16px en mobile)
  const bottomBarH = isDesktop ? 110 : showSteps ? 376 : 146

  return (
    <>
      {/* ── LAYER 1: Top instruction card ──────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: isDesktop ? 16 : 8,
        left: isDesktop ? 428 : 8,
        right: 8,
        zIndex: 45,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {status === 'done' && currentStep && (
          <div style={{
            background: '#0D7C66',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Maneuver icon */}
            <div style={{
              width: 48, height: 48, flexShrink: 0,
              background: 'rgba(0,0,0,0.2)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ManeuverArrow type={currentStep.type} modifier={currentStep.modifier} size={28} />
            </div>
            {/* Instruction text — multiline, no ellipsis */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                {currentStep.instruction}
              </div>
              {currentStep.distance > 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: 600 }}>
                  {formatDist(currentStep.distance)}
                </div>
              )}
            </div>
            {/* Next step mini preview */}
            {nextStep && (
              <div style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '6px 8px',
                minWidth: 44,
              }}>
                <ManeuverArrow type={nextStep.type} modifier={nextStep.modifier} size={18} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>
                  {formatDist(nextStep.distance)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {(status === 'locating' || status === 'calculating') && (
          <div style={{
            background: '#0D7C66', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#fff', flexShrink: 0,
              animation: 'bounce 1.2s ease-in-out infinite',
            }} />
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
              {status === 'locating' ? ui.locating : ui.calculating}
            </span>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            background: '#DC2626', padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{errorMsg}</span>
            <button onClick={handleClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
              padding: '4px 10px', color: '#fff', fontSize: 12, cursor: 'pointer',
            }}>{ui.exit_nav}</button>
          </div>
        )}
      </div>

      {/* ── LAYER 2: Floating recenter button (above bottom bar) ──────── */}
      <button
        onClick={reCenter}
        style={{
          position: 'absolute',
          bottom: bottomBarH + 12,
          right: isDesktop ? 24 : 12,
          zIndex: 45,
          width: 48, height: 48,
          borderRadius: '50%',
          background: '#fff',
          border: 'none',
          boxShadow: '0 3px 14px rgba(0,0,0,0.22)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'box-shadow .15s',
        }}
      >
        <Navigation2 size={22} color="#0D7C66" />
      </button>

      {/* ── LAYER 3: Bottom navigation bar ──────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: isDesktop ? 16 : 16,
        left: isDesktop ? 412 : 12,
        right: isDesktop ? 16 : 12,
        zIndex: 44,
        background: '#1A2E26',
        borderRadius: 20,
        boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
      }}>
        {/* Steps list — fuera del padding del bar para no empujar los datos */}
        {showSteps && route && (
          <div style={{
            maxHeight: 220, overflowY: 'auto',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 12px',
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            {steps.map((step, i) => (
              <button key={i} onClick={() => { setStepIdx(i); setShowSteps(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 8px', borderRadius: 10, cursor: 'pointer', border: 'none', textAlign: 'left',
                background: stepIdx === i ? 'rgba(13,124,102,0.35)' : 'transparent',
                width: '100%',
              }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                  background: stepIdx === i ? '#0D7C66' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ManeuverArrow type={step.type} modifier={step.modifier} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.3 }}>{step.instruction}</div>
                  {step.distance > 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{formatDist(step.distance)}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main bar content */}
        <div style={{ padding: '10px 16px 14px' }}>
          {/* Mode selector row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['walking', Footprints, ui.mode_walk], ['driving', Car, ui.mode_drive]] as const).map(([m, Icon, label]) => (
                <button key={m} onClick={() => setMode(m as RouteMode)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: mode === m ? '#0D7C66' : 'rgba(255,255,255,0.08)',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 'none', transition: 'all .15s',
                }}>
                  <Icon size={15} />
                  {mode === m && <span>{label}</span>}
                </button>
              ))}
            </div>
            {/* Step navigator: prev / counter / next */}
            {route && steps.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0} style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: stepIdx === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>‹</button>
                <button onClick={() => setShowSteps(v => !v)} style={{
                  padding: '3px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11,
                }}>
                  {stepIdx + 1}/{steps.length}
                </button>
                <button onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))} disabled={stepIdx === steps.length - 1} style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: stepIdx === steps.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>›</button>
              </div>
            )}
          </div>

          {/* Time + distance + exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {route ? (
                <>
                  <div style={{ fontSize: 34, fontWeight: 800, color: '#0D7C66', lineHeight: 1 }}>
                    {formatMin(route.duration)}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                      {ui.duration_min}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                    {formatDist(route.distance)}
                  </div>
                </>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, paddingTop: 4 }}>—</div>
              )}
            </div>
            <button onClick={handleClose} style={{
              padding: '13px 26px', borderRadius: 50,
              background: '#DC2626', border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 3px 10px rgba(220,38,38,0.4)',
              letterSpacing: '0.02em',
            }}>
              {ui.exit_nav}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Chat panel ─────────────────────────────────────────────────────────────

interface ChatCardItem {
  id: string; name: string; description: string; address: string
  image: string; rating: number; tags: string[]
  action: { type: string; target: string }
}
interface ChatCardData { type: 'cards' | 'empty'; title?: string; items?: ChatCardItem[]; message?: string }
type ChatMsg = { from: 'bot' | 'user'; text?: string; cards?: ChatCardData }

function tryParseCards(text: string): ChatCardData | null {
  const attempt = (s: string) => {
    try {
      const p = JSON.parse(s)
      if (p.type === 'cards' || p.type === 'empty') return p as ChatCardData
    } catch { /* not json */ }
    return null
  }
  const direct = attempt(text.trim())
  if (direct) return direct
  const match = text.match(/\{[\s\S]*\}/)
  return match ? attempt(match[0]) : null
}

function ChatCardBubble({ cards, onNavigate }: { cards: ChatCardData; onNavigate: (id: string) => void }) {
  if (cards.type === 'empty') {
    return (
      <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'rgba(26,46,38,0.1)', border: '1px solid rgba(26,46,38,0.12)', fontSize: 14, color: '#8a9690' }}>
        {cards.message}
      </div>
    )
  }
  return (
    <div style={{ alignSelf: 'flex-start', width: '100%' }}>
      {cards.title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2E26', marginBottom: 8 }}>{cards.title}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.items?.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.action.target)}
            style={{
              display: 'flex', alignItems: 'stretch',
              background: '#fff', border: '1.5px solid #e8e5de',
              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,.07)', textAlign: 'left',
              padding: 0, width: '100%',
            }}
          >
            <div style={{
              width: 60, minHeight: 60, flexShrink: 0,
              background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>{item.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#C5A044', fontWeight: 700 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#C5A044"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {item.rating.toFixed(1)}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#5a6e67', lineHeight: 1.3 }}>{item.description}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0D7C66" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 10, color: '#8a9690' }}>{item.address}</span>
              </div>
              {item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'rgba(13,124,102,0.1)', color: '#0D7C66', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 8, color: '#0D7C66' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatPanel({ onClose, isDesktop, onSelectNegocio }: { onClose: () => void; isDesktop?: boolean; onSelectNegocio?: (id: string) => void }) {
  const { idioma } = useTranslation()
  const ui = MAP_UI[idioma] ?? MAP_UI.en
  const [msgs, setMsgs]       = useState<ChatMsg[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMsgs([{ from: 'bot', text: (MAP_UI[idioma] ?? MAP_UI.en).chat_greeting }])
  }, [idioma])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMsgs(prev => [...prev, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const historial = msgs.map(m => ({ rol: m.from === 'user' ? 'user' : 'assistant', contenido: m.text ?? (m.cards?.title ?? '') }))
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: text, historial, idioma }),
      })
      const json = await res.json()
      const respuesta: string = json.data?.respuesta ?? ui.chat_error
      const cards = tryParseCards(respuesta)
      setMsgs(prev => [...prev, cards ? { from: 'bot', cards } : { from: 'bot', text: respuesta }])
    } catch {
      setMsgs(prev => [...prev, { from: 'bot', text: ui.chat_conn_error }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel-map" style={{
      position: 'absolute',
      bottom: isDesktop ? 116 : 160,
      right: 16,
      left: isDesktop ? 412 : 16,
      width: isDesktop ? 360 : undefined,
      borderRadius: isDesktop ? 24 : 20,
      zIndex: 40, display: 'flex', flexDirection: 'column',
      maxHeight: '60vh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'rgba(26, 46, 38, 0.08)', borderBottom: '1px solid rgba(26, 46, 38, 0.12)',
        borderRadius: '20px 20px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#0D7C66',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={15} color="#fff" />
          </div>
          <span style={{ color: '#1A2E26', fontWeight: 600, fontSize: 14 }}>{ui.chat_title}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
          <CloseIcon />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: m.cards ? '100%' : '85%',
          }}>
            {m.cards ? (
              <ChatCardBubble cards={m.cards} onNavigate={(id) => { onSelectNegocio?.(id); onClose() }} />
            ) : (
              <div style={{
                padding: '10px 14px',
                borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.from === 'user' ? '#0D7C66' : 'rgba(26, 46, 38, 0.1)',
                border: m.from === 'user' ? 'none' : '1px solid rgba(26, 46, 38, 0.12)',
                color: m.from === 'user' ? '#fff' : '#1A2E26',
                fontSize: 14, lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>{m.text}</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px', background: 'rgba(26, 46, 38, 0.08)', border: '1px solid rgba(26, 46, 38, 0.12)',
            color: '#8a9690', fontSize: 14,
          }}>{ui.chat_typing}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderTop: '1px solid rgba(26, 46, 38, 0.12)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={ui.chat_ph}
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
            fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.04)', color: '#1A2E26'
          }}
        />
        <button onClick={send} disabled={loading} style={{
          width: 40, height: 40, borderRadius: 12,
          background: '#0D7C66', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', opacity: loading ? 0.6 : 1,
        }}>
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MapaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { idioma: idiomaGlobal } = useTranslation()
  const ui = MAP_UI[idiomaGlobal] ?? MAP_UI.en
  const catLabel = (slug: string) => (CAT_LABELS[idiomaGlobal] ?? CAT_LABELS.en)[slug] ?? slug

  const [negocios,    setNegocios]    = useState<Negocio[]>([])
  const [selected,    setSelected]    = useState<Negocio | null>(null)
  const [categoria,   setCategoria]   = useState<CategoriaSlug | ''>('')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [showDetail,  setShowDetail]  = useState(false)
  const [showRoute,   setShowRoute]   = useState(false)
  const [showChat,    setShowChat]    = useState(false)
  const [showProfile,    setShowProfile]    = useState(false)
  const [showFavoritos,  setShowFavoritos]  = useState(false)
  const [favIds,         setFavIds]         = useState<string[]>([])
  const [favNegocios,    setFavNegocios]    = useState<Negocio[]>([])
  const [listening,      setListening]      = useState(false)
  // bottom sheet state: 'peek' | 'half' | 'full'
  const [sheetState,     setSheetState]     = useState<'peek' | 'half' | 'full'>('peek')
  const [isDesktop,      setIsDesktop]      = useState(false)
  const mapViewRef = useRef<MapViewHandle>(null)
  const [activeTab,      setActiveTab]      = useState<string>('explorar')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const fetchNegocios = useCallback(async (cat: CategoriaSlug | '') => {
    setLoading(true)
    try {
      const url  = cat ? `/api/negocios?categoria=${cat}` : '/api/negocios'
      const res  = await fetch(url)
      const json = await res.json()
      setNegocios(json.data?.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNegocios(categoria) }, [categoria, fetchNegocios])

  // Prefetch favoritos en background cuando hay sesión
  useEffect(() => {
    if (!session) return
    fetch('/api/favoritos')
      .then(r => r.json())
      .then(async json => {
        const ids: string[] = json.data ?? []
        setFavIds(ids)
        const items = await Promise.all(
          ids.map(id =>
            fetch(`/api/negocios/${id}`).then(r => r.json()).then(j => j.data as Negocio).catch(() => null)
          )
        )
        setFavNegocios(items.filter(Boolean) as Negocio[])
      })
      .catch(() => {})
  }, [session])

  const filtered = search
    ? negocios.filter(n =>
        n.nombre.toLowerCase().includes(search.toLowerCase()) ||
        n.descripcion?.toLowerCase().includes(search.toLowerCase()),
      )
    : negocios

  const handleSelect = useCallback((negocio: Negocio) => {
    setSelected(negocio)
    setShowDetail(true)
    setShowRoute(false)
    setShowChat(false)
  }, [])

  const handleBack = () => {
    setShowDetail(false)
    setShowRoute(false)
    setSelected(null)
  }

  // Voz (Web Speech API)
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-MX'
    recognition.onstart  = () => setListening(true)
    recognition.onend    = () => setListening(false)
    recognition.onresult = (e: any) => setSearch(e.results[0][0].transcript)
    recognition.start()
  }

  const openFavoritos = () => {
    if (!session) { router.push('/login'); return }
    setShowFavoritos(true)
  }

  const SHEET_HEIGHTS = { peek: 72, half: 340, full: Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600) }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        .img-thumb { overflow: hidden; }
        .img-thumb img { transition: transform .35s ease; }
        .img-thumb:hover img { transform: scale(1.18); }
      `}</style>

      {/* ── Desktop left panel ── */}
      {isDesktop && (
        <div className="glass-panel-map" style={{
          width: 380, flexShrink: 0, height: 'calc(100vh - 32px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 20, position: 'absolute', top: 16, left: 16, 
          borderRadius: 24, paddingBottom: 16,
          boxShadow: 'var(--glass-shadow)',
          border: 'none'
        }}>
          {/* Panel header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(26, 46, 38, 0.12)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0D7C66', letterSpacing: '.05em' }}>RUTA AZTECA</span>
              <VerifiedBadge />
              {idiomaGlobal !== 'es' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, background: 'rgba(13,124,102,0.1)', border: '1px solid rgba(13,124,102,0.2)' }}>
                  <Globe size={11} color='#0D7C66' />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase' }}>{idiomaGlobal}</span>
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8a9690', fontWeight: 500 }}>CDMX</span>
              <button onClick={() => setShowProfile(true)} style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', padding: 0, background: session?.user?.image ? 'transparent' : session ? '#0D7C66' : 'rgba(26, 46, 38, 0.12)', border: '1px solid rgba(26, 46, 38, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {session?.user?.image
                  ? <img src={session.user.image} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : session?.user?.name
                    ? <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{session.user.name[0].toUpperCase()}</span>
                    : <span style={{ color: '#8a9690' }}><PersonIcon /></span>
                }
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 8px 14px', background: 'rgba(255, 255, 255, 0.95)', borderRadius: 12, border: '1px solid rgba(26, 46, 38, 0.12)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ color: '#8a9690', display: 'flex' }}><SearchIcon /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Escape' && setSearch('')}
                  placeholder={ui.search_ph}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1A2E26' }}
                />
                {search.trim()
                  ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  : <button onClick={startVoice} style={{ width: 32, height: 32, borderRadius: 8, background: listening ? '#0D7C66' : 'transparent', border: listening ? '1px solid #0D7C66' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: listening ? '#fff' : '#8a9690' }}>
                      <MicIcon />
                    </button>
                }
              </div>
              {/* Desktop search dropdown */}
              {search.trim() && filtered.length > 0 && (
                <div className="glass-panel-map" style={{ position: 'absolute', top: '100%', left: 0, right: 0, borderRadius: '0 0 12px 12px', boxShadow: '0 8px 32px rgba(0,0,0,.5)', overflow: 'hidden', maxHeight: 260, overflowY: 'auto', zIndex: 10, border: '1px solid rgba(26, 46, 38, 0.12)', borderTop: 'none' }}>
                  {filtered.slice(0, 7).map((n, i) => {
                    const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                    const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                    return (
                      <button key={n.id} onClick={() => { handleSelect(n); setSearch('') }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid rgba(26, 46, 38, 0.08)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${color}25`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CatIcon size={14} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</div>
                          <div style={{ fontSize: 11, color: '#8a9690' }}>{n.direccion.split(',')[0]}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {CATS.map(cat => (
                <button key={cat.slug} onClick={() => setCategoria(cat.slug as CategoriaSlug | '')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, flexShrink: 0, background: categoria === cat.slug ? '#0D7C66' : 'rgba(255, 255, 255, 0.8)', color: categoria === cat.slug ? '#fff' : '#8a9690', border: categoria === cat.slug ? '1px solid #0D7C66' : '1px solid rgba(255, 255, 255, 0.6)', cursor: 'pointer', fontSize: 12, fontWeight: categoria === cat.slug ? 600 : 400 }}>
                  {cat.icon} {catLabel(cat.slug)}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: 12, margin: '8px 16px 0', fontSize: 12, color: '#8a9690', fontWeight: 600, flexShrink: 0, textAlign: 'center' }}>
            {loading ? ui.loading : ui.count_verified.replace('{n}', filtered.length.toString())}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(n => {
              const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
              const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
              const isSelected = selected?.id === n.id
              return (
                <button key={n.id} onClick={() => handleSelect(n)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isSelected ? '#0D7C66' : 'rgba(255, 255, 255, 0.4)', borderRadius: 12, border: isSelected ? '1px solid #0D7C66' : '1px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: isSelected ? '0 2px 14px rgba(13,124,102,.3)' : 'none' }}>
                  <div className="img-thumb" style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: isSelected ? 'rgba(255,255,255,0.15)' : `${color}25`, border: isSelected ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n.imagenUrl
                      ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <CatIcon size={20} color={isSelected ? '#fff' : color} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: isSelected ? '#fff' : '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</span>
                      <VerifiedBadge />
                    </div>
                    <div style={{ fontSize: 11, color: isSelected ? '#e0f7f1' : '#8a9690', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.direccion.split(',')[0]}</div>
                    {n.calificacion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StarIcon size={11} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#fff' : '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                        {n.totalReviews && <span style={{ fontSize: 11, color: isSelected ? '#e0f7f1' : '#8a9690' }}>({n.totalReviews})</span>}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Map area ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <MapView ref={mapViewRef} negocios={filtered} onSelect={handleSelect} selected={selected} />

      {/* ── Overlay para cerrar al tocar el mapa ── */}
      {(showDetail || showChat || (!isDesktop && sheetState !== 'peek')) && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 19, cursor: 'default' }}
          onClick={() => {
            if (showDetail) { setShowDetail(false); setShowRoute(false); setSelected(null) }
            else if (showChat) setShowChat(false)
            else if (!isDesktop && sheetState !== 'peek') setSheetState('peek')
          }}
        />
      )}

      {/* ── Top bar (mobile only) ── */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20, display: isDesktop || showRoute ? 'none' : undefined }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0D7C66', letterSpacing: '0.06em', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>
            RUTA AZTECA
          </span>
          <VerifiedBadge />
          <span style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 8, background: 'rgba(26, 46, 38, 0.12)', border: '1px solid rgba(26, 46, 38, 0.12)', fontSize: 10, color: '#8a9690', fontWeight: 500 }}>
            CDMX
          </span>
        </div>

        {/* Search — Google Maps style with avatar inside */}
        <div style={{ position: 'relative' }}>
          <div className="glass-panel-map" style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: '6px 6px 6px 16px',
            borderRadius: search.trim() && filtered.length > 0 ? '20px 20px 0 0' : 28,
            boxShadow: 'var(--glass-shadow)', border: 'none',
          }}>
            <span style={{ color: '#8a9690', display: 'flex', marginRight: 10 }}><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearch('')}
              placeholder="Buscar negocios locales..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1A2E26' }}
            />
            {search.trim() && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9690', display: 'flex', padding: '0 4px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
            <button
              onClick={startVoice}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: listening ? '#0D7C66' : 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: listening ? '#fff' : '#8a9690', flexShrink: 0,
              }}
            >
              <MicIcon />
            </button>
            <div style={{ width: 1, height: 22, background: 'rgba(26, 46, 38, 0.12)', flexShrink: 0, margin: '0 6px' }} />
            <button
              onClick={() => setShowProfile(true)}
              style={{
                width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', padding: 0,
                background: session?.user?.image ? 'transparent' : session ? '#0D7C66' : 'rgba(26, 46, 38, 0.12)',
                border: '1px solid rgba(26, 46, 38, 0.12)', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 2,
              }}
            >
              {session?.user?.image
                ? <img src={session.user.image} alt={session.user.name ?? ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : session?.user?.name
                  ? <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{session.user.name[0].toUpperCase()}</span>
                  : <span style={{ color: '#8a9690', display: 'flex' }}><PersonIcon /></span>
              }
            </button>
          </div>

          {/* ── Search dropdown ── */}
          {search.trim() && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff',
              borderRadius: '0 0 20px 20px',
              boxShadow: '0 8px 20px rgba(0,0,0,.12)',
              overflow: 'hidden',
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 30,
            }}>
              {filtered.slice(0, 7).map((n, i) => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                return (
                  <button
                    key={n.id}
                    onClick={() => { handleSelect(n); setSearch('') }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', background: 'none', border: 'none',
                      borderTop: i > 0 ? '1px solid #f2f1ee' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CatIcon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#8a9690', marginTop: 1 }}>
                        {n.direccion.split(',')[0]}
                      </div>
                    </div>
                    <VerifiedBadge />
                  </button>
                )
              })}
              {filtered.length > 7 && (
                <div style={{ padding: '8px 16px', fontSize: 12, color: '#8a9690', textAlign: 'center', borderTop: '1px solid #f2f1ee' }}>
                  {ui.more_results.replace('{n}', (filtered.length - 7).toString())}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category pills (mobile only) ── */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0,
        zIndex: 15, padding: '0 12px',
        display: isDesktop || showRoute ? 'none' : 'flex', gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {CATS.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setCategoria(cat.slug as CategoriaSlug | '')}
            className={categoria === cat.slug ? 'map-category-pill active' : 'map-category-pill'}
          >
            {cat.icon} {catLabel(cat.slug)}
          </button>
        ))}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {!isDesktop && !showDetail && !showRoute && (
        <div className="glass-panel-map text-[#1A2E26]" style={{
          position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 25,
          height: sheetState === 'peek' ? 80 : sheetState === 'half' ? 340 : '85vh',
          transition: 'height .35s cubic-bezier(.4,0,.2,1)',
          borderRadius: '20px 20px 0 0', borderTop: '1px solid rgba(26, 46, 38, 0.12)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--glass-shadow)',
        }}>
          {/* Drag handle + header */}
          <div
            onClick={() => setSheetState(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')}
            style={{ padding: '10px 16px 8px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#0D7C66', opacity: 0.6, margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2E26' }}>
                {loading ? ui.loading : ui.count_verified.replace('{n}', filtered.length.toString())}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9690" strokeWidth="2" strokeLinecap="round">
                {sheetState === 'full'
                  ? <polyline points="6 9 12 15 18 9" />
                  : <polyline points="18 15 12 9 6 15" />
                }
              </svg>
            </div>
          </div>

          {/* Scrollable list */}
          {sheetState !== 'peek' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(n => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                const isSel   = selected?.id === n.id
                return (
                  <button key={n.id} onClick={() => handleSelect(n)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', background: isSel ? '#0D7C66' : 'rgba(255, 255, 255, 0.4)',
                      borderRadius: 14, border: isSel ? '1px solid #0D7C66' : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: isSel ? '0 4px 12px rgba(13,124,102,.3)' : 'none', flexShrink: 0,
                    }}>
                    <div className="img-thumb" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: isSel ? 'rgba(255,255,255,0.15)' : `${color}25`, border: isSel ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n.imagenUrl
                        ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : <CatIcon size={22} color={isSel ? '#fff' : color} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: isSel ? '#fff' : '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.nombre}</span>
                        <VerifiedBadge />
                      </div>
                      <div style={{ fontSize: 11, color: isSel ? '#e0f7f1' : '#8a9690', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.direccion.split(',')[0]}</div>
                      {n.calificacion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarIcon size={11} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? '#fff' : '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSel ? '#fff' : '#c0bbb4'} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detail sheet ── */}
      {showDetail && selected && (
        <DetailSheet
          negocio={selected}
          session={session}
          isDesktop={isDesktop}
          onBack={handleBack}
          onRoute={() => { setShowDetail(false); setShowRoute(true) }}
          onFullPage={() => router.push(`/turista/negocio/${selected.id}`)}
        />
      )}

      {/* ── Routing overlay ── */}
      {showRoute && selected && (
        <RoutePanel negocio={selected} onClose={handleBack} mapRef={mapViewRef} isDesktop={isDesktop} />
      )}

      {/* ── Chat panel ── */}
      {showChat && <ChatPanel
        onClose={() => setShowChat(false)}
        isDesktop={isDesktop}
        onSelectNegocio={(id) => {
          const neg = negocios.find(n => n.id === id)
          if (neg) handleSelect(neg)
        }}
      />}

      {/* ── Favoritos panel ── */}
      {showFavoritos && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowFavoritos(false)}
        >
          <div
            className="glass-panel-map"
            onClick={e => e.stopPropagation()}
            style={{ 
              position: 'absolute', bottom: isDesktop ? 16 : 0, left: isDesktop ? 412 : 0, right: isDesktop ? 16 : 0,
              borderRadius: isDesktop ? 24 : '20px 20px 0 0', 
              maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,.3)' 
            }}
          >
            {/* Header */}
            <div style={{ padding: '8px 20px 0', background: 'rgba(26, 46, 38, 0.08)', borderBottom: '1px solid rgba(26, 46, 38, 0.12)', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#0D7C66', opacity: 0.6, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0D7C66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookmarkIcon filled />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2E26' }}>{ui.saved}</div>
                  <div style={{ fontSize: 12, color: '#8a9690' }}>{ui.saved_places.replace('{n}', favNegocios.length.toString())}</div>
                </div>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 32px' }}>
              {favNegocios.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1A2E26', marginBottom: 6 }}>{ui.no_saved}</div>
                  <div style={{ fontSize: 13, color: '#8a9690' }}>{ui.no_saved_hint}</div>
                </div>
              )}

              {favNegocios.map(n => {
                const CatIcon = CATEGORIA_LUCIDE[n.categoria] ?? Store
                const color   = CATEGORIA_COLOR[n.categoria] ?? '#1A9E78'
                return (
                  <button
                    key={n.id}
                    onClick={() => { setShowFavoritos(false); handleSelect(n) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(26, 46, 38, 0.12)',
                      borderRadius: 14, marginBottom: 10, cursor: 'pointer', textAlign: 'left',
                      boxShadow: 'none',
                    }}
                  >
                    <div className="img-thumb" style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: `${color}25`, border: `1px solid ${color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {n.imagenUrl
                        ? <img src={n.imagenUrl} alt={n.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : <CatIcon size={22} color={color} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1A2E26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.nombre}
                        </span>
                        <VerifiedBadge />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {n.calificacion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <StarIcon size={11} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A2E26' }}>{n.calificacion.toFixed(1)}</span>
                          </div>
                        )}
                        <span style={{ fontSize: 12, color: '#8a9690' }}>· {n.direccion.split(',')[0]}</span>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Profile panel ── */}
      {showProfile && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowProfile(false)}
        >
          <div
            className="glass-panel-map"
            onClick={e => e.stopPropagation()}
            style={{ 
               position: 'absolute', bottom: isDesktop ? 16 : 0, left: isDesktop ? 412 : 0, right: isDesktop ? 16 : 0,
               borderRadius: isDesktop ? 24 : '20px 20px 0 0', 
               padding: '8px 24px 44px', boxShadow: '0 -4px 32px rgba(0,0,0,.4)' 
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#0D7C66', opacity: 0.6, margin: '0 auto 22px' }} />
            {session ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                    background: '#0D7C66',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14, flexShrink: 0, border: '3px solid rgba(26, 46, 38, 0.12)',
                  }}>
                    {session.user?.image
                      ? <img src={session.user.image} alt={session.user.name ?? ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fff', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                          {(session.user?.name ?? session.user?.email ?? '?')[0].toUpperCase()}
                        </span>
                    }
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26', textAlign: 'center' }}>
                    {session.user?.name ?? ui.tourist_fallback}
                  </div>
                  {session.user?.email && (
                    <div style={{ fontSize: 13, color: '#8a9690', marginTop: 4 }}>{session.user.email}</div>
                  )}
                </div>
                <button
                  onClick={() => { setShowProfile(false); openFavoritos() }}
                  style={{
                    width: '100%', padding: '15px', background: '#0D7C66',
                    border: '1px solid #0D7C66', borderRadius: 14, marginBottom: 10,
                    fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <BookmarkIcon filled /> {ui.my_saved}
                </button>
                <button
                  onClick={() => { setShowProfile(false); signOut({ callbackUrl: '/api/auth/logout' }) }}
                  style={{
                    width: '100%', padding: '15px', background: 'rgba(229,62,62,0.1)',
                    border: '1px solid rgba(229,62,62,0.4)', borderRadius: 14,
                    fontSize: 15, fontWeight: 600, color: '#fc8181', cursor: 'pointer',
                  }}
                >
                  {ui.sign_out}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: '50%', background: 'rgba(26, 46, 38, 0.08)', border: '1px solid rgba(26, 46, 38, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14, color: '#8a9690',
                  }}>
                    <PersonIcon />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1A2E26' }}>{ui.anon_user}</div>
                  <div style={{ fontSize: 13, color: '#8a9690', marginTop: 4, textAlign: 'center' }}>
                    {ui.login_to_personalize}
                  </div>
                </div>
                <button
                  onClick={() => { setShowProfile(false); router.push('/login') }}
                  style={{
                    width: '100%', padding: '15px',
                    background: '#0D7C66', border: '1px solid #0D7C66',
                    borderRadius: 14,
                    fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  }}
                >
                  {ui.sign_in}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom navigation bar (mobile only) ── */}
      {!isDesktop && !showRoute && (
        <div className="glass-panel-map" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          borderTop: '1px solid rgba(26, 46, 38, 0.12)',
          display: 'flex', alignItems: 'stretch',
          zIndex: 35, boxShadow: 'none'
        }}>
          {[
            { key: 'explorar',  label: ui.nav_explore,   Icon: Compass,     action: () => setActiveTab('explorar') },
            { key: 'favoritos', label: ui.nav_favorites, Icon: Heart,       action: () => { setActiveTab('favoritos'); openFavoritos() } },
            { key: 'rutas',     label: ui.nav_routes,    Icon: Navigation2, action: () => setActiveTab('rutas') },
          ].map(({ key, label, Icon, action }) => (
            <button key={key} onClick={action} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: activeTab === key ? '#0D7C66' : 'none', border: 'none', cursor: 'pointer',
              color: activeTab === key ? '#fff' : '#8a9690',
              transition: 'all .2s', margin: '6px 4px', borderRadius: 14,
            }}>
              <Icon size={22} />
              <span style={{ fontSize: 10, fontWeight: activeTab === key ? 700 : 400 }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── FAB chat ── */}
      {!showChat && !showDetail && !showRoute && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'absolute',
            bottom: isDesktop ? 44 : 160,
            right: 16,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(13,124,102,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 20, transition: 'bottom .3s',
          }}
        >
          <ChatFabIcon />
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#C5A044', border: '2px solid var(--color-obs-900)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>IA</span>
          </div>
        </button>
      )}
      </div>
    </div>
  )
}
