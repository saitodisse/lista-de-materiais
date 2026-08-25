import { categoryOptions, unitOptions } from '../domain/catalog'

export const formatQuantity = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value)

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function categoryName(id: string): string {
  return categoryOptions.find((category) => category.id === id)?.descriptionPtBr ?? id
}

export function unitName(id: string): string {
  return unitOptions.find((unit) => unit.id === id)?.descriptionPtBr ?? id
}
