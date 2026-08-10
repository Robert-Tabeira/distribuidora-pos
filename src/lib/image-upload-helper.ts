import { supabase } from '@/lib/supabase'

export async function uploadImageToSupabase(
  file: File,
  folder: string = 'hero-images'
): Promise<{ url: string; error: string | null }> {
  try {
    // Validar archivo
    if (!file) {
      return { url: '', error: 'No file selected' }
    }

    if (!file.type.startsWith('image/')) {
      return { url: '', error: 'El archivo debe ser una imagen (JPG, PNG, WebP, etc)' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { url: '', error: 'La imagen no puede pesar más de 5MB' }
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${random}.${extension}`
    const filePath = `${folder}/${fileName}`

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
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
