import { MaterialsTreeBuilder, type IProduct, type ITreeNode } from '@saitodisse/bom-recipe-calculator'
import type { MaterialListEntry, ProductRecord } from '../../domain/catalog'
import { productMap } from '../../domain/catalog'

export interface TerminalMaterial {
  productCode: string
  name: string
  unit: string
  quantity: number
  purchaseCost: number | null
  weightKg: number | null
}

export interface BomCalculation {
  trees: Array<{ entry: MaterialListEntry; root: ITreeNode }>
  materials: TerminalMaterial[]
  totalPurchaseCost: number | null
  totalSaleValue: number | null
}

function terminalNodes(node: ITreeNode): ITreeNode[] {
  const children = Object.values(node.children ?? {})
  return children.length === 0 ? [node] : children.flatMap(terminalNodes)
}

function buildEntryTree(products: ProductRecord[], entry: MaterialListEntry, index: number): ITreeNode {
  const catalogue = productMap(products)
  const product = catalogue[entry.productCode]
  if (!product) {
    throw new Error(`O Produto “${entry.productCode}” não existe no catálogo.`)
  }

  // A raiz efêmera faz o cálculo da quantidade também para Produtos sem Receita.
  // Ela nunca é persistida nem aparece na árvore apresentada.
  const requestCode = `__entrada-${index}`
  const request: IProduct = {
    id: requestCode,
    productCode: requestCode,
    name: product.name,
    category: product.category,
    unit: product.unit,
    weight: null,
    purchaseQuoteValue: null,
    notes: null,
    imageUrl: null,
    recipe: [{ id: entry.productCode, quantity: entry.quantity }],
  }
  const tree = new MaterialsTreeBuilder({
    productsList: { ...catalogue, [requestCode]: request },
    productCode: requestCode,
    initialQuantity: 1,
  }).build()
  const requestRoot = Object.values(tree)[0]
  const root = Object.values(requestRoot?.children ?? {})[0]
  if (!root) {
    throw new Error(`Não foi possível construir a BOM de “${entry.productCode}”.`)
  }
  return root.toObject()
}

export function calculateBom(products: ProductRecord[], entries: MaterialListEntry[]): BomCalculation {
  const saleValueByProductCode = new Map(products.map((product) => [product.productCode, product.saleValue]))
  const trees = entries.map((entry, index) => ({ entry, root: buildEntryTree(products, entry, index) }))
  const materials = new Map<string, TerminalMaterial>()
  let totalPurchaseCost = 0
  let totalSaleValue = 0
  let hasPurchaseCost = false
  let hasSaleValue = false

  for (const { entry, root } of trees) {
    const saleValue = saleValueByProductCode.get(entry.productCode)
    if (saleValue !== null && saleValue !== undefined && Number.isFinite(saleValue)) {
      totalSaleValue += saleValue * entry.quantity
      hasSaleValue = true
    }

    for (const terminal of terminalNodes(root)) {
      const previous = materials.get(terminal.id)
      const purchaseCost = terminal.unitCost === null ? null : terminal.calculatedCost
      const weightKg = terminal.unit === 'KG' || terminal.weight > 0 ? terminal.weight : null
      materials.set(terminal.id, {
        productCode: terminal.id,
        name: terminal.name,
        unit: terminal.unit,
        quantity: (previous?.quantity ?? 0) + terminal.calculatedQuantity,
        purchaseCost: previous?.purchaseCost === null || purchaseCost === null ? null : (previous?.purchaseCost ?? 0) + purchaseCost,
        weightKg: previous?.weightKg === null || weightKg === null ? null : (previous?.weightKg ?? 0) + weightKg,
      })
      if (purchaseCost !== null) {
        totalPurchaseCost += purchaseCost
        hasPurchaseCost = true
      }
    }
  }

  return {
    trees,
    materials: [...materials.values()].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
    totalPurchaseCost: hasPurchaseCost ? totalPurchaseCost : null,
    totalSaleValue: hasSaleValue ? totalSaleValue : null,
  }
}
