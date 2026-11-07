export const MAX_UNITS_PER_BOX = 2147483647

type BoxProduct = { unit: string | string[]; units_per_box?: number | null; allow_half_box?: boolean }

export function customerSaleUnits(product: BoxProduct): string[] {
  const units = Array.isArray(product.unit) ? product.unit : [product.unit]
  return [...new Set(['unidad', ...(units.includes('caja') ? ['caja', ...(product.allow_half_box === true ? ['media_caja'] : [])] : []), ...(units.includes('funda') ? ['funda'] : [])])]
}

export function saleUnitLabel(unit: string): string {
  if (unit === 'media_caja') return '1/2 caja'
  if (unit === 'caja') return '1 caja'
  return `Por ${unit}`
}

export function saleQuantityLabel(unit: string, quantity: number): string {
  if (unit === 'media_caja') return quantity === 1 ? 'media caja' : 'medias cajas'
  if (unit === 'unidad') return quantity === 1 ? 'unidad' : 'unidades'
  if (unit === 'caja') return quantity === 1 ? 'caja' : 'cajas'
  if (unit === 'funda') return quantity === 1 ? 'funda' : 'fundas'
  return unit
}

export function getUnitsPerBox(product: BoxProduct): number | null {
  const units = Array.isArray(product.unit) ? product.unit : [product.unit]
  const count = product.units_per_box
  return (units.includes('caja') || units.includes('media_caja')) && typeof count === 'number' && Number.isInteger(count) && count > 0 && count <= MAX_UNITS_PER_BOX ? count : null
}

export function describeBoxContents(product: BoxProduct, quantity = 1, saleUnit = 'caja'): string | null {
  if (saleUnit !== 'caja' && saleUnit !== 'media_caja') return null
  const count = getUnitsPerBox(product)
  if (count === null) return null
  if (saleUnit === 'media_caja') {
    // No adivinar cómo se fracciona una caja con una cantidad impar de unidades.
    if (count % 2 !== 0) return `Media caja; la caja completa contiene ${count} unidades`
    const half = count / 2
    const perHalf = `${half} ${half === 1 ? 'unidad' : 'unidades'} por media caja`
    const halfTotal = half * quantity
    return quantity > 1 && Number.isSafeInteger(halfTotal) ? `${perHalf}; ${halfTotal} unidades en total` : perHalf
  }
  const perBox = `${count} ${count === 1 ? 'unidad' : 'unidades'} por caja cerrada`
  const total = count * quantity
  return quantity > 1 && Number.isSafeInteger(total) ? `${perBox}; ${total} unidades en total` : perBox
}

export function isMissingBoxUnitsColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && ['42703', 'PGRST204'].includes(error.code || '') && error.message?.includes('units_per_box'))
}

export function isMissingHalfBoxColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && ['42703', 'PGRST204'].includes(error.code || '') && error.message?.includes('allow_half_box'))
}
