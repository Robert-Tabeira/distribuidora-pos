import type { IconName } from '@/components/ui/icon'

export const CATEGORY_ICON_OPTIONS: { name: IconName; label: string }[] = [
  { name: 'box', label: 'Caja / general' },
  { name: 'store', label: 'Comercio' },
  { name: 'meat', label: 'Carnes y fiambres' },
  { name: 'chicken', label: 'Aves' },
  { name: 'fish', label: 'Pescados' },
  { name: 'cheese', label: 'Quesos' },
  { name: 'milk', label: 'Lácteos' },
  { name: 'bread', label: 'Panificados' },
  { name: 'bottle', label: 'Bebidas' },
  { name: 'coffee', label: 'Café e infusiones' },
  { name: 'carrot', label: 'Frutas y verduras' },
  { name: 'snowflake', label: 'Congelados' },
  { name: 'cleaning', label: 'Limpieza' },
  { name: 'home', label: 'Hogar' },
  { name: 'tag', label: 'Ofertas' },
  { name: 'grid', label: 'Categoría general' }
]

export function getCategoryIconName(categoryName: string, customIcon?: string): IconName {
  if (customIcon && CATEGORY_ICON_OPTIONS.some(option => option.name === customIcon)) return customIcon as IconName

  const name = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/carne|hamburg|embutido|fiambre|chacinado|cerdo|vacun/.test(name)) return 'meat'
  if (/ave|pollo|pavo|suprema/.test(name)) return 'chicken'
  if (/pesc|marisco|atun|salmon/.test(name)) return 'fish'
  if (/ques|lact|leche|yogur|manteca/.test(name)) return /ques/.test(name) ? 'cheese' : 'milk'
  if (/pan|harina|panific|gallet/.test(name)) return 'bread'
  if (/bebida|refresco|agua|jugo|gaseosa/.test(name)) return 'bottle'
  if (/cafe|te |infusion|yerba/.test(name)) return 'coffee'
  if (/fruta|verdura|vegetal|hortaliza/.test(name)) return 'carrot'
  if (/congel|helado|friz|freez/.test(name)) return 'snowflake'
  if (/limpieza|higiene|detergente/.test(name)) return 'cleaning'
  if (/hogar|bazar|cocina/.test(name)) return 'home'
  if (/oferta|promo|descuento/.test(name)) return 'tag'
  return 'box'
}
