'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Navigation, Globe,
  Utensils, Palette, BedDouble, Map as MapIcon, Bus, Store, Bot,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { Negocio, Horario, MenuItem } from '@/types/negocio'

// ─── Static UI translations ───────────────────────────────────────────────────
const UI: Record<string, Record<string, string>> = {
  es: { back: 'Volver al mapa', verified: 'Verificado Ola México', location: 'Ubicación', directions: 'Cómo llegar', contact: 'Contacto', whatsapp: 'Escribir por WhatsApp', ai: 'Preguntarle al asistente IA', schedule: 'Horario', open: 'Abierto', closed: 'Cerrado', closes: 'Cierra', opens: 'Abre', menu: 'Menú', unavailable: 'No disponible' },
  en: { back: 'Back to map',       verified: 'Verified Ola México',   location: 'Location',    directions: 'Get directions',  contact: 'Contact', whatsapp: 'Write on WhatsApp',       ai: 'Ask the AI assistant',        schedule: 'Hours',   open: 'Open',    closed: 'Closed', closes: 'Closes', opens: 'Opens', menu: 'Menu',  unavailable: 'Unavailable' },
  fr: { back: 'Retour à la carte', verified: 'Vérifié Ola México',    location: 'Localisation', directions: 'Itinéraire',     contact: 'Contact', whatsapp: 'Écrire sur WhatsApp',     ai: "Demander à l'assistant IA",   schedule: 'Horaires',open: 'Ouvert',  closed: 'Fermé',  closes: 'Ferme', opens: 'Ouvre', menu: 'Menu',  unavailable: 'Indisponible' },
  pt: { back: 'Voltar ao mapa',    verified: 'Verificado Ola México', location: 'Localização', directions: 'Como chegar',     contact: 'Contato', whatsapp: 'Escrever no WhatsApp',    ai: 'Perguntar ao assistente IA',  schedule: 'Horário', open: 'Aberto',  closed: 'Fechado',closes: 'Fecha', opens: 'Abre',  menu: 'Cardápio', unavailable: 'Indisponível' },
  de: { back: 'Zurück zur Karte',  verified: 'Verifiziert Ola México',location: 'Standort',    directions: 'Route',           contact: 'Kontakt', whatsapp: 'Per WhatsApp schreiben', ai: 'Den KI-Assistenten fragen',   schedule: 'Öffnungszeiten', open: 'Geöffnet', closed: 'Geschlossen', closes: 'Schließt', opens: 'Öffnet', menu: 'Menü', unavailable: 'Nicht verfügbar' },
}

// ─── Horario helpers ──────────────────────────────────────────────────────────
const DAY_KEYS: (keyof Horario)[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const DAY_LABELS: Record<string, Record<keyof Horario, string>> = {
  es: { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' },
  en: { lun: 'Mon', mar: 'Tue', mie: 'Wed', jue: 'Thu', vie: 'Fri', sab: 'Sat', dom: 'Sun' },
  fr: { lun: 'Lun', mar: 'Mar', mie: 'Mer', jue: 'Jeu', vie: 'Ven', sab: 'Sam', dom: 'Dim' },
  pt: { lun: 'Seg', mar: 'Ter', mie: 'Qua', jue: 'Qui', vie: 'Sex', sab: 'Sáb', dom: 'Dom' },
  de: { lun: 'Mo',  mar: 'Di',  mie: 'Mi',  jue: 'Do',  vie: 'Fr',  sab: 'Sa',  dom: 'So'  },
}

function getTodayKey(): keyof Horario {
  return DAY_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

function isOpenNow(horario: Horario): boolean {
  const key = getTodayKey()
  const dia = horario[key]
  if (!dia.abierto) return false
  const now = new Date()
  const [ah, am] = dia.apertura.split(':').map(Number)
  const [ch, cm] = dia.cierre.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= ah * 60 + am && mins < ch * 60 + cm
}

// ─── Menu label by category ───────────────────────────────────────────────────
const MENU_LABEL: Record<string, string> = {
  comida: 'Menú', artesanias: 'Catálogo', hospedaje: 'Habitaciones y servicios',
  tours: 'Paquetes disponibles', transporte: 'Servicios', otro: 'Servicios',
}

const CATEGORIA_LABEL: Record<string, string> = {
  comida: 'Comida', artesanias: 'Artesanías', hospedaje: 'Hospedaje',
  tours: 'Tours', transporte: 'Transporte', otro: 'Otro',
}

const CATEGORIA_LUCIDE: Record<string, React.FC<{ size?: number; color?: string }>> = {
  comida: Utensils, artesanias: Palette, hospedaje: BedDouble,
  tours: MapIcon, transporte: Bus, otro: Store,
}

interface Props { negocio: Negocio }

export function NegocioDetalle({ negocio }: Props) {
  const { t, idioma } = useTranslation()
  const ui = UI[idioma] ?? UI.en

  const [descripcionT, setDescripcionT] = useState(negocio.descripcion)
  const [tagsT,        setTagsT]        = useState(negocio.tags ?? [])
  const [catLabelT,    setCatLabelT]    = useState(CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria)
  const [traduciendo,  setTraduciendo]  = useState(false)
  const [menuAbierto,  setMenuAbierto]  = useState(false)

  useEffect(() => {
    if (idioma === 'es') return
    setTraduciendo(true)
    Promise.all([
      t(negocio.descripcion),
      t(CATEGORIA_LABEL[negocio.categoria] ?? negocio.categoria),
      Promise.all((negocio.tags ?? []).map(tag => t(tag))),
    ]).then(([desc, cat, tags]) => {
      setDescripcionT(desc as string)
      setCatLabelT(cat as string)
      setTagsT(tags as string[])
    }).finally(() => setTraduciendo(false))
  }, [idioma])

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${negocio.lat},${negocio.lng}`
  const whatsappUrl   = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`
    : null
  const CatIcon = CATEGORIA_LUCIDE[negocio.categoria] ?? Store

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f3fbfa 0%, #dff2ec 100%)',
      color: '#1A2E26',
      paddingBottom: 40,
      fontFamily: 'var(--font-inter), sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/turista/mapa" style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0D7C66', textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(13,124,102,.1)',
          backdropFilter: 'blur(12px)',
        }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0D7C66', letterSpacing: '0.05em' }}>RUTA AZTECA</div>
        {idioma !== 'es' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, background: 'rgba(13,124,102,0.1)', border: '1px solid rgba(13,124,102,0.2)', marginLeft: 4 }}>
            <Globe size={11} color='#0D7C66' />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase' }}>{idioma}</span>
          </span>
        )}
      </header>

      <main style={{ maxWidth: 500, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero image */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          {negocio.imagenUrl ? (
            <img
              src={negocio.imagenUrl}
              alt={negocio.nombre}
              style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 24, boxShadow: '0 12px 32px rgba(13,124,102,.15)' }}
            />
          ) : (
            <div style={{
              width: '100%', height: 240,
              background: 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)',
              borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(13,124,102,.2)',
            }}>
              <CatIcon size={64} color="#fff" />
            </div>
          )}
          {negocio.calificacion && (
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              padding: '6px 12px', borderRadius: 16,
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#C5A044" stroke="#C5A044" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{ fontWeight: 700 }}>{negocio.calificacion.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info card */}
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(13,124,102,.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', background: 'rgba(13,124,102,0.1)', borderRadius: 12,
              fontSize: 11, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
              opacity: traduciendo ? 0.5 : 1, transition: 'opacity .3s',
            }}>
              <CatIcon size={12} /> {catLabelT}
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A2E26', lineHeight: 1.2 }}>{negocio.nombre}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#1A9E78" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, color: '#1A9E78', fontWeight: 600 }}>{ui.verified}</span>
            </div>
          </div>

          <p style={{ color: '#4d5d55', fontSize: 14, lineHeight: 1.6, opacity: traduciendo ? 0.5 : 1, transition: 'opacity .3s' }}>
            {descripcionT}
          </p>

          {tagsT.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {tagsT.map(tag => (
                <span key={tag} style={{
                  padding: '4px 10px', background: 'rgba(13,124,102,0.08)',
                  border: '1px solid rgba(13,124,102,0.1)', color: '#0D7C66',
                  fontSize: 11, fontWeight: 600, borderRadius: 12,
                  opacity: traduciendo ? 0.5 : 1, transition: 'opacity .3s',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Horario card */}
        {negocio.horario && (() => {
          const labels = DAY_LABELS[idioma] ?? DAY_LABELS.es
          const todayKey = getTodayKey()
          const abierto = isOpenNow(negocio.horario)
          const todayDia = negocio.horario[todayKey]
          return (
            <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(13,124,102,.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1A2E26' }}>
                  <Clock size={18} color="#0D7C66" /> {ui.schedule}
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  background: abierto ? 'rgba(13,124,102,0.12)' : 'rgba(200,50,50,0.1)',
                  color: abierto ? '#0D7C66' : '#c83232',
                }}>
                  {abierto ? ui.open : ui.closed}
                  {todayDia.abierto && abierto && ` · ${ui.closes} ${todayDia.cierre}`}
                  {todayDia.abierto && !abierto && ` · ${ui.opens} ${todayDia.apertura}`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DAY_KEYS.map(key => {
                  const dia = negocio.horario![key]
                  const isToday = key === todayKey
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 10,
                      background: isToday ? 'rgba(13,124,102,0.08)' : 'transparent',
                      fontWeight: isToday ? 700 : 400,
                    }}>
                      <span style={{ fontSize: 13, color: isToday ? '#0D7C66' : '#4d5d55', minWidth: 32 }}>
                        {labels[key]}
                      </span>
                      <span style={{ fontSize: 13, color: dia.abierto ? '#1A2E26' : '#aaa' }}>
                        {dia.abierto ? `${dia.apertura} – ${dia.cierre}` : ui.closed}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Menú / Catálogo card */}
        {negocio.menu && negocio.menu.length > 0 && (() => {
          const categorias = [...new Set(negocio.menu!.map(i => i.categoria))]
          const titulo = MENU_LABEL[negocio.categoria] ?? ui.menu
          return (
            <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(13,124,102,.08)', overflow: 'hidden' }}>
              {/* Header colapsable */}
              <button
                onClick={() => setMenuAbierto(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 20, background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1A2E26', fontSize: 15 }}>
                  <Utensils size={18} color="#0D7C66" /> {titulo}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#888', marginLeft: 4 }}>
                    ({negocio.menu!.filter(i => i.disponible !== false).length} disponibles)
                  </span>
                </div>
                {menuAbierto ? <ChevronUp size={18} color="#0D7C66" /> : <ChevronDown size={18} color="#0D7C66" />}
              </button>

              {/* Items */}
              {menuAbierto && (
                <div style={{ padding: '0 16px 16px' }}>
                  {categorias.map(cat => {
                    const items = negocio.menu!.filter(i => i.categoria === cat)
                    return (
                      <div key={cat} style={{ marginBottom: 16 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: '#0D7C66', textTransform: 'uppercase',
                          letterSpacing: '0.06em', marginBottom: 8, paddingBottom: 4,
                          borderBottom: '1px solid rgba(13,124,102,0.15)',
                        }}>
                          {cat}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {items.map(item => (
                            <div key={item.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                              opacity: item.disponible === false ? 0.45 : 1,
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1A2E26' }}>{item.nombre}</span>
                                  {item.disponible === false && (
                                    <span style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>{ui.unavailable}</span>
                                  )}
                                </div>
                                <p style={{ fontSize: 12, color: '#6d7d75', margin: '2px 0 0', lineHeight: 1.4 }}>{item.descripcion}</p>
                              </div>
                              {item.precio > 0 && (
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0D7C66', whiteSpace: 'nowrap' }}>
                                  ${item.precio}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Location card */}
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(13,124,102,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700, color: '#1A2E26' }}>
            <MapPin size={18} color="#0D7C66" /> {ui.location}
          </div>
          <p style={{ fontSize: 14, color: '#4d5d55', marginBottom: 16 }}>{negocio.direccion}</p>
          <a
            href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px', background: '#0D7C66',
              borderRadius: 16, color: '#fff', fontWeight: 600, fontSize: 15,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(13,124,102,.3)',
            }}
          >
            <Navigation size={18} /> {ui.directions}
          </a>
        </div>

        {/* Contact card */}
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(13,124,102,.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1A2E26' }}>
            <Phone size={18} color="#0D7C66" /> {ui.contact}
          </div>

          <a href={`tel:${negocio.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.5)', textDecoration: 'none', color: '#1A2E26', border: '1px solid rgba(255,255,255,0.4)' }}>
            <div style={{ width: 36, height: 36, background: '#e1f5ee', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} color="#0D7C66" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{negocio.telefono}</span>
          </a>

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.5)', textDecoration: 'none', color: '#1A2E26', border: '1px solid rgba(255,255,255,0.4)' }}>
              <div style={{ width: 36, height: 36, background: '#25D366', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{ui.whatsapp}</span>
            </a>
          )}
        </div>

        {/* AI button */}
        <Link
          href="/turista/chat"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
            borderRadius: 20, color: '#fff', fontWeight: 600, fontSize: 16,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(13,124,102,.35)',
            marginTop: 8,
          }}
        >
          <Bot size={22} /> {ui.ai}
        </Link>
      </main>
    </div>
  )
}
