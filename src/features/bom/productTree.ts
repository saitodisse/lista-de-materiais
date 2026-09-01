import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { formatCurrency, formatNumber } from '../../components/format'

export type ProductTreeExpansion = 'one-layer' | 'full'
export type ProductTreeUnit = 'kg' | 'g'

export function roundProductTreeValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000) / 100_000
}

export function roundProductTreeDisplayValue(value: number, quantityUnit?: string): number {
  if (quantityUnit !== 'G') return roundProductTreeValue(value)
  return Math.round((value + Number.EPSILON) * 10) / 10
}

export function formatProductTreeQuantity(value: number, quantityUnit?: string): string {
  const isGrams = quantityUnit === 'G'
  return formatNumber(roundProductTreeDisplayValue(value, quantityUnit), { minimumFractionDigits: isGrams ? 1 : 0, maximumFractionDigits: isGrams ? 1 : 5 })
}

export function formatProductTreeInput(value: number, quantityUnit?: string): string {
  return formatProductTreeQuantity(value, quantityUnit)
}

export function parseProductTreeInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '')
  if (!normalized) return Number.NaN

  if (normalized.includes(',')) {
    return Number(normalized.replace(/\./g, '').replace(',', '.'))
  }

  if (/^\d{1,3}(?:\.\d{3})+$/.test(normalized)) {
    return Number(normalized.replace(/\./g, ''))
  }

  return Number(normalized)
}

export function displayProductTreeQuantity(node: ITreeNode, unit: ProductTreeUnit): { value: number; unit: string } {
  return convertProductTreeQuantity(node.calculatedQuantity, node.unit, unit)
}

export function convertProductTreeQuantity(value: number, productUnit: string, unit: ProductTreeUnit): { value: number; unit: string } {
  if (unit === 'g' && productUnit === 'KG') return { value: value * 1000, unit: 'G' }
  return { value, unit: productUnit }
}

export function flattenProductTree(node: ITreeNode, expansion: ProductTreeExpansion = 'full'): ITreeNode[] {
  const children = expansion === 'full' || node.level === 0 ? Object.values(node.children ?? {}) : []
  return [node, ...children.flatMap((child) => flattenProductTree(child, expansion))]
}

function spreadsheetCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ')
}

export function productTreeToSpreadsheet(tree: ITreeNode, options: { showCost?: boolean; unit?: ProductTreeUnit; expansion?: ProductTreeExpansion } = {}): string {
  const { showCost = true, unit = 'kg', expansion = 'full' } = options
  const rows = flattenProductTree(tree, expansion).map((node) => {
    const displayQuantity = displayProductTreeQuantity(node, unit)
    const row = [
    `${'  '.repeat(node.level)}${node.name}`,
    node.id,
    formatProductTreeQuantity(displayQuantity.value, displayQuantity.unit),
    displayQuantity.unit,
    ]
    if (showCost) row.push(node.calculatedCost === null ? '—' : formatCurrency(node.calculatedCost))
    return row
  })
  const header = ['Produto', 'Código', 'Quantidade', 'Unidade']
  if (showCost) header.push('Custo')
  return [header, ...rows]
    .map((row) => row.map(spreadsheetCell).join('\t'))
    .join('\n')
}
