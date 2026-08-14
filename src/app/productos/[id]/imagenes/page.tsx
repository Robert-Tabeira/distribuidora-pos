'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import type { Product } from '@/types/database'

export default function ProductImagesPage() {
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [productId])

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      setProduct(data as Product)
      setImages(data.gallery || [])
    } catch (error) {
      console.error('Error loading product:', error)
      alert('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { url, error } = await uploadImageToSupabase(file, `product-images/${productId}`)

    if (error) {
      alert(`❌ Error al subir imagen: ${error}`)
    } else {
      setImages([...images, url])
      alert('✅ Imagen subida correctamente')
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function removeImage(index: number) {
    if (!confirm('¿Eliminar esta imagen?')) return

    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  async function saveImages() {
    if (!product) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ gallery: images })
        .eq('id', productId)

      if (error) throw error

      alert('✅ Imágenes guardadas correctamente')
      router.push('/productos')
    } catch (error) {
      console.error('Error saving images:', error)
      alert('❌ Error al guardar las imágenes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Producto no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Editar Imágenes</h1>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload Area */}
        <div className="mb-8 card">
          <h3 className="font-bold text-lg mb-4">Subir Nueva Imagen</h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="text-5xl mb-3">📸</div>
            <div className="font-semibold text-gray-900 mb-1">Haz clic para subir una imagen</div>
            <div className="text-sm text-gray-600">JPG, PNG, WebP (máx 5MB)</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />

          {uploading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" />
                <span className="text-blue-800 font-semibold">Subiendo imagen...</span>
              </div>
            </div>
          )}
        </div>

        {/* Galería */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Galería ({images.length})</h3>
            {images.length > 0 && (
              <button
                onClick={saveImages}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {saving ? 'Guardando...' : '✅ Guardar Imágenes'}
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-gray-600">No hay imágenes en la galería. Sube tu primera imagen!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group"
                >
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
                    }}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <button
                      onClick={() => removeImage(index)}
                      className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold transition-all"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Index Badge */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Consejo:</strong> Las imágenes aparecerán en el catálogo en el orden que las subas. Elimina y vuelve a subir si necesitas cambiar el orden.
          </p>
        </div>
      </main>
    </div>
  )
}
