import { categoryOptions, unitOptions } from '../domain/catalog'

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('pt-BR', options).format(value)
}

export const formatQuantity = (value: number): string =>
  formatNumber(value, { maximumFractionDigits: 3 })

export const formatCurrency = (value: number): string =>
  formatNumber(value, { style: 'currency', currency: 'BRL' })

export function categoryName(id: string): string {
  return categoryOptions.find((category) => category.id === id)?.descriptionPtBr ?? id
}

export function unitName(id: string): string {
  return unitOptions.find((unit) => unit.id === id)?.descriptionPtBr ?? id
}
