'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, X, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react'

import { MenuItem, Pedido } from '@/types/negocio'
import { NegocioStore } from '@/lib/negocioStore'

interface PagoModalProps {
  negocio: { id: string; nombre: string; categoria?: string }
  onClose: () => void
  items?: (MenuItem & { cantidad: number })[]
  total?: number
}

type Step = 'monto' | 'metodo' | 'procesando' | 'exito' | 'error'

const METODOS = [
  {
    id: 'coppel',
    label: 'Coppel Pay',
    desc: 'Paga con tu cuenta Coppel',
    icon: (
      <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#FF6B00"/>
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
          fontSize="20" fontWeight="900" fill="#fff">C</text>
      </svg>
    ),
    color: '#FF6B00',
  },
  {
    id: 'card',
    label: 'Tarjeta de crédito / débito',
    desc: 'Visa, Mastercard, Amex',
    icon: <CreditCard size={22} color="#3B82F6" />,
    color: '#3B82F6',
  },
]

function generateFolio() {
  return 'RA-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function PagoModal({ negocio, onClose, items, total }: PagoModalProps) {
  const [step, setStep]       = useState<Step>(items ? 'metodo' : 'monto')
  const [monto, setMonto]     = useState(total ? total.toString() : '')
  const [desc, setDesc]       = useState('')
  const [metodo, setMetodo]   = useState<string | null>(null)
  const [folio, setFolio]     = useState('')
  const [montoError, setMontoError] = useState('')

  // Bloquear scroll al abrir
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const validateMonto = () => {
    const n = parseFloat(monto.replace(',', '.'))
    if (!monto || isNaN(n) || n <= 0) {
      setMontoError('Ingresa un monto válido')
      return false
    }
    if (n > 50000) {
      setMontoError('El monto máximo es $50,000')
      return false
    }
    setMontoError('')
    return true
  }

  const handleConfirmMonto = () => {
    if (!validateMonto()) return
    setStep('metodo')
  }

  const handlePagar = () => {
    if (!metodo) return
    setStep('procesando')
    const f = generateFolio()
    setTimeout(() => {
      setFolio(f)
      setStep('exito')
      
      // Registrar pedido en el store local
      const nuevoPedido: Pedido = {
        id: Date.now().toString(),
        negocioId: negocio.id,
        items: items ? items.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })) : [],
        total: parseFloat(monto),
        estado: 'completado',
        fecha: new Date().toISOString(),
        folio: f
      }
      NegocioStore.addPedido(nuevoPedido)
    }, 2200)
  }

  const montoFormatted = parseFloat(monto || '0').toLocaleString('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  })

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9991,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          fontFamily: 'var(--font-inter), -apple-system, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ padding: '12px 20px 0', textAlign: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#0D7C66', opacity: 0.5, margin: '0 auto 16px' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#0D7C66', marginBottom: 2 }}>
              Pago seguro
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#1A2E26' }}>
              {negocio.nombre}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(26,46,38,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#1A2E26" />
          </button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── PASO 1: MONTO ── */}
          {step === 'monto' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#5a6e67', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  ¿Cuánto vas a pagar?
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 22, fontWeight: 700, color: '#1A2E26' }}>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={monto}
                    onChange={e => { setMonto(e.target.value); setMontoError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmMonto()}
                    style={{
                      width: '100%',
                      padding: '18px 16px 18px 38px',
                      fontSize: 28,
                      fontWeight: 900,
                      color: '#1A2E26',
                      border: `2px solid ${montoError ? '#DC2626' : 'rgba(13,124,102,0.25)'}`,
                      borderRadius: 16,
                      outline: 'none',
                      background: 'rgba(13,124,102,0.03)',
                      letterSpacing: '-0.02em',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {montoError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
                    <AlertCircle size={13} /> {montoError}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#5a6e67', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 2 tacos, 1 agua..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    fontSize: 16,
                    color: '#1A2E26',
                    border: '1.5px solid rgba(13,124,102,0.2)',
                    borderRadius: 14,
                    outline: 'none',
                    background: '#fafaf8',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Powered by Coppel chip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, padding: '10px', background: 'rgba(255,107,0,0.06)', borderRadius: 12, border: '1px solid rgba(255,107,0,0.15)' }}>
                <span style={{ fontSize: 11, color: '#FF6B00', fontWeight: 700 }}>Intermediario de pago</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#FF6B00' }}>COPPEL PAY</span>
              </div>

              <button
                onClick={handleConfirmMonto}
                style={{
                  width: '100%', padding: '16px', borderRadius: 18, border: 'none',
                  background: monto && parseFloat(monto) > 0
                    ? 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)'
                    : 'rgba(26,46,38,0.1)',
                  color: monto && parseFloat(monto) > 0 ? '#fff' : '#8a9690',
                  fontSize: 17, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: monto && parseFloat(monto) > 0 ? '0 6px 20px rgba(13,124,102,0.3)' : 'none',
                }}
              >
                Continuar <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* ── PASO 2: MÉTODO ── */}
          {step === 'metodo' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#1A2E26', letterSpacing: '-0.03em' }}>{montoFormatted}</div>
                  {items && (
                    <div style={{ marginTop: 12, textAlign: 'left', background: 'rgba(13,124,102,0.05)', borderRadius: 12, padding: '12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0D7C66', textTransform: 'uppercase', marginBottom: 8 }}>Detalle del pedido</div>
                      {items.map(it => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: '#1A2E26' }}>{it.cantidad}x {it.nombre}</span>
                          <span style={{ fontWeight: 600 }}>${(it.precio * it.cantidad).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {desc && <div style={{ fontSize: 13, color: '#5a6e67', marginTop: 4 }}>{desc}</div>}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#5a6e67', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                  Elige tu forma de pago
                </div>

                {METODOS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMetodo(m.id)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      borderRadius: 16,
                      border: `2px solid ${metodo === m.id ? m.color : 'rgba(26,46,38,0.1)'}`,
                      background: metodo === m.id ? `${m.color}10` : '#fafaf8',
                      cursor: 'pointer',
                      marginBottom: 10,
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${m.color}15`, flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2E26' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#5a6e67' }}>{m.desc}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${metodo === m.id ? m.color : 'rgba(26,46,38,0.2)'}`, background: metodo === m.id ? m.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {metodo === m.id && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep('monto')}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(26,46,38,0.2)', background: '#fff', color: '#1A2E26', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Atrás
                </button>
                <button
                  onClick={handlePagar}
                  disabled={!metodo}
                  style={{
                    flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                    background: metodo ? 'linear-gradient(135deg, #0D7C66 0%, #1A9E78 100%)' : 'rgba(26,46,38,0.1)',
                    color: metodo ? '#fff' : '#8a9690',
                    fontSize: 15, fontWeight: 900, cursor: metodo ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: metodo ? '0 6px 20px rgba(13,124,102,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <CreditCard size={18} /> Pagar {montoFormatted}
                </button>
              </div>
            </>
          )}

          {/* ── PASO 3: PROCESANDO ── */}
          {step === 'procesando' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(13,124,102,0.3)' }}>
                <Loader2 size={36} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1A2E26', marginBottom: 8 }}>Procesando pago</div>
              <div style={{ fontSize: 14, color: '#5a6e67', lineHeight: 1.6 }}>
                Conectando con Coppel Pay…<br />No cierres esta ventana.
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── PASO 4: ÉXITO ── */}
          {step === 'exito' && (
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D7C66, #1A9E78)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 12px 32px rgba(13,124,102,0.35)',
                animation: 'popin 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}>
                <Check size={40} color="#fff" strokeWidth={3} />
              </div>

              <div style={{ fontSize: 22, fontWeight: 900, color: '#1A2E26', marginBottom: 6 }}>¡Pago exitoso!</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0D7C66', marginBottom: 8, letterSpacing: '-0.02em' }}>{montoFormatted}</div>
              {desc && <div style={{ fontSize: 14, color: '#5a6e67', marginBottom: 20 }}>{desc}</div>}

              <div style={{ background: 'rgba(13,124,102,0.06)', borderRadius: 14, padding: '14px 20px', border: '1px solid rgba(13,124,102,0.15)', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#0D7C66', marginBottom: 4 }}>Folio de transacción</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2E26', letterSpacing: '0.1em' }}>{folio}</div>
                <div style={{ fontSize: 11, color: '#5a6e67', marginTop: 4 }}>{new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: '#5a6e67' }}>
                <Check size={13} color="#0D7C66" strokeWidth={3} /> Procesado por <strong style={{ color: '#FF6B00' }}>Coppel Pay</strong>
              </div>

              <button
                onClick={onClose}
                style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #0D7C66, #1A9E78)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 20px rgba(13,124,102,0.3)' }}
              >
                Listo
              </button>

              <style>{`@keyframes popin { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
