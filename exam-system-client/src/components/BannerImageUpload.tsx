'use no memo'
import { ImageIcon, XIcon } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { api } from '#/ApiInstance'
import { Button } from '#/components/ui/button'

interface BannerImageUploadProps {
  value?: string
  onChange?: (url: string) => void
}

export default function BannerImageUpload({
  value,
  onChange,
}: BannerImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)
      setUploading(true)

      try {
        const response = await api.bannerController.uploadImage({
          body: { file },
        })
        if (response.data) {
          URL.revokeObjectURL(localPreview)
          setPreview(response.data)
          onChange?.(response.data)
        }
      } catch (error) {
        console.error('Upload failed:', error)
        URL.revokeObjectURL(localPreview)
        setPreview(null)
      } finally {
        setUploading(false)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    },
    [onChange],
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    onChange?.('')
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex">
        <Button
          type="button"
          aria-label={preview ? 'Change image' : 'Upload image'}
          className="relative h-32 w-64 overflow-hidden p-0 shadow-none"
          onClick={() => inputRef.current?.click()}
          variant="outline"
          disabled={uploading}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground text-sm">上传中...</span>
            </div>
          ) : preview ? (
            <img
              alt="Preview"
              className="size-full object-contain"
              src={preview}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <ImageIcon className="size-8 opacity-60" />
              <span className="text-muted-foreground text-xs">点击上传</span>
            </div>
          )}
        </Button>
        {preview && (
          <Button
            type="button"
            aria-label="Remove image"
            className="border-background absolute -top-2 -right-2 size-6 rounded-full border-2 shadow-none"
            onClick={handleRemove}
            size="icon"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
