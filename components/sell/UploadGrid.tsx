"use client"

import { useRef, useCallback, useState } from 'react'
import { Camera, X, Video } from 'lucide-react'
import type { SellDraftImage, SellDraftUploadedImage } from '@/lib/types'

const MAX = 10
const MIN = 4

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime'
const ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.avi']

function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const path = url.split('?')[0] || ''
  return VIDEO_EXT.some((ext) => path.toLowerCase().endsWith(ext))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type UploadGridProps = {
  images: SellDraftImage[]
  uploadedImages: SellDraftUploadedImage[]
  onAdd: (files: File[]) => void
  onRemove: (localId: string) => void
  onRemoveUploaded: (id: number) => void
  imageBase?: string
}

export function UploadGrid({
  images,
  uploadedImages,
  onAdd,
  onRemove,
  onRemoveUploaded,
  imageBase = '',
}: UploadGridProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const hasUploaded = uploadedImages.length > 0
  const list = hasUploaded
    ? uploadedImages.map((u) => ({
        type: 'uploaded' as const,
        id: String(u.id),
        url: u.url,
        isVideo: isVideoUrl(u.url),
        backendId: u.id,
        fileSize: undefined as number | undefined,
        fileName: undefined as string | undefined,
      }))
    : images.map((i) => ({
        type: 'local' as const,
        id: i.id,
        url: i.previewUrl,
        isVideo: i.isVideo ?? false,
        backendId: null as number | null,
        fileSize: i.file?.size,
        fileName: i.file?.name,
      }))

  const total = list.length
  const canAdd = total < MAX

  const resolveUrl = useCallback(
    (url: string) => {
      if (!url) return ''
      if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:'))
        return url
      if (imageBase) return imageBase + (url.startsWith('/') ? url : '/' + url)
      return url
    },
    [imageBase]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const toAdd = Math.min(MAX - total, files.length)
    onAdd(Array.from(files).slice(0, toAdd))
    e.target.value = ''
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (!canAdd) return
      const files = Array.from(e.dataTransfer.files || [])
      if (files.length) onAdd(files.slice(0, MAX - total))
    },
    [canAdd, onAdd, total]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleRemove = useCallback(
    (item: (typeof list)[0]) => {
      if (item.type === 'uploaded' && item.backendId != null) {
        onRemoveUploaded(item.backendId)
        return
      }
      if (item.type === 'local' && item.isVideo && item.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url)
      }
      onRemove(item.id)
    },
    [onRemove, onRemoveUploaded]
  )

  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-sm font-medium">
        {total}/{MAX} files
      </p>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${isDragging && canAdd ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {list.map((item) => {
          const playableVideoUrl =
            item.isVideo && item.url ? resolveUrl(item.url) : ''
          const showVideoPlayer =
            item.isVideo && playableVideoUrl && (playableVideoUrl.startsWith('blob:') || playableVideoUrl.startsWith('http') || isVideoUrl(playableVideoUrl))

          return (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-700/80 border border-gray-600"
            >
              {item.isVideo ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90">
                  {showVideoPlayer ? (
                    <video
                      src={playableVideoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Video className="h-12 w-12 text-blue-400" />
                      <span className="text-xs px-2 text-center truncate max-w-full">
                        {item.fileName || (item.fileSize != null ? formatFileSize(item.fileSize) : 'Video')}
                      </span>
                      {item.fileSize != null && (
                        <span className="text-[10px] text-gray-500">{formatFileSize(item.fileSize)}</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={resolveUrl(item.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              {item.fileSize != null && !item.isVideo && (
                <span className="absolute bottom-1 left-1 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                  {formatFileSize(item.fileSize)}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-600/90 text-white transition-colors z-10"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-500 hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Add media"
          >
            <Camera className="h-8 w-8" />
            <span className="text-xs">Add more</span>
          </button>
        )}
      </div>
    </div>
  )
}

export { MIN as UPLOAD_MIN, MAX as UPLOAD_MAX }
