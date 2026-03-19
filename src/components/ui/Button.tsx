'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className, ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50'
  const variants = {
    primary:   'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger:    'bg-red-100 text-red-700 hover:bg-red-200',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className ?? ''}`} disabled={loading} {...props}>
      {loading ? 'Cargando...' : children}
    </button>
  )
}
