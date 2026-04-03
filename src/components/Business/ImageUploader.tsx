'use client'
import { useState, useRef, useEffect } from 'react'
import { ImagePlus, Loader2, CheckCircle, X, Upload } from 'lucide-react'

interface Props {
  onUploadComplete: (cdnUrl: string) => void
  onUploadClear:    () => void
}

type Status = 'idle' | 'uploading' | 'done' | 'error'

const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export function ImageUploader({ onUploadComplete, onUploadClear }: Props) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [status, setStatus]   = useState<Status>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError]     = useState('')

  // Revoke object URL on change to avoid memory leaks
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  function validate(file: File): string | null {
    if (!ALLOWED.includes(file.type)) return 'Solo se permiten imágenes JPG, PNG o WebP.'
    if (file.size > MAX_SIZE)         return 'La imagen debe pesar menos de 5 MB.'
    return null
  }

  async function handleFile(file: File) {
    const err = validate(file)
    if (err) { setStatus('error'); setError(err); return }

    setPreview(URL.createObjectURL(file))
    setStatus('uploading')
    setError('')

    try {
      // Step 1: get presigned URL from our API
      const apiRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!apiRes.ok) {
        const d = await apiRes.json()
        throw new Error(d.error ?? 'Error al obtener URL de subida')
      }
      const { uploadUrl, cdnUrl } = await apiRes.json()

      // Step 2: PUT directly to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!s3Res.ok) throw new Error('Error al subir la imagen')

      setStatus('done')
      onUploadComplete(cdnUrl)
    } catch (e: any) {
      setStatus('error')
      setError(e.message ?? 'Error desconocido')
      setPreview(null)
    }
  }

  function handleClear() {
    setStatus('idle')
    setPreview(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    onUploadClear()
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Idle */}
      {status === 'idle' && (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '1.5px dashed #0D7C66', borderRadius: 12,
            padding: '20px 14px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, cursor: 'pointer', background: '#f0fdf8',
          }}
        >
          <ImagePlus size={28} color="#0D7C66" />
          <span style={{ fontSize: 13, color: '#0D7C66', fontWeight: 600 }}>Agregar foto del negocio</span>
          <span style={{ fontSize: 11, color: '#8a9690' }}>JPG, PNG o WebP · máx. 5 MB</span>
        </div>
      )}

      {/* Uploading */}
      {status === 'uploading' && preview && (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          <img src={preview} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', opacity: 0.5, display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={24} color="#0D7C66" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#0D7C66', fontWeight: 600 }}>Subiendo…</span>
          </div>
        </div>
      )}

      {/* Done */}
      {status === 'done' && preview && (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          <img src={preview} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#0D7C66', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={12} color="#fff" />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Imagen lista</span>
          </div>
          <button
            onClick={handleClear}
            style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} color="#fff" />
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#C53030' }}>
            {error}
          </div>
          <button
            onClick={() => { setStatus('idle'); setError(''); if (inputRef.current) inputRef.current.value = '' }}
            style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #0D7C66', background: '#f0fdf8', fontSize: 13, fontWeight: 600, color: '#0D7C66', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
          >
            <Upload size={14} /> Intentar de nuevo
          </button>
        </>
      )}
    </div>
  )
}
