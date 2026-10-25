export const MAX_UNITS_PER_BOX = 2147483647

type BoxProduct = { unit: string | string[]; units_per_box?: number | null }

export function getUnitsPerBox(product: BoxProduct): number | null {
  const units = Array.isArray(product.unit) ? product.unit : [product.unit]
  const count = product.units_per_box
  return units.includes('caja') && typeof count === 'number' && Number.isInteger(count) && count > 0 && count <= MAX_UNITS_PER_BOX ? count : null
}

export function describeBoxContents(product: BoxProduct, quantity = 1): string | null {
  const count = getUnitsPerBox(product)
  if (count === null) return null
  const perBox = `${count} ${count === 1 ? 'unidad' : 'unidades'} por caja cerrada`
  const total = count * quantity
  return quantity > 1 && Number.isSafeInteger(total) ? `${perBox}; ${total} unidades en total` : perBox
}

export function isMissingBoxUnitsColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && ['42703', 'PGRST204'].includes(error.code || '') && error.message?.includes('units_per_box'))
}
