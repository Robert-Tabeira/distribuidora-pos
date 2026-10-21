import Image, { type ImageProps } from 'next/image'

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
  // Keep manual <picture><source> requests within Next's configured device widths.
  const allowedWidths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  const validWidth = allowedWidths.reduce((closest, candidate) =>
    Math.abs(candidate - width) < Math.abs(closest - width) ? candidate : closest
  )
  return `/_next/image?url=${encodeURIComponent(src)}&w=${validWidth}&q=75`
}

type SiteImageProps = Omit<ImageProps, 'src'> & { src: string }

/** Optimizes existing public Supabase images through Next/Vercel's image cache. */
export function SiteImage({ src, unoptimized, ...props }: SiteImageProps) {
  const optimize = !unoptimized && isOptimizableStorageImage(src)
  const callerOnError = props.onError
  return <Image
    src={src}
    unoptimized={unoptimized ?? !isOptimizableStorageImage(src)}
    {...props}
    onError={event => {
      callerOnError?.(event)
      const image = event.currentTarget
      if (optimize && image.dataset.originalFallback !== 'true') {
        image.dataset.originalFallback = 'true'
        image.removeAttribute('srcset')
        image.src = src
      }
    }}
  />
}
