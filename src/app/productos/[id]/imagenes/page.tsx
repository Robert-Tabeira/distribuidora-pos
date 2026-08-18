'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'

interface EditingImage {
  id: string
  originalFile: File
  preview: string
  rotation: number
  scale: number
  offsetX: number
  offsetY: number
}

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

  // Editor
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null)

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

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          const maxWidth = 1920
          const maxHeight = 1920

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob!], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              })
              console.log(`✅ Comprimida: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`)
              resolve(compressedFile)
            },
            'image/webp',
            0.92
          )
        }
      }
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen no puede pesar más de 10MB')
        return
      }

      const compressedFile = await compressImage(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Escala inicial: el navegador ya ajusta automáticamente la imagen
          // al contenedor (via max-w-full/max-h-full), así que acá el 0.7
          // representa "70% de ese tamaño ya ajustado" (deja margen visible),
          // sin importar la resolución original de la foto.
          const initialScale = 0.7

          setEditingImage({
            id: Date.now().toString(),
            originalFile: compressedFile,
            preview: event.target?.result as string,
            rotation: 0,
            scale: initialScale,
            offsetX: 0,
            offsetY: 0
          })
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al procesar la imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function rotateImage(degrees: number) {
    if (!editingImage) return
    setEditingImage({
      ...editingImage,
      rotation: (editingImage.rotation + degrees) % 360
    })
  }

  function updateScale(newScale: number) {
    if (!editingImage) return
    setEditingImage({
      ...editingImage,
      scale: Math.max(0.3, Math.min(2, newScale))
    })
  }

  function updateOffset(x: number, y: number) {
    if (!editingImage) return
    setEditingImage({
      ...editingImage,
      offsetX: x,
      offsetY: y
    })
  }

  async function saveEditedImage() {
    if (!editingImage) return

    try {
      setUploading(true)

      const img = new Image()
      img.onload = async () => {
        // Step 1: Renderizar en canvas grande (384px) tal como se ve

        // El navegador ajusta automáticamente la imagen para que quepa en el
        // cuadro de 384px (vía max-w-full/max-h-full), y RECIÉN sobre ese
        // tamaño ya ajustado se aplica el zoom del slider (editingImage.scale).
        // El canvas NO hace ese ajuste automático, así que hay que calcularlo
        // a mano para que el guardado coincida con lo que se ve en pantalla.
        const largeSize = 384
        const previewPadding = 16 // p-4
        const previewBorder = 2 // border-2
        const previewInner = largeSize - (previewPadding + previewBorder) * 2 // ~348px

        const fitScale = Math.min(
          1,
          previewInner / img.width,
          previewInner / img.height
        )

        const largeCanvas = document.createElement('canvas')

        largeCanvas.width = largeSize
        largeCanvas.height = largeSize

        const largeCtx = largeCanvas.getContext('2d')!
        // Canvas queda transparente por defecto (no rellenamos fondo)
        // para que el WebP final conserve el canal alpha

        // Dibujar exactamente como se ve en pantalla:
        // 1) rotar, 2) aplicar el zoom del usuario (igual que el CSS
        //    "scale(editingImage.scale)"), 3) mover según offset X/Y
        //    (en ese mismo espacio, igual que hace el navegador),
        //    4) recién ahí aplicar el ajuste automático a tamaño real
        //    (fitScale) solo para dibujar la imagen a su tamaño correcto.
        largeCtx.save()
        largeCtx.translate(largeSize / 2, largeSize / 2)
        largeCtx.rotate((editingImage.rotation * Math.PI) / 180)
        largeCtx.scale(editingImage.scale, editingImage.scale)
        largeCtx.translate(editingImage.offsetX, editingImage.offsetY)
        largeCtx.scale(fitScale, fitScale)
        largeCtx.drawImage(img, -img.width / 2, -img.height / 2)
        largeCtx.restore()

        // Step 2: Recortar SOLO el área naranja (75% central = 288px)
        const borderSize = (largeSize - largeSize * 0.75) / 2 // 48px
        const cropSize = largeSize * 0.75 // 288px

        const croppedCanvas = document.createElement('canvas')
        croppedCanvas.width = cropSize
        croppedCanvas.height = cropSize

        const croppedCtx = croppedCanvas.getContext('2d')!
        croppedCtx.drawImage(
          largeCanvas,
          borderSize,
          borderSize,
          cropSize,
          cropSize,
          0,
          0,
          cropSize,
          cropSize
        )

        // Step 3: Redimensionar a 192px
        const finalCanvas = document.createElement('canvas')
        const finalSize = 192

        finalCanvas.width = finalSize
        finalCanvas.height = finalSize

        const finalCtx = finalCanvas.getContext('2d')!
        // Sin fillRect: mantenemos transparencia (antes quedaba blanco sólido)

        // Dibujar imagen recortada redimensionada
        finalCtx.drawImage(croppedCanvas, 0, 0, finalSize, finalSize)

        finalCanvas.toBlob(async (blob) => {
          const finalFile = new File([blob!], editingImage.originalFile.name, {
            type: 'image/webp'
          })

          console.log(`Guardando: ${(blob!.size / 1024).toFixed(2)}KB`)
          await uploadToSupabase(finalFile)
        }, 'image/webp', 0.95)
      }

      img.src = editingImage.preview
    } catch (error) {
      console.error('Error saving image:', error)
      alert('Error al guardar la imagen')
      setUploading(false)
    }
  }

  async function uploadToSupabase(file: File) {
    try {
      const fileName = `product-images/${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      if (publicData?.publicUrl) {
        setImages([...images, publicData.publicUrl])
        setEditingImage(null)
        alert('✅ Imagen guardada correctamente')
      }
    } catch (error) {
      console.error('Error uploading to supabase:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  async function removeImage(index: number) {
    if (!confirm('¿Eliminar esta imagen?')) return

    const imageUrl = images[index]
    try {
      const pathMatch = imageUrl.match(/product-images\/(.+)$/)
      if (pathMatch) {
        await supabase.storage
          .from('product-images')
          .remove([pathMatch[1]])
      }

      setImages(images.filter((_, i) => i !== index))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error al eliminar la imagen')
    }
  }

  async function saveAllImages() {
    if (images.length === 0) return

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
        <div className="max-w-6xl mx-auto px-4 py-6">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {editingImage ? (
          // Editor de imagen
          <div className="card">
            <h3 className="font-bold text-lg mb-6">Editor de Imagen</h3>

            <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">
            {/* Columna izquierda: previews, quedan fijos en pantalla mientras ajustás los controles */}
            <div className="lg:col-span-3 sticky top-24 z-10 bg-gray-50/95 backdrop-blur-sm pb-4 -mx-1 px-1 rounded-lg">
            <div className="grid sm:grid-cols-3 gap-6 mb-2">
              {/* Preview PEQUEÑO - Lo que se verá en catálogo */}
              <div>
                <h4 className="font-bold text-sm mb-4 text-gray-700">Resultado Final (192x192px)</h4>
                
                <div className="relative rounded-lg p-4 border-2 border-green-500 w-48 h-48 mx-auto flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' }}>
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 pointer-events-none opacity-20">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-gray-400" />
                    ))}
                  </div>

                  <div
                    style={{
                      transform: `rotate(${editingImage.rotation}deg) scale(${editingImage.scale}) translate(${(editingImage.offsetX * 192) / 384}px, ${(editingImage.offsetY * 192) / 384}px)`,
                      transition: 'transform 0.2s'
                    }}
                    className="flex items-center justify-center"
                  >
                    <img
                      src={editingImage.preview}
                      alt="Final"
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>

                <p className="text-xs text-green-600 mt-3 text-center font-bold">
                  ✅ Esto es exactamente lo que se verá en el catálogo
                </p>
              </div>

              {/* Preview GRANDE - Para editar */}
              <div className="sm:col-span-2">
                <h4 className="font-bold text-sm mb-4 text-gray-700">Editor (Escala Ampliada para Ajustar)</h4>
                
                <div className="relative rounded-lg p-4 border-2 border-blue-500 w-96 h-96 mx-auto flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' }}>
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 pointer-events-none opacity-20">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-gray-400" />
                    ))}
                  </div>

                  <div className="absolute w-3/4 h-3/4 border-3 border-orange-500 rounded pointer-events-none shadow-lg">
                    <div className="absolute inset-0 bg-orange-500 opacity-10" />
                  </div>

                  <div
                    style={{
                      transform: `rotate(${editingImage.rotation}deg) scale(${editingImage.scale}) translate(${editingImage.offsetX}px, ${editingImage.offsetY}px)`,
                      transition: 'transform 0.2s',
                      cursor: 'grab'
                    }}
                    className="flex items-center justify-center"
                  >
                    <img
                      src={editingImage.preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>

                <p className="text-xs text-blue-600 mt-3 text-center font-semibold">
                  Ajusta aquí - Mira el resultado a la izquierda
                </p>
              </div>
            </div>
            </div>

              {/* Herramientas */}
              <div className="lg:col-span-2 space-y-4 mt-8 lg:mt-0">
                <div>
                  <h4 className="font-bold mb-3">🔄 Rotación</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rotateImage(-90)}
                      className="flex-1 px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-all"
                    >
                      ⟲ -90°
                    </button>
                    <button
                      onClick={() => rotateImage(90)}
                      className="flex-1 px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-all"
                    >
                      ⟳ +90°
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Rotación: {editingImage.rotation}°</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3">🔍 Zoom</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0.3"
                      max="2"
                      step="0.01"
                      value={editingImage.scale}
                      onChange={(e) => updateScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">Tamaño: {(editingImage.scale * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3">↔️ Posición X</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="5"
                      value={editingImage.offsetX}
                      onChange={(e) => updateOffset(parseFloat(e.target.value), editingImage.offsetY)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">Horizontal: {editingImage.offsetX}px</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3">↕️ Posición Y</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="5"
                      value={editingImage.offsetY}
                      onChange={(e) => updateOffset(editingImage.offsetX, parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">Vertical: {editingImage.offsetY}px</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3">📊 Info</h4>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                    <p><strong>Formato:</strong> {editingImage.originalFile.type}</p>
                    <p><strong>Tamaño:</strong> {(editingImage.originalFile.size / 1024).toFixed(2)} KB</p>
                    <p className="text-xs text-gray-600 mt-2">✅ Comprimida automáticamente</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => setEditingImage(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEditedImage}
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-all"
                  >
                    {uploading ? '⏳ Guardando...' : '✅ Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Upload Area */}
            <div className="mb-8 card">
              <h3 className="font-bold text-lg mb-4">Subir Nueva Imagen</h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="text-6xl mb-3">📸</div>
                <div className="font-semibold text-gray-900 mb-2">Haz clic para subir una imagen</div>
                <div className="text-sm text-gray-600">JPG, PNG, WebP (máx 10MB)</div>
                <div className="text-xs text-green-600 mt-2">✅ Se comprime automáticamente</div>
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
                    <span className="text-blue-800 font-semibold">Procesando imagen...</span>
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
                    onClick={saveAllImages}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    {saving ? 'Guardando...' : '✅ Guardar Galería'}
                  </button>
                )}
              </div>

              {images.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="text-gray-600">No hay imágenes. Sube tu primera imagen!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden aspect-square group"
                      style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' }}
                    >
                      <img
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
                        }}
                      />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button
                          onClick={() => removeImage(index)}
                          className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center font-bold transition-all"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
