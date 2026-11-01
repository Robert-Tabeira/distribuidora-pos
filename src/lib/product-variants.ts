export interface ProductVariant { id: string; name: string; is_active: boolean }
export type VariantProduct = { variants?: unknown }
export const MAX_PRODUCT_VARIANTS = 50
export const MAX_VARIANT_NAME = 80
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i

export function productVariants(product: VariantProduct): ProductVariant[] {
  if (!Array.isArray(product.variants)) return []
  return product.variants.filter((value): value is ProductVariant => Boolean(value && typeof value.id === 'string' && UUID.test(value.id) && typeof value.name === 'string' && value.name.trim() && typeof value.is_active === 'boolean'))
}

export function activeProductVariants(product: VariantProduct): ProductVariant[] {
  return productVariants(product).filter(variant => variant.is_active)
}

export function validProductVariant(product: VariantProduct, id?: string | null): boolean {
  return productVariants(product).length ? activeProductVariants(product).some(variant => variant.id === id) : !id
}

export function productVariantName(product: VariantProduct, id?: string | null, fallback = ''): string {
  return productVariants(product).find(variant => variant.id === id)?.name || fallback || (id ? 'Variante no disponible' : '')
}

export function productVariantsError(variants: ProductVariant[]): string {
  if (variants.length > MAX_PRODUCT_VARIANTS) return `Podés agregar hasta ${MAX_PRODUCT_VARIANTS} variantes.`
  if (variants.some(variant => !UUID.test(variant.id) || !variant.name.trim() || variant.name.trim().length > MAX_VARIANT_NAME)) return `Cada variante necesita un nombre de hasta ${MAX_VARIANT_NAME} caracteres.`
  const names = variants.map(variant => variant.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
  if (new Set(names).size !== names.length) return 'Las variantes de un producto deben tener nombres diferentes.'
  if (new Set(variants.map(variant => variant.id)).size !== variants.length) return 'Hay variantes duplicadas. Volvé a abrir el producto.'
  return ''
}

export function isMissingVariantsColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && ['42703', 'PGRST204'].includes(error.code || '') && error.message?.includes('variants'))
}
