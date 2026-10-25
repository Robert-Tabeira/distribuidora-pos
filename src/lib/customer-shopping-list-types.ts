export interface ShoppingListItem {
  product_id: string
  product_name: string
  quantity: number
  unit?: string
  notes?: string
  units_per_box?: number | null
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
  image_url: string | null
}

export function listProductUnits(product: ListCatalogProduct): string[] {
  return [...new Set(['unidad', ...product.units.filter(unit => unit === 'caja' || unit === 'funda')])]
}

export function shoppingListDate(value: string): string {
  return new Date(value).toLocaleDateString('es-UY', { timeZone: 'America/Montevideo', day: 'numeric', month: 'short', year: 'numeric' })
}

export function shoppingListTitle(list: SavedShoppingList): string {
  return list.name?.trim() || `Pedido del ${shoppingListDate(list.created_at)}`
}
