import { supabase } from '@/lib/supabase'

async function compressForWeb(file: File, folder: string, preset: 'default' | 'category-icon'): Promise<File> {
  // No rasterizar SVG ni animaciones: se preserva el original.
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file

  const isFavicon = folder === 'favicons'
  const maxDimension = isFavicon ? 512 : preset === 'category-icon' ? 384 : folder === 'logo' ? 900 : folder === 'hero-images' ? 2200 : 1800
  const quality = preset === 'category-icon' || folder === 'logo' ? 0.9 : 0.82

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const outputType = isFavicon ? 'image/png' : 'image/webp'
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, outputType, quality))
    if (!blob || blob.type !== outputType || (blob.size >= file.size && (!isFavicon || scale === 1))) return file

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.${isFavicon ? 'png' : 'webp'}`, { type: outputType, lastModified: file.lastModified })
  } catch (error) {
    console.warn('No se pudo optimizar la imagen en este navegador; se subirá el original.', error)
    return file
  }
}

export async function uploadImageToSupabase(
  file: File,
  folder: string = 'hero-images',
  preset: 'default' | 'category-icon' = 'default'
): Promise<{ url: string; error: string | null }> {
  try {
    // Validar archivo
    if (!file) {
      return { url: '', error: 'No file selected' }
    }

    if (!file.type.startsWith('image/')) {
      return { url: '', error: 'El archivo debe ser una imagen (JPG, PNG, WebP, etc)' }
    }

    if (file.size > 20 * 1024 * 1024) {
      return { url: '', error: 'La imagen original no puede pesar más de 20MB' }
    }

    const uploadFile = await compressForWeb(file, folder, preset)

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = uploadFile.name.split('.').pop()
    const fileName = `${timestamp}_${random}.${extension}`
    const filePath = `${folder}/${fileName}`

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, uploadFile, {
        cacheControl: '31536000',
        contentType: uploadFile.type || file.type,
        upsert: false
      })

    if (uploadError) {
      return { url: '', error: `Error al subir: ${uploadError.message}` }
    }

    // Obtener URL pública
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    if (!data.publicUrl) {
      return { url: '', error: 'No se pudo obtener la URL de la imagen' }
    }

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { 
      url: '', 
      error: error instanceof Error ? error.message : 'Error desconocido al subir imagen' 
    }
  }
}
