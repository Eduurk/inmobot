'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'

interface UploadedPhoto {
  url: string
  path?: string
  esPrincipal: boolean
  file?: File
  preview?: string
  uploading?: boolean
}

interface ImageUploadProps {
  photos: UploadedPhoto[]
  onChange: (photos: UploadedPhoto[]) => void
  propiedadId?: string
}

export default function ImageUpload({ photos, onChange, propiedadId }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    if (propiedadId) formData.append('propiedadId', propiedadId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      return data.url ?? null
    } catch {
      return null
    }
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (arr.length === 0) return

      const previews: UploadedPhoto[] = arr.map((file, i) => ({
        url: '',
        file,
        preview: URL.createObjectURL(file),
        esPrincipal: photos.length === 0 && i === 0,
        uploading: true,
      }))

      const newPhotos = [...photos, ...previews]
      onChange(newPhotos)

      const uploaded = await Promise.all(
        previews.map(async (p, i) => {
          const url = await uploadFile(p.file!)
          return { ...p, url: url ?? '', uploading: false, idx: photos.length + i }
        })
      )

      onChange(
        newPhotos.map((p, idx) => {
          const u = uploaded.find((x) => x.idx === idx)
          return u ? { ...p, url: u.url, uploading: false } : p
        })
      )
    },
    [photos, onChange, propiedadId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx)
    if (updated.length > 0 && !updated.some((p) => p.esPrincipal)) {
      updated[0].esPrincipal = true
    }
    onChange(updated)
  }

  const setPrincipal = (idx: number) => {
    onChange(photos.map((p, i) => ({ ...p, esPrincipal: i === idx })))
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-dorado bg-dorado/5'
            : 'border-crema-dark hover:border-dorado/50 bg-crema'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <svg className="w-10 h-10 mx-auto mb-3 text-oscuro/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-oscuro/60 text-sm">
          <span className="font-semibold text-dorado">Hacé clic</span> o arrastrá fotos aquí
        </p>
        <p className="text-oscuro/40 text-xs mt-1">PNG, JPG, WEBP — Múltiples archivos</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-crema-dark">
              <Image
                src={photo.preview ?? photo.url}
                alt={`Foto ${idx + 1}`}
                fill
                className={`object-cover transition-opacity ${photo.uploading ? 'opacity-50' : 'opacity-100'}`}
              />

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!photo.uploading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPrincipal(idx)}
                    title="Marcar como principal"
                    className="w-8 h-8 bg-dorado rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-oscuro" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    title="Eliminar"
                    className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {photo.esPrincipal && (
                <div className="absolute top-1.5 left-1.5 bg-dorado text-oscuro text-xs font-bold px-1.5 py-0.5 rounded-md">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
