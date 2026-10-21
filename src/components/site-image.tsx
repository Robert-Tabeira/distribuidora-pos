import Image, { type ImageProps } from 'next/image'
import { isOptimizableStorageImage } from '@/lib/site-image-url'
export { isOptimizableStorageImage, optimizedImageSource, optimizedImageSourceSet } from '@/lib/site-image-url'

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
        image.closest('picture')?.querySelectorAll<HTMLSourceElement>('source[data-original-src]').forEach(source => {
          source.srcset = source.dataset.originalSrc || ''
        })
        image.src = src
      }
    }}
  />
}
