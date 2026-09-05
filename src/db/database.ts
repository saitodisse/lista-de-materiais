import Dexie, { type EntityTable, type Table } from 'dexie'
import {
  type MaterialList,
  type MaterialListEntry,
  ProductDependencyError,
  parseLocalDataExport,
  type LocalDataExport,
  normalizeProductCategory,
  type ProductDependencies,
  type ProductRecord,
  validateLocalDataExport,
  validateMaterialList,
  validateProductRecord,
} from '../domain/catalog'
import {
  createDemoProducts,
  DEMO_LIST_ID,
  DEMO_LIST_NAME,
  DEMO_LIST_PRODUCT_CODE,
  DEMO_LIST_QUANTITY,
  DEMO_PRODUCT_CODES,
} from '../features/demo/demoData'

interface MetaRecord {
  key: string
  value: string
}

export interface DriveSyncRecord {
  key: 'active'
  fileId: string
  link: string
  resourceKey: string | null
  fileName: string | null
  accountEmail: string | null
  canDownload?: boolean | null
  canModifyContent?: boolean | null
  linkedAt: string
  lastRemoteModifiedTime: string | null
  lastRemoteCheckedAt: string | null
  lastUploadedAt: string | null
  lastDownloadedAt: string | null
  lastObservedFingerprint: string | null
  lastObservedVersion: string | null
  lastSyncedFingerprint: string | null
}

class MaterialsDatabase extends Dexie {
  products!: EntityTable<ProductRecord, 'id'>
  materialLists!: EntityTable<MaterialList, 'id'>
  materialListEntries!: Table<MaterialListEntry, [string, string]>
  meta!: EntityTable<MetaRecord, 'key'>
  driveSync!: EntityTable<DriveSyncRecord, 'key'>

  constructor() {
    super('lista-de-materiais')
    this.version(1).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    })
    this.version(2).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    })
    this.version(3).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    }).upgrade(async (transaction) => {
      await transaction.table('products').toCollection().modify((product) => {
        product.saleValue ??= null
      })
      const demoState = await transaction.table('meta').get('demo-state') as MetaRecord | undefined
      if (demoState?.value === 'inserted') {
        await transaction.table('products').update('pao-integral', { saleValue: 18 })
      }
    })
    this.version(4).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    }).upgrade(async (transaction) => {
      const products = transaction.table('products')
      await products.toCollection().modify((product) => {
        product.preparation ??= null
      })

      const [demo, storedProducts, storedLists, storedEntries] = await Promise.all([
        transaction.table('meta').get('demo-state') as Promise<MetaRecord | undefined>,
        products.toArray() as Promise<ProductRecord[]>,
        transaction.table('materialLists').toArray() as Promise<MaterialList[]>,
        transaction.table('materialListEntries').toArray() as Promise<MaterialListEntry[]>,
      ])
      if (demo?.value !== 'inserted' || !isLegacyBreadDemo(storedProducts, storedLists, storedEntries)) return

      const now = new Date().toISOString()
      await transaction.table('materialListEntries').clear()
      await transaction.table('materialLists').clear()
      await products.clear()
      await products.bulkAdd(createDemoProducts(now))
      await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now })
      await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY })
    })
    this.version(5).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    }).upgrade(async (transaction) => {
      const products = transaction.table('products')
      const [demo, storedProducts, storedLists, storedEntries] = await Promise.all([
        transaction.table('meta').get('demo-state') as Promise<MetaRecord | undefined>,
        products.toArray() as Promise<ProductRecord[]>,
        transaction.table('materialLists').toArray() as Promise<MaterialList[]>,
        transaction.table('materialListEntries').toArray() as Promise<MaterialListEntry[]>,
      ])
      if (demo?.value !== 'inserted' || !isPizzaDemo(storedProducts, storedLists, storedEntries)) return

      const now = new Date().toISOString()
      await transaction.table('materialListEntries').clear()
      await transaction.table('materialLists').clear()
      await products.clear()
      await products.bulkAdd(createDemoProducts(now))
      await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now })
      await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY })
    })
    this.version(6).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
    }).upgrade(async (transaction) => {
      await transaction.table('products').where('category').equals('l').modify((product) => {
        product.category = normalizeProductCategory(product.category)
      })
    })
    this.version(7).stores({
      products: 'id, productCode, name, category',
      materialLists: 'id, name, updatedAt',
      materialListEntries: '[listId+productCode], listId, productCode',
      meta: 'key',
      driveSync: 'key',
    })
  }
}

export const db = new MaterialsDatabase()

const LEGACY_DEMO_LIST_ID = 'demo-lista-pao-integral'
const LEGACY_DEMO_CODES = ['farinha-integral', 'agua-filtrada', 'fermento-biologico', 'massa-integral', 'saco-papel', 'pao-integral']

function isLegacyBreadDemo(products: ProductRecord[], lists: MaterialList[], entries: MaterialListEntry[]): boolean {
  return products.length === LEGACY_DEMO_CODES.length &&
    products.every((product) => LEGACY_DEMO_CODES.includes(product.productCode)) &&
    lists.length === 1 &&
    lists[0]?.id === LEGACY_DEMO_LIST_ID &&
    entries.length === 1 &&
    entries[0]?.listId === LEGACY_DEMO_LIST_ID &&
    entries[0]?.productCode === 'pao-integral'
}

function isPizzaDemo(products: ProductRecord[], lists: MaterialList[], entries: MaterialListEntry[]): boolean {
  return products.length === DEMO_PRODUCT_CODES.length &&
    products.every((product) => DEMO_PRODUCT_CODES.includes(product.productCode as typeof DEMO_PRODUCT_CODES[number])) &&
    lists.length === 1 &&
    lists[0]?.id === DEMO_LIST_ID &&
    entries.length === 1 &&
    entries[0]?.listId === DEMO_LIST_ID &&
    entries[0]?.productCode === 'pacote-3-pizzas-mucarela'
}

export async function replaceAllWithDemo(): Promise<void> {
  await db.transaction('rw', db.products, db.materialLists, db.materialListEntries, db.meta, async () => {
    const now = new Date().toISOString()
    await db.materialListEntries.clear()
    await db.materialLists.clear()
    await db.products.clear()
    await db.meta.clear()
    await db.products.bulkAdd(createDemoProducts(now))
    await db.materialLists.add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now })
    await db.materialListEntries.add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY })
    await db.meta.put({ key: 'demo-state', value: 'inserted' })
  })
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', db.products, db.materialLists, db.materialListEntries, db.meta, async () => {
    await db.materialListEntries.clear()
    await db.materialLists.clear()
    await db.products.clear()
    await db.meta.clear()
    await db.meta.put({ key: 'demo-state', value: 'cleared' })
  })
}

export async function exportLocalData(): Promise<LocalDataExport> {
  return db.transaction('r', db.products, db.materialLists, db.materialListEntries, async () => {
    const [products, materialLists, materialListEntries] = await Promise.all([
      db.products.toArray(),
      db.materialLists.toArray(),
      db.materialListEntries.toArray(),
    ])
    return { format: 'lista-de-materiais', version: 1, exportedAt: new Date().toISOString(), products, materialLists, materialListEntries }
  })
}

export async function getDriveSync(): Promise<DriveSyncRecord | undefined> {
  return db.driveSync.get('active')
}

export async function saveDriveSync(record: DriveSyncRecord): Promise<void> {
  await db.driveSync.put(record)
}

export async function clearDriveSync(): Promise<void> {
  await db.driveSync.delete('active')
}

export async function importLocalData(value: unknown): Promise<void> {
  const data = parseLocalDataExport(value)
  validateLocalDataExport(data)

  await db.transaction('rw', db.products, db.materialLists, db.materialListEntries, db.meta, async () => {
    await db.materialListEntries.clear()
    await db.materialLists.clear()
    await db.products.clear()
    await db.meta.clear()
    await db.products.bulkAdd(data.products)
    await db.materialLists.bulkAdd(data.materialLists)
    await db.materialListEntries.bulkAdd(data.materialListEntries)
    await db.meta.put({ key: 'demo-state', value: 'imported' })
  })
}

export async function saveProduct(product: ProductRecord, previousCode?: string): Promise<void> {
  await db.transaction('rw', db.products, async () => {
    const allProducts = await db.products.toArray()
    if (previousCode && previousCode !== product.productCode) {
      throw new Error('O código do Produto não pode ser alterado depois da criação.')
    }
    validateProductRecord(product, allProducts)
    await db.products.put(product)
  })
}

export async function getProductDependencies(productCode: string): Promise<ProductDependencies> {
  const [products, entries, lists] = await Promise.all([
    db.products.toArray(),
    db.materialListEntries.where('productCode').equals(productCode).toArray(),
    db.materialLists.toArray(),
  ])
  const listIds = new Set(entries.map((entry) => entry.listId))
  return {
    recipes: products.filter((product) => product.recipe?.some((item) => item.id === productCode)),
    lists: lists.filter((list) => listIds.has(list.id)),
  }
}

export async function deleteProduct(productCode: string): Promise<void> {
  const dependencies = await getProductDependencies(productCode)
  if (dependencies.recipes.length > 0 || dependencies.lists.length > 0) {
    throw new ProductDependencyError(dependencies)
  }
  await db.products.delete(productCode)
}

export async function saveMaterialList(list: MaterialList, entries: MaterialListEntry[]): Promise<void> {
  await db.transaction('rw', db.materialLists, db.materialListEntries, db.products, async () => {
    validateMaterialList(list, entries, await db.products.toArray())
    await db.materialLists.put(list)
    await db.materialListEntries.where('listId').equals(list.id).delete()
    await db.materialListEntries.bulkPut(entries)
  })
}

export async function deleteMaterialList(listId: string): Promise<void> {
  await db.transaction('rw', db.materialLists, db.materialListEntries, async () => {
    await db.materialListEntries.where('listId').equals(listId).delete()
    await db.materialLists.delete(listId)
  })
}

export async function resetDatabaseForTest(): Promise<void> {
  await db.delete()
  await db.open()
}
