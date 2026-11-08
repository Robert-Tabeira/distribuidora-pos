import type { ProductVariant } from '@/lib/product-variants'
import { customerSaleUnits } from '@/lib/product-packaging'

export interface ShoppingListItem {
  product_id: string
  product_name: string
  quantity: number
  unit?: string
  notes?: string
  variant_id?: string | null
  variant_name?: string
  units_per_box?: number | null
  units_per_bag?: number | null
  image_url?: string | null
}

export interface SavedShoppingList {
  id: string
  name: string
  created_at: string
  updated_at: string
  items: ShoppingListItem[]
}

export interface ListCatalogProduct {
  id: string
  name: string
  units: string[]
  units_per_box: number | null
  units_per_bag?: number | null
  allow_half_box?: boolean
  allow_half_wheel?: boolean
  image_url: string | null
  variants?: ProductVariant[]
}

export function listProductUnits(product: ListCatalogProduct): string[] {
  return customerSaleUnits({ unit: product.units, allow_half_box: product.allow_half_box, allow_half_wheel: product.allow_half_wheel })
}

export function shoppingListDate(value: string): string {
  return new Date(value).toLocaleDateString('es-UY', { timeZone: 'America/Montevideo', day: 'numeric', month: 'short', year: 'numeric' })
}

export function shoppingListTitle(list: SavedShoppingList): string {
  return list.name?.trim() || `Pedido del ${shoppingListDate(list.created_at)}`
}
