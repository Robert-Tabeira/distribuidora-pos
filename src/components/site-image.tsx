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
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}

type SiteImageProps = Omit<ImageProps, 'src'> & { src: string }

/** Optimizes existing public Supabase images through Next/Vercel's image cache. */
export function SiteImage({ src, unoptimized, ...props }: SiteImageProps) {
  return <Image src={src} unoptimized={unoptimized ?? !isOptimizableStorageImage(src)} {...props} />
}
