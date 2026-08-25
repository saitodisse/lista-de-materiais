import {
  ProductCategory,
  ProductUnit,
  type IProduct,
  type IRecipeItem,
} from '@saitodisse/bom-recipe-calculator'
import { z } from 'zod'

export interface ProductRecord extends IProduct {
  id: string
  productCode: string
  imageUrl: null
  saleValue: number | null
  preparation: string | null
  createdAt: string
  updatedAt: string
}

export interface MaterialList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface MaterialListEntry {
  listId: string
  productCode: string
  quantity: number
}

export interface LocalDataExport {
  format: 'lista-de-materiais'
  version: 1
  exportedAt: string
  products: ProductRecord[]
  materialLists: MaterialList[]
  materialListEntries: MaterialListEntry[]
}

export const categoryOptions = Object.values(ProductCategory)
  .filter((category) => category.id !== 'l')
  .map((category) => category.id === 'c' ? { ...category, description: 'Other', descriptionPtBr: 'Outros' } : category)
export const unitOptions = Object.values(ProductUnit)

const productSelectionCategoryOrder = ['p', 'u', 's', 'm', 'e', 'c'] as const
const productSelectionCategoryRank = new Map<string, number>(productSelectionCategoryOrder.map((category, index) => [category, index]))
const productSelectionCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', usage: 'sort' })

export class DomainValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(issues.join(' '))
    this.name = 'DomainValidationError'
    this.issues = issues
  }
}

export class ProductDependencyError extends Error {
  readonly dependencies: ProductDependencies

  constructor(dependencies: ProductDependencies) {
    super('Este produto ainda é usado por outros registros.')
    this.name = 'ProductDependencyError'
    this.dependencies = dependencies
  }
}

const importedProductSchema = z.object({
  id: z.string().min(1),
  productCode: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  weight: z.number().finite().nullable().optional(),
  purchaseQuoteValue: z.number().finite().nullable().optional(),
  saleValue: z.number().finite().nullable().optional(),
  notes: z.string().nullable().optional(),
  preparation: z.string().nullable().optional(),
  recipe: z.array(z.object({ id: z.string(), quantity: z.number().finite() })).nullable().optional(),
  imageUrl: z.null().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

const localDataExportSchema = z.object({
  format: z.literal('lista-de-materiais'),
  version: z.literal(1),
  exportedAt: z.string().min(1),
  products: z.array(importedProductSchema),
  materialLists: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), createdAt: z.string().min(1), updatedAt: z.string().min(1) })),
  materialListEntries: z.array(z.object({ listId: z.string().min(1), productCode: z.string().min(1), quantity: z.number().finite() })),
})

export interface ProductDependencies {
  recipes: ProductRecord[]
  lists: MaterialList[]
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function newLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function normalizeProductCategory(category: string): ProductRecord['category'] {
  return (category === 'l' ? 'c' : category) as ProductRecord['category']
}

export function productMap(products: ProductRecord[]): Record<string, IProduct> {
  return Object.fromEntries(products.map((product) => [product.productCode, product]))
}

export function findRecipeIssues(
  draft: Pick<ProductRecord, 'productCode' | 'recipe'>,
  products: ProductRecord[],
): string[] {
  const issues: string[] = []
  const productCode = slugify(draft.productCode)
  const recipe = draft.recipe ?? []
  const seen = new Set<string>()
  const catalogue = productMap(products)

  for (const component of recipe) {
    if (!component.id || !catalogue[component.id]) {
      issues.push(`O componente “${component.id || 'sem código'}” não existe no catálogo.`)
    }
    if (!Number.isFinite(component.quantity) || component.quantity <= 0) {
      issues.push(`A quantidade de “${component.id || 'componente'}” deve ser maior que zero.`)
    }
    if (seen.has(component.id)) {
      issues.push(`O componente “${component.id}” aparece mais de uma vez na receita.`)
    }
    if (component.id === productCode) {
      issues.push('Um Produto não pode usar a si mesmo na própria receita.')
    }
    seen.add(component.id)
  }

  if (!productCode) {
    return [...issues, 'Informe um código de Produto válido.']
  }

  const candidate = {
    ...catalogue,
    [productCode]: {
      ...(catalogue[productCode] ?? {}),
      productCode,
      recipe,
    },
  } as Record<string, Pick<IProduct, 'recipe'>>

  const visit = (code: string, path: string[]): void => {
    if (path.includes(code)) {
      issues.push(`A receita cria um ciclo: ${[...path, code].join(' → ')}.`)
      return
    }

    for (const item of candidate[code]?.recipe ?? []) {
      if (candidate[item.id]) {
        visit(item.id, [...path, code])
      }
    }
  }

  visit(productCode, [])
  return [...new Set(issues)]
}

export function validateProductRecord(product: ProductRecord, products: ProductRecord[]): void {
  const issues: string[] = []

  if (product.id !== product.productCode) {
    issues.push('O id deve ser igual ao código do Produto.')
  }
  if (!product.productCode || product.productCode !== slugify(product.productCode)) {
    issues.push('O código deve ser um slug em minúsculas com hífens.')
  }
  if (!product.name.trim()) {
    issues.push('Informe o nome do Produto.')
  }
  if (!categoryOptions.some((category) => category.id === product.category)) {
    issues.push('Selecione uma categoria válida.')
  }
  if (!unitOptions.some((unit) => unit.id === product.unit)) {
    issues.push('Selecione uma unidade válida.')
  }
  const weight = product.weight ?? null
  const purchaseQuoteValue = product.purchaseQuoteValue ?? null
  const saleValue = product.saleValue ?? null
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
    issues.push('O peso deve ser maior que zero quando informado.')
  }
  if (
    purchaseQuoteValue !== null &&
    (!Number.isFinite(purchaseQuoteValue) || purchaseQuoteValue < 0)
  ) {
    issues.push('O custo de compra não pode ser negativo.')
  }
  if (saleValue !== null && (!Number.isFinite(saleValue) || saleValue < 0)) {
    issues.push('O valor de venda não pode ser negativo.')
  }

  const sameCode = products.find((item) => item.productCode === product.productCode)
  if (sameCode && sameCode.id !== product.id) {
    issues.push('Já existe um Produto com esse código.')
  }

  issues.push(...findRecipeIssues(product, products.filter((item) => item.id !== product.id)))
  if (issues.length > 0) {
    throw new DomainValidationError(issues)
  }
}

export function validateMaterialList(
  list: MaterialList,
  entries: MaterialListEntry[],
  products: ProductRecord[],
): void {
  const issues: string[] = []
  const available = new Set(products.map((product) => product.productCode))
  const codes = new Set<string>()

  if (!list.name.trim()) {
    issues.push('Informe o nome da Lista de Materiais.')
  }
  if (entries.length === 0) {
    issues.push('Inclua ao menos um Produto na Lista de Materiais.')
  }
  for (const entry of entries) {
    if (!available.has(entry.productCode)) {
      issues.push(`O Produto “${entry.productCode}” não existe no catálogo.`)
    }
    if (codes.has(entry.productCode)) {
      issues.push(`O Produto “${entry.productCode}” aparece mais de uma vez na lista.`)
    }
    if (!Number.isFinite(entry.quantity) || entry.quantity <= 0) {
      issues.push(`A quantidade de “${entry.productCode}” deve ser maior que zero.`)
    }
    codes.add(entry.productCode)
  }
  if (issues.length > 0) {
    throw new DomainValidationError(issues)
  }
}

export function parseLocalDataExport(value: unknown): LocalDataExport {
  const parsed = localDataExportSchema.safeParse(value)
  if (!parsed.success) {
    throw new DomainValidationError(['O arquivo não está no formato de exportação da Lista de Materiais.'])
  }

  return {
    ...parsed.data,
    products: parsed.data.products.map((product) => ({
      ...product,
      category: normalizeProductCategory(product.category),
      weight: product.weight ?? null,
      purchaseQuoteValue: product.purchaseQuoteValue ?? null,
      saleValue: product.saleValue ?? null,
      notes: product.notes ?? null,
      preparation: product.preparation ?? null,
      recipe: product.recipe ?? null,
      imageUrl: null,
    })) as ProductRecord[],
  }
}

export function validateLocalDataExport(data: LocalDataExport): void {
  const issues: string[] = []
  const listIds = new Set<string>()

  for (const product of data.products) {
    try {
      validateProductRecord(product, data.products)
    } catch (error) {
      if (error instanceof DomainValidationError) issues.push(...error.issues)
      else throw error
    }
  }

  for (const list of data.materialLists) {
    if (listIds.has(list.id)) issues.push(`A Lista “${list.name}” aparece mais de uma vez no arquivo.`)
    listIds.add(list.id)
  }

  for (const entry of data.materialListEntries) {
    if (!listIds.has(entry.listId)) issues.push(`A entrada “${entry.productCode}” referencia uma Lista inexistente.`)
  }

  for (const list of data.materialLists) {
    try {
      validateMaterialList(list, data.materialListEntries.filter((entry) => entry.listId === list.id), data.products)
    } catch (error) {
      if (error instanceof DomainValidationError) issues.push(...error.issues)
      else throw error
    }
  }

  if (issues.length > 0) throw new DomainValidationError([...new Set(issues)])
}

export function productLabel(product: Pick<ProductRecord, 'name' | 'productCode'>): string {
  return `${product.name} · ${product.productCode}`
}

export function productSelectionLabel(product: ProductRecord): string {
  const category = categoryOptions.find((item) => item.id === product.category)
  return `${product.name} · ${category?.descriptionPtBr ?? product.category} · ${product.productCode}`
}

export function sortProductsForSelection(products: ProductRecord[]): ProductRecord[] {
  return [...products].sort((left, right) => {
    const categoryDifference = (productSelectionCategoryRank.get(left.category) ?? productSelectionCategoryOrder.length) - (productSelectionCategoryRank.get(right.category) ?? productSelectionCategoryOrder.length)
    if (categoryDifference !== 0) return categoryDifference

    const nameDifference = productSelectionCollator.compare(left.name, right.name)
    return nameDifference !== 0 ? nameDifference : productSelectionCollator.compare(left.productCode, right.productCode)
  })
}

export function emptyRecipe(): IRecipeItem[] | null {
  return null
}
