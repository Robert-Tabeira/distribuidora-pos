const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname
  } catch {
    return ''
  }
})()

export function isOptimizableStorageImage(src: string) {
  try {
    const url = new URL(src)
    return Boolean(
      supabaseHost &&
      url.hostname === supabaseHost &&
      url.pathname.includes('/storage/v1/object/public/')
    )
  } catch {
    return false
  }
}

export function optimizedImageSource(src: string, width: number) {
  if (!isOptimizableStorageImage(src)) return src
  // Match Next's default imageSizes and deviceSizes, including small icon widths.
  const allowedWidths = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  const validWidth = allowedWidths.find(candidate => candidate >= width) || allowedWidths[allowedWidths.length - 1]
  return `/_next/image?url=${encodeURIComponent(src)}&w=${validWidth}&q=75`
}
