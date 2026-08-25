import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { formatCurrency } from '../../components/format'

export type ProductTreeExpansion = 'one-layer' | 'full'
export type ProductTreeUnit = 'kg' | 'g'

export function roundProductTreeValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000) / 100_000
}

export function formatProductTreeQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 5 }).format(roundProductTreeValue(value))
}

export function formatProductTreeInput(value: number): string {
  return roundProductTreeValue(value).toFixed(5).replace(/\.?0+$/, '')
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
    formatProductTreeQuantity(displayQuantity.value),
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
