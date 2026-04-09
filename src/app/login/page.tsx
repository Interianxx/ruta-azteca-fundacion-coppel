'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const patterns = [
  { x: 10, y: 15, r: 0 }, { x: 85, y: 8, r: 45 }, { x: 5, y: 55, r: 90 },
  { x: 90, y: 50, r: 135 }, { x: 15, y: 85, r: 180 }, { x: 80, y: 88, r: 225 },
  { x: 50, y: 5, r: 60 }, { x: 50, y: 92, r: 300 },
]

// ─── i18n ─────────────────────────────────────────────────────────────────────

type LangCode = 'es' | 'en' | 'fr' | 'pt' | 'de'

type LangUI = {
  subtitle_brand: string; subtitle_footer: string; verified_footer: string
  tourist_btn: string; tourist_sub: string; business_btn: string; business_sub: string
  title_select: string; title_tourist: string; title_t_login: string; title_t_signup: string
  title_t_verify: string; title_t_forgot: string; title_t_reset: string; title_business: string
  title_b_signup: string
  sub_select: string; sub_tourist: string; sub_t_login: string; sub_t_signup: string
  sub_t_verify: string; sub_t_forgot: string; sub_t_reset: string; sub_business: string
  sub_b_signup: string
  email_fallback: string
  google: string; redirecting: string; email_btn: string; explore: string; back: string
  or_no_acct: string; or_email: string
  login_btn: string; logging_in: string; signup_btn: string; creating_acct: string
  verify_btn: string; verifying_act: string; send_btn: string; sending_act: string
  change_pass_btn: string; updating_act: string
  forgot: string; no_account: string; have_account: string; register: string; verify_resend: string
  email_ph: string; pass_ph: string; name_opt_ph: string; pass_min_ph: string; new_pass_ph: string
  ok_verified: string; ok_resent: string; ok_pass_changed: string
  err_credentials: string; err_network: string
}

function getUILang(): LangCode {
  if (typeof navigator === 'undefined') return 'es'
  const l = navigator.language.slice(0, 2).toLowerCase()
  return (['es', 'en', 'fr', 'pt', 'de'] as LangCode[]).includes(l as LangCode) ? l as LangCode : 'en'
}

const UI_LANGS: Record<LangCode, LangUI> = {
  es: {
    subtitle_brand: 'Conecta con los negocios locales que dan vida a nuestras ciudades',
    subtitle_footer: 'FIFA World Cup 2026 — Experiencias locales verificadas',
    verified_footer: 'Verificado por Ola México — Impact Hub',
    tourist_btn: 'Soy turista', tourist_sub: 'Explorar negocios locales al instante',
    business_btn: 'Tengo un negocio', business_sub: 'Registrar o gestionar mi perfil',
    title_select: 'Bienvenido', title_tourist: 'Soy turista', title_t_login: 'Iniciar sesión',
    title_t_signup: 'Crear cuenta', title_t_verify: 'Verifica tu correo',
    title_t_forgot: 'Recuperar contraseña', title_t_reset: 'Nueva contraseña', title_business: 'Acceso negocio',
    title_b_signup: 'Registro de negocio',
    sub_select: 'Elige cómo quieres comenzar tu experiencia',
    sub_tourist: 'Explora negocios locales al instante',
    sub_t_login: 'Ingresa con tu correo y contraseña',
    sub_t_signup: 'Únete a la comunidad Ruta Azteca',
    sub_b_signup: 'Crea tu cuenta para registrar tu negocio',
    sub_t_verify: 'Enviamos un código a {email}',
    sub_t_forgot: 'Te enviaremos un código de recuperación',
    sub_t_reset: 'Revisa {email} y escribe el código',
    sub_business: 'Inicia sesión para gestionar tu negocio o panel',
    email_fallback: 'tu correo',
    google: 'Continuar con Google', redirecting: 'Redirigiendo...',
    email_btn: 'Continuar con correo', explore: 'Explorar el mapa ahora', back: '← Volver',
    or_no_acct: 'o sin cuenta', or_email: 'o con correo',
    login_btn: 'Iniciar sesión', logging_in: 'Ingresando...',
    signup_btn: 'Crear cuenta', creating_acct: 'Creando cuenta...',
    verify_btn: 'Verificar cuenta', verifying_act: 'Verificando...',
    send_btn: 'Enviar código', sending_act: 'Enviando...',
    change_pass_btn: 'Cambiar contraseña', updating_act: 'Actualizando...',
    forgot: '¿Olvidaste tu contraseña?', no_account: '¿No tienes cuenta?',
    have_account: '¿Ya tienes cuenta?', register: 'Regístrate',
    verify_resend: '¿No recibiste el código? Reenviar',
    email_ph: 'correo@ejemplo.com', pass_ph: 'Contraseña',
    name_opt_ph: 'Nombre (opcional)', pass_min_ph: 'Contraseña (mín. 8 caracteres)', new_pass_ph: 'Nueva contraseña',
    ok_verified: '¡Cuenta verificada! Ya puedes iniciar sesión.',
    ok_resent: 'Código reenviado a tu correo.',
    ok_pass_changed: '¡Contraseña actualizada! Ya puedes iniciar sesión.',
    err_credentials: 'Correo o contraseña incorrectos. Si acabas de registrarte, verifica tu correo primero.',
    err_network: 'Error de red. Intenta de nuevo.',
  },
  en: {
    subtitle_brand: 'Connect with local businesses that bring our cities to life',
    subtitle_footer: 'FIFA World Cup 2026 — Verified local experiences',
    verified_footer: 'Verified by Ola México — Impact Hub',
    tourist_btn: "I'm a tourist", tourist_sub: 'Explore local businesses instantly',
    business_btn: 'I have a business', business_sub: 'Register or manage my profile',
    title_select: 'Welcome', title_tourist: "I'm a tourist", title_t_login: 'Sign in',
    title_t_signup: 'Create account', title_t_verify: 'Verify your email',
    title_t_forgot: 'Recover password', title_t_reset: 'New password', title_business: 'Business access',
    title_b_signup: 'Business registration',
    sub_select: 'Choose how you want to start your experience',
    sub_tourist: 'Explore local businesses instantly',
    sub_t_login: 'Enter your email and password',
    sub_t_signup: 'Join the Ruta Azteca community',
    sub_b_signup: 'Create your account to register your business',
    sub_t_verify: 'We sent a code to {email}',
    sub_t_forgot: "We'll send you a recovery code",
    sub_t_reset: 'Check {email} and enter the code',
    sub_business: 'Sign in to manage your business or panel',
    email_fallback: 'your email',
    google: 'Continue with Google', redirecting: 'Redirecting...',
    email_btn: 'Continue with email', explore: 'Explore the map now', back: '← Back',
    or_no_acct: 'or without account', or_email: 'or with email',
    login_btn: 'Sign in', logging_in: 'Signing in...',
    signup_btn: 'Create account', creating_acct: 'Creating account...',
    verify_btn: 'Verify account', verifying_act: 'Verifying...',
    send_btn: 'Send code', sending_act: 'Sending...',
    change_pass_btn: 'Change password', updating_act: 'Updating...',
    forgot: 'Forgot your password?', no_account: "Don't have an account?",
    have_account: 'Already have an account?', register: 'Sign up',
    verify_resend: "Didn't receive the code? Resend",
    email_ph: 'email@example.com', pass_ph: 'Password',
    name_opt_ph: 'Name (optional)', pass_min_ph: 'Password (min. 8 characters)', new_pass_ph: 'New password',
    ok_verified: 'Account verified! You can now sign in.',
    ok_resent: 'Code resent to your email.',
    ok_pass_changed: 'Password updated! You can now sign in.',
    err_credentials: 'Wrong email or password. If you just registered, verify your email first.',
    err_network: 'Network error. Please try again.',
  },
  fr: {
    subtitle_brand: 'Connectez-vous avec les commerces locaux qui donnent vie à nos villes',
    subtitle_footer: 'FIFA Coupe du Monde 2026 — Expériences locales vérifiées',
    verified_footer: 'Vérifié par Ola México — Impact Hub',
    tourist_btn: 'Je suis touriste', tourist_sub: 'Explorer les commerces locaux instantanément',
    business_btn: "J'ai un commerce", business_sub: 'Enregistrer ou gérer mon profil',
    title_select: 'Bienvenue', title_tourist: 'Je suis touriste', title_t_login: 'Se connecter',
    title_t_signup: 'Créer un compte', title_t_verify: 'Vérifiez votre email',
    title_t_forgot: 'Récupérer le mot de passe', title_t_reset: 'Nouveau mot de passe', title_business: 'Accès commerce',
    title_b_signup: 'Inscription commerce',
    sub_select: 'Choisissez comment commencer votre expérience',
    sub_tourist: 'Explorez les commerces locaux instantanément',
    sub_t_login: 'Entrez votre email et mot de passe',
    sub_t_signup: 'Rejoignez la communauté Ruta Azteca',
    sub_b_signup: 'Créez votre compte pour enregistrer votre commerce',
    sub_t_verify: 'Nous avons envoyé un code à {email}',
    sub_t_forgot: 'Nous vous enverrons un code de récupération',
    sub_t_reset: 'Vérifiez {email} et entrez le code',
    sub_business: 'Connectez-vous pour gérer votre commerce ou panneau',
    email_fallback: 'votre email',
    google: 'Continuer avec Google', redirecting: 'Redirection...',
    email_btn: 'Continuer avec email', explore: 'Explorer la carte maintenant', back: '← Retour',
    or_no_acct: 'ou sans compte', or_email: 'ou avec email',
    login_btn: 'Se connecter', logging_in: 'Connexion...',
    signup_btn: 'Créer un compte', creating_acct: 'Création du compte...',
    verify_btn: 'Vérifier le compte', verifying_act: 'Vérification...',
    send_btn: 'Envoyer le code', sending_act: 'Envoi...',
    change_pass_btn: 'Changer le mot de passe', updating_act: 'Mise à jour...',
    forgot: 'Mot de passe oublié?', no_account: 'Pas de compte?',
    have_account: 'Déjà un compte?', register: "S'inscrire",
    verify_resend: 'Code non reçu? Renvoyer',
    email_ph: 'email@exemple.com', pass_ph: 'Mot de passe',
    name_opt_ph: 'Nom (optionnel)', pass_min_ph: 'Mot de passe (min. 8 caractères)', new_pass_ph: 'Nouveau mot de passe',
    ok_verified: 'Compte vérifié! Vous pouvez maintenant vous connecter.',
    ok_resent: 'Code renvoyé à votre email.',
    ok_pass_changed: 'Mot de passe mis à jour! Vous pouvez maintenant vous connecter.',
    err_credentials: "Email ou mot de passe incorrect. Si vous venez de vous inscrire, vérifiez d'abord votre email.",
    err_network: 'Erreur réseau. Veuillez réessayer.',
  },
  pt: {
    subtitle_brand: 'Conecte-se com os negócios locais que dão vida às nossas cidades',
    subtitle_footer: 'FIFA Copa do Mundo 2026 — Experiências locais verificadas',
    verified_footer: 'Verificado por Ola México — Impact Hub',
    tourist_btn: 'Sou turista', tourist_sub: 'Explorar negócios locais instantaneamente',
    business_btn: 'Tenho um negócio', business_sub: 'Registrar ou gerenciar meu perfil',
    title_select: 'Bem-vindo', title_tourist: 'Sou turista', title_t_login: 'Entrar',
    title_t_signup: 'Criar conta', title_t_verify: 'Verifique seu email',
    title_t_forgot: 'Recuperar senha', title_t_reset: 'Nova senha', title_business: 'Acesso negócio',
    title_b_signup: 'Cadastro de negócio',
    sub_select: 'Escolha como quer começar sua experiência',
    sub_tourist: 'Explore negócios locais instantaneamente',
    sub_t_login: 'Entre com seu email e senha',
    sub_t_signup: 'Junte-se à comunidade Ruta Azteca',
    sub_b_signup: 'Crie sua conta para cadastrar seu negócio',
    sub_t_verify: 'Enviamos um código para {email}',
    sub_t_forgot: 'Enviaremos um código de recuperação',
    sub_t_reset: 'Verifique {email} e insira o código',
    sub_business: 'Entre para gerenciar seu negócio ou painel',
    email_fallback: 'seu email',
    google: 'Continuar com Google', redirecting: 'Redirecionando...',
    email_btn: 'Continuar com email', explore: 'Explorar o mapa agora', back: '← Voltar',
    or_no_acct: 'ou sem conta', or_email: 'ou com email',
    login_btn: 'Entrar', logging_in: 'Entrando...',
    signup_btn: 'Criar conta', creating_acct: 'Criando conta...',
    verify_btn: 'Verificar conta', verifying_act: 'Verificando...',
    send_btn: 'Enviar código', sending_act: 'Enviando...',
    change_pass_btn: 'Alterar senha', updating_act: 'Atualizando...',
    forgot: 'Esqueceu sua senha?', no_account: 'Não tem conta?',
    have_account: 'Já tem conta?', register: 'Cadastre-se',
    verify_resend: 'Não recebeu o código? Reenviar',
    email_ph: 'email@exemplo.com', pass_ph: 'Senha',
    name_opt_ph: 'Nome (opcional)', pass_min_ph: 'Senha (mín. 8 caracteres)', new_pass_ph: 'Nova senha',
    ok_verified: 'Conta verificada! Já pode entrar.',
    ok_resent: 'Código reenviado para seu email.',
    ok_pass_changed: 'Senha atualizada! Já pode entrar.',
    err_credentials: 'Email ou senha incorretos. Se acabou de se registrar, verifique seu email primeiro.',
    err_network: 'Erro de rede. Tente novamente.',
  },
  de: {
    subtitle_brand: 'Verbinde dich mit lokalen Unternehmen, die unsere Städte zum Leben erwecken',
    subtitle_footer: 'FIFA Weltmeisterschaft 2026 — Verifizierte lokale Erlebnisse',
    verified_footer: 'Verifiziert von Ola México — Impact Hub',
    tourist_btn: 'Ich bin Tourist', tourist_sub: 'Lokale Unternehmen sofort erkunden',
    business_btn: 'Ich habe ein Unternehmen', business_sub: 'Mein Profil registrieren oder verwalten',
    title_select: 'Willkommen', title_tourist: 'Ich bin Tourist', title_t_login: 'Anmelden',
    title_t_signup: 'Konto erstellen', title_t_verify: 'E-Mail bestätigen',
    title_t_forgot: 'Passwort wiederherstellen', title_t_reset: 'Neues Passwort', title_business: 'Unternehmens-Zugang',
    title_b_signup: 'Unternehmensregistrierung',
    sub_select: 'Wählen Sie, wie Sie Ihr Erlebnis beginnen möchten',
    sub_tourist: 'Erkunden Sie lokale Unternehmen sofort',
    sub_b_signup: 'Erstellen Sie Ihr Konto, um Ihr Unternehmen zu registrieren',
    sub_t_login: 'Geben Sie Ihre E-Mail und Ihr Passwort ein',
    sub_t_signup: 'Treten Sie der Ruta Azteca Community bei',
    sub_t_verify: 'Wir haben einen Code an {email} gesendet',
    sub_t_forgot: 'Wir senden Ihnen einen Wiederherstellungscode',
    sub_t_reset: 'Überprüfen Sie {email} und geben Sie den Code ein',
    sub_business: 'Melden Sie sich an, um Ihr Unternehmen zu verwalten',
    email_fallback: 'Ihre E-Mail',
    google: 'Mit Google fortfahren', redirecting: 'Weiterleitung...',
    email_btn: 'Mit E-Mail fortfahren', explore: 'Karte jetzt erkunden', back: '← Zurück',
    or_no_acct: 'oder ohne Konto', or_email: 'oder mit E-Mail',
    login_btn: 'Anmelden', logging_in: 'Anmelden...',
    signup_btn: 'Konto erstellen', creating_acct: 'Konto wird erstellt...',
    verify_btn: 'Konto bestätigen', verifying_act: 'Bestätigung...',
    send_btn: 'Code senden', sending_act: 'Senden...',
    change_pass_btn: 'Passwort ändern', updating_act: 'Aktualisierung...',
    forgot: 'Passwort vergessen?', no_account: 'Kein Konto?',
    have_account: 'Bereits ein Konto?', register: 'Registrieren',
    verify_resend: 'Keinen Code erhalten? Erneut senden',
    email_ph: 'email@beispiel.de', pass_ph: 'Passwort',
    name_opt_ph: 'Name (optional)', pass_min_ph: 'Passwort (min. 8 Zeichen)', new_pass_ph: 'Neues Passwort',
    ok_verified: 'Konto bestätigt! Sie können sich jetzt anmelden.',
    ok_resent: 'Code erneut an Ihre E-Mail gesendet.',
    ok_pass_changed: 'Passwort aktualisiert! Sie können sich jetzt anmelden.',
    err_credentials: 'E-Mail oder Passwort falsch. Wenn Sie sich gerade registriert haben, bestätigen Sie zuerst Ihre E-Mail.',
    err_network: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const MailIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

type View = 'select' | 'tourist' | 't-login' | 't-signup' | 't-verify' | 't-forgot' | 't-reset' | 'business' | 'b-signup' | 'b-verify'

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router  = useRouter()
  const { data: session } = useSession()
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const nextParam = searchParams?.get('next') ?? null

  const [view,        setView]        = useState<View>('select')
  const [viewKey,     setViewKey]     = useState(0)
  const dirRef                        = useRef<'fwd' | 'back'>('fwd')

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [code,        setCode]        = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')

  const [lang, setLang] = useState<LangCode>('es')
  const ui = UI_LANGS[lang]

  const skipSessionRedirectRef = useRef(false)

  useEffect(() => {
    const rol = (session as { rol?: string } | null)?.rol
    const savedDest = typeof window !== 'undefined' ? sessionStorage.getItem('postVerifyDest') : null
    console.log('[login/sessionEffect] session:', !!session, '| rol:', rol, '| skip:', skipSessionRedirectRef.current, '| nextParam:', nextParam, '| postVerifyDest:', savedDest)
    if (!session) return
    if (skipSessionRedirectRef.current) return
    // 1. ?next= param (from protected page redirects)
    if (nextParam) { console.log('[login/sessionEffect] redirecting to nextParam:', nextParam); router.replace(nextParam); return }
    // 2. Destination saved during email verification flow
    if (savedDest) {
      sessionStorage.removeItem('postVerifyDest')
      console.log('[login/sessionEffect] redirecting to postVerifyDest:', savedDest)
      // window.location.href instead of router.replace: the session cookie is already
      // set at this point (session: true confirmed above), so a full reload reads it
      // fresh — router.replace silently fails when a competing async op is in-flight.
      window.location.href = savedDest
      return
    }
    // 3. Default by role
    console.log('[login/sessionEffect] role-based redirect — rol:', rol)
    if (rol === 'admin') {
      router.replace('/admin/dashboard')
    } else if (rol === 'negocio_activo' || rol === 'negocio_pendiente') {
      router.replace('/negocio/perfil')
    } else {
      router.replace('/turista/mapa')
    }
  }, [session, router, nextParam])

  useEffect(() => {
    setLang(getUILang())
  }, [])

  function nav(to: View, dir: 'fwd' | 'back' = 'fwd') {
    dirRef.current = dir
    setViewKey(k => k + 1)
    setView(to)
    setError('')
    setSuccess('')
  }

  // ── Handlers (Preserved exactly to not break backend) ───────────────────────

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('cognito', { callbackUrl: `${window.location.origin}/turista/mapa` }, { identity_provider: 'Google' })
    // In case of rapid re-renders
    setTimeout(() => setLoading(false), 3000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.error) {
      setError(ui.err_credentials)
    }
    // redirect handled by session useEffect based on session.rol
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      nav(view === 'b-signup' ? 'b-verify' : 't-verify', 'fwd')
    } catch {
      setError(ui.err_network)
    }
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, role: view === 'b-verify' ? 'negocio' : 'turista' }),
      })
      const data = await res.json()
      console.log('[verify] API response:', data)
      if (data.error) { setError(data.error); return }
      const dest = view === 'b-verify' ? '/negocio/registro' : '/turista/mapa'
      console.log('[verify] dest:', dest, '| attempting auto-login...')
      skipSessionRedirectRef.current = true  // prevent session useEffect from interfering
      let login = await signIn('credentials', { redirect: false, email, password })
      console.log('[verify] login attempt 1:', login?.error ?? 'OK', '| ok:', login?.ok, '| status:', login?.status)
      if (login?.error) {
        await new Promise(r => setTimeout(r, 2000))
        login = await signIn('credentials', { redirect: false, email, password })
        console.log('[verify] login attempt 2:', login?.error ?? 'OK', '| ok:', login?.ok)
      }
      if (login?.error) {
        console.log('[verify] auto-login failed — saving postVerifyDest for manual login')
        skipSessionRedirectRef.current = false
        sessionStorage.setItem('postVerifyDest', dest)
        setSuccess(ui.ok_verified)
        nav(view === 'b-verify' ? 'business' : 't-login', 'fwd')
      } else {
        // 50ms: gives browser time to process Set-Cookie before the new request
        console.log('[verify] auto-login OK — navigating to:', dest, 'in 50ms')
        setTimeout(() => { window.location.href = dest }, 50)
      }
    } catch {
      setError(ui.err_network)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setSuccess(ui.ok_resent)
    } catch {
      setError(ui.err_network)
    }
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setCode('')
      nav('t-reset', 'fwd')
    } catch {
      setError(ui.err_network)
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: newPassword }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setPassword('')
      setSuccess(ui.ok_pass_changed)
      nav('t-login', 'fwd')
    } catch {
      setError(ui.err_network)
    }
    setLoading(false)
  }

  // ── Derived View Content ────────────────────────────────────────────────────

  const TITLES: Record<View, string> = {
    select:     ui.title_select,
    tourist:    ui.title_tourist,
    't-login':  ui.title_t_login,
    't-signup': ui.title_t_signup,
    't-verify': ui.title_t_verify,
    't-forgot': ui.title_t_forgot,
    't-reset':  ui.title_t_reset,
    business:   ui.title_business,
    'b-signup': ui.title_b_signup,
    'b-verify': ui.title_t_verify,
  }

  const SUBTITLES: Record<View, string> = {
    select:     ui.sub_select,
    tourist:    ui.sub_tourist,
    't-login':  ui.sub_t_login,
    't-signup': ui.sub_t_signup,
    't-verify': ui.sub_t_verify.replace('{email}', email || ui.email_fallback),
    't-forgot': ui.sub_t_forgot,
    't-reset':  ui.sub_t_reset.replace('{email}', email || ui.email_fallback),
    business:   ui.sub_business,
    'b-signup': ui.sub_b_signup,
    'b-verify': ui.sub_t_verify.replace('{email}', email || ui.email_fallback),
  }

  const animClass = viewKey > 0
    ? (dirRef.current === 'fwd' ? 'animate-[slideInFwd_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]' : 'animate-[slideInBack_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]')
    : ''

  // ── Common Tailwind Style Tokens ───────────────────────────────────────────
  // ── Common Semantic Classes (moved to globals.css) ─────────────────────────
  const twInput      = "input-jade-premium"
  const twPrimaryBtn = "btn-jade-primary"
  const twOutlineBtn = "btn-jade-outline"
  const twLinkBtn    = "btn-jade-link"
  const twBackBtn    = "bg-transparent border-none cursor-pointer text-jade-100/50 text-[13px] mt-1 p-2 hover:text-white transition-colors font-bold"

  const divider = (text: string) => (
    <div className="flex items-center gap-4 my-2 opacity-60">
      <div className="flex-1 h-px bg-[var(--color-obs-100)] opacity-20"></div>
      <span className="text-[12px] text-[var(--color-obs-100)] font-medium uppercase tracking-wider">{text}</span>
      <div className="flex-1 h-px bg-[var(--color-obs-100)] opacity-20"></div>
    </div>
  )

  const ErrorBox = () => error ? (
    <div className="p-3 rounded-lg text-[13px] leading-relaxed bg-red-900/30 border border-red-500/30 text-red-200">
      {error}
    </div>
  ) : null

  const SuccessBox = () => success ? (
    <div className="p-3 rounded-lg text-[13px] leading-relaxed bg-[var(--color-jade-900)] border border-[var(--color-jade-400)] text-[var(--color-jade-50)]">
      {success}
    </div>
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-jade-air overflow-hidden relative selection:bg-[var(--color-jade-air-accent)] selection:text-white">
      <style>{`
        @keyframes slideInFwd  { from { opacity:0; transform:translateX(24px)  } to { opacity:1; transform:none } }
        @keyframes slideInBack { from { opacity:0; transform:translateX(-24px) } to { opacity:1; transform:none } }
      `}</style>

      {/* ── Brand Panel (Dark Jade for Logo Contrast) ──────────────────── */}
      <div className="flex-none md:flex-1 md:w-1/2 bg-gradient-to-br from-[#04342C] via-[#0D7C66] to-[#04342C] flex flex-col items-center justify-center p-10 md:p-16 relative overflow-hidden min-h-[300px] md:min-h-screen">
        {patterns.map((p, i) => (
          <div key={i} className="absolute pointer-events-none opacity-10" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}>
            <svg width="80" height="80" viewBox="0 0 60 60">
              <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="var(--color-jade-100)" strokeWidth="1.5" opacity="0.4"/>
              <polygon points="30,10 50,30 30,50 10,30" fill="none" stroke="var(--color-jade-100)" strokeWidth="1" opacity="0.2"/>
            </svg>
          </div>
        ))}

        <div className="relative z-10 w-56 md:w-[320px] mb-6 drop-shadow-[0_0_24px_rgba(29,158,117,0.3)] flex justify-center">
          <img
            src="/Ruta_Azteca.svg"
            alt="Ruta Azteca Logo"
            className="w-full h-auto object-contain"
          />
        </div>

        <h1 className="relative z-10 m-0 text-3xl md:text-5xl font-extrabold tracking-[0.12em] text-white uppercase text-center">
          Ruta Azteca
        </h1>

        <div className="relative z-10 w-12 h-1 bg-gradient-to-r from-[var(--color-gold-200)] to-[#FDE68A] my-5 rounded-full shadow-lg" />

        <p className="relative z-10 m-0 text-[14px] md:text-[16px] text-jade-50 text-center max-w-[340px] leading-relaxed tracking-wide font-medium opacity-90">
          {ui.subtitle_brand}
        </p>

        <div className="hidden md:flex gap-3 mt-10 relative z-10">
          {['CDMX', 'Guadalajara', 'Monterrey'].map(city => (
            <span key={city} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/20 text-white text-[12px] font-black tracking-[0.05em] bg-white/10 backdrop-blur-md shadow-sm">
              <MapPinIcon /> {city}
            </span>
          ))}
        </div>

        <p className="hidden md:block absolute bottom-8 text-[11px] text-white/50 tracking-[0.1em] uppercase font-black">
          {ui.subtitle_footer}
        </p>
      </div>

      {/* ── Form Panel (Jade Air Look) ──────────────── */}
      <div className="flex-1 md:w-1/2 flex items-start md:items-center justify-center p-6 md:p-16 relative">

        {/* Deep Contrast Container */}
        <div className="w-full max-w-[420px] p-8 md:p-10 relative z-10 bg-[#04342C]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl shadow-black/40">

          <div className={animClass}>
            <h2 className="m-0 mb-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              {TITLES[view]}
            </h2>
            <p className="m-0 mb-8 text-[14px] text-jade-100/70 font-semibold leading-relaxed">
              {SUBTITLES[view]}
            </p>

            {/* ── select ──────────────────────────────────────────────────── */}
            {view === 'select' && (
              <div className="flex flex-col gap-4">
                <button onClick={() => nav('tourist', 'fwd')} className="group flex items-center gap-4 w-full p-4 bg-gradient-to-br from-[#0D7C66] to-[#1A9E78] hover:scale-[1.02] rounded-2xl transition-all shadow-xl text-left border-none">
                  <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-white font-black text-[16px] mb-0.5">{ui.tourist_btn}</div>
                    <div className="text-white/70 text-[13px] font-semibold">{ui.tourist_sub}</div>
                  </div>
                </button>

                <button onClick={() => nav('business', 'fwd')} className="group flex items-center gap-4 w-full p-4 bg-white hover:bg-jade-50 rounded-2xl transition-all text-left shadow-lg scale-[1.01] border-none">
                  <span className="w-12 h-12 rounded-xl bg-[var(--color-jade-air-light)] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[var(--color-jade-air-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-[#04342C] font-black text-[16px] mb-0.5">{ui.business_btn}</div>
                    <div className="text-[var(--text-muted)] text-[13px] font-semibold">{ui.business_sub}</div>
                  </div>
                </button>
              </div>
            )}

            {/* ── tourist ─────────────────────────────────────────────────── */}
            {view === 'tourist' && (
              <div className="flex flex-col gap-3.5">
                <button onClick={handleGoogle} disabled={loading} className={twOutlineBtn}>
                  <GoogleIcon /> {loading ? ui.redirecting : ui.google}
                </button>

                <button onClick={() => nav('t-login', 'fwd')} className={twOutlineBtn}>
                  <MailIcon /> {ui.email_btn}
                </button>

                {divider(ui.or_no_acct)}

                <a href="/turista/mapa" className={twPrimaryBtn + " text-center block"}>
                  {ui.explore}
                </a>

                <button onClick={() => nav('select', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── t-login ──────────────────────────────────────────────────── */}
            {view === 't-login' && (
              <div className="flex flex-col gap-3.5">
                <SuccessBox />
                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder={ui.email_ph} value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder={ui.pass_ph} value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => nav('t-forgot', 'fwd')} className="text-jade-100/60 hover:text-white bg-transparent border-none cursor-pointer text-[12px] py-1 underline transition-colors font-semibold">
                      {ui.forgot}
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? ui.logging_in : ui.login_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-jade-100/60 font-medium">{ui.no_account} </span>
                  <button onClick={() => nav('t-signup', 'fwd')} className="text-white hover:text-jade-400 bg-transparent border-none cursor-pointer text-[13px] py-1 underline transition-colors font-bold">{ui.register}</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── t-signup ─────────────────────────────────────────────────── */}
            {view === 't-signup' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  <input
                    type="text" placeholder={ui.name_opt_ph} value={name}
                    onChange={e => setName(e.target.value)} autoFocus className={twInput}
                  />
                  <input
                    type="email" placeholder={ui.email_ph} value={email}
                    onChange={e => setEmail(e.target.value)} required className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder={ui.pass_min_ph} value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? ui.creating_acct : ui.signup_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-jade-100/60 font-medium">{ui.have_account} </span>
                  <button onClick={() => nav('t-login', 'back')} className="text-white hover:text-jade-400 bg-transparent border-none cursor-pointer text-[13px] py-1 underline transition-colors font-bold">{ui.login_btn}</button>
                </div>
                <button onClick={() => nav('tourist', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── t-verify ─────────────────────────────────────────────────── */}
            {view === 't-verify' && (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl">
                  <div className="text-[var(--color-jade-400)]"><MailIcon /></div>
                  <span className="text-[14px] text-[var(--color-jade-50)] font-medium break-all">{email}</span>
                </div>
                <form onSubmit={handleVerify} className="flex flex-col gap-3.5 mt-2">
                  <input
                    type="text" placeholder="000 000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    className={twInput + " text-center text-[28px] tracking-[0.3em] font-bold py-4"}
                  />
                  <ErrorBox />
                  <SuccessBox />
                  <button type="submit" disabled={loading || code.length < 6} className={twPrimaryBtn}>
                    {loading ? ui.verifying_act : ui.verify_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <button onClick={handleResend} disabled={loading} className={twLinkBtn}>
                    {ui.verify_resend}
                  </button>
                </div>
                <button onClick={() => nav('t-signup', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── t-forgot ─────────────────────────────────────────────────── */}
            {view === 't-forgot' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleForgot} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder={ui.email_ph} value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus className={twInput}
                  />
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? ui.sending_act : ui.send_btn}
                  </button>
                </form>
                <button onClick={() => nav('t-login', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── t-reset ──────────────────────────────────────────────────── */}
            {view === 't-reset' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleReset} className="flex flex-col gap-3.5">
                  <input
                    type="text" placeholder="000 000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    className={twInput + " text-center text-[28px] tracking-[0.3em] font-bold py-4"}
                  />
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'} placeholder={ui.new_pass_ph} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showNewPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading || code.length < 6} className={twPrimaryBtn}>
                    {loading ? ui.updating_act : ui.change_pass_btn}
                  </button>
                </form>
                <button onClick={() => nav('t-forgot', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── business ─────────────────────────────────────────────────── */}
            {view === 'business' && (
              <div className="flex flex-col gap-3.5">
                <SuccessBox />
                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <input
                    type="email" placeholder={ui.email_ph} value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder={ui.pass_ph} value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => nav('t-forgot', 'fwd')} className={twLinkBtn}>
                      {ui.forgot}
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? ui.logging_in : ui.login_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-[var(--color-obs-100)] font-light">{ui.no_account} </span>
                  <button onClick={() => nav('b-signup', 'fwd')} className={twLinkBtn + " font-medium"}>{ui.register}</button>
                </div>
                <button onClick={() => nav('select', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── b-signup ─────────────────────────────────────────────────── */}
            {view === 'b-signup' && (
              <div className="flex flex-col gap-3.5">
                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  <input
                    type="text" placeholder={ui.name_opt_ph} value={name}
                    onChange={e => setName(e.target.value)} autoFocus className={twInput}
                  />
                  <input
                    type="email" placeholder={ui.email_ph} value={email}
                    onChange={e => setEmail(e.target.value)} required className={twInput}
                  />
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} placeholder={ui.pass_min_ph} value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className={twInput + " pr-14"}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-jade-100)] opacity-60 hover:opacity-100 transition-opacity">
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <ErrorBox />
                  <button type="submit" disabled={loading} className={twPrimaryBtn}>
                    {loading ? ui.creating_acct : ui.signup_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[13px] text-[var(--color-obs-100)] font-light">{ui.have_account} </span>
                  <button onClick={() => nav('business', 'back')} className={twLinkBtn + " font-medium"}>{ui.login_btn}</button>
                </div>
                <button onClick={() => nav('business', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}

            {/* ── b-verify ─────────────────────────────────────────────────── */}
            {view === 'b-verify' && (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl">
                  <div className="text-[var(--color-jade-400)]"><MailIcon /></div>
                  <span className="text-[14px] text-[var(--color-jade-50)] font-medium break-all">{email}</span>
                </div>
                <form onSubmit={handleVerify} className="flex flex-col gap-3.5 mt-2">
                  <input
                    type="text" placeholder="000 000" value={code} inputMode="numeric"
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required maxLength={6} autoFocus
                    className={twInput + " text-center text-[28px] tracking-[0.3em] font-bold py-4"}
                  />
                  <ErrorBox />
                  <SuccessBox />
                  <button type="submit" disabled={loading || code.length < 6} className={twPrimaryBtn}>
                    {loading ? ui.verifying_act : ui.verify_btn}
                  </button>
                </form>
                <div className="text-center mt-2">
                  <button onClick={handleResend} disabled={loading} className={twLinkBtn}>
                    {ui.verify_resend}
                  </button>
                </div>
                <button onClick={() => nav('b-signup', 'back')} className={twBackBtn}>{ui.back}</button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Footer Text */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-[11px] text-[var(--color-jade-100)]/40 tracking-[0.05em] font-medium uppercase">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {ui.verified_footer}
        </div>
      </div>

    </div>
  )
}
