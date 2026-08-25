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

interface MetaRecord {
  key: string
  value: string
}

class MaterialsDatabase extends Dexie {
  products!: EntityTable<ProductRecord, 'id'>
  materialLists!: EntityTable<MaterialList, 'id'>
  materialListEntries!: Table<MaterialListEntry, [string, string]>
  meta!: EntityTable<MetaRecord, 'key'>

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
      await products.bulkAdd(demoProducts(now))
      await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: 'Pacote com 3 pizzas de muçarela', createdAt: now, updatedAt: now })
      await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: 'pacote-3-pizzas-mucarela', quantity: 1 })
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
      await products.bulkAdd(demoProducts(now))
      await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: 'Pacote com 3 pizzas de muçarela', createdAt: now, updatedAt: now })
      await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: 'pacote-3-pizzas-mucarela', quantity: 1 })
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
  }
}

export const db = new MaterialsDatabase()

const DEMO_LIST_ID = 'demo-lista-pacote-3-pizzas-mucarela'
const DEMO_CODES = [
  'farinha-de-trigo',
  'agua-morna',
  'fermento-biologico-seco',
  'acucar',
  'sal',
  'azeite',
  'tomate',
  'mucarela',
  'oregano',
  'massa-de-pizza',
  'molho-de-tomate',
  'pizza-de-mucarela',
  'caixa-para-3-pizzas',
  'pacote-3-pizzas-mucarela',
]
const LEGACY_DEMO_LIST_ID = 'demo-lista-pao-integral'
const LEGACY_DEMO_CODES = ['farinha-integral', 'agua-filtrada', 'fermento-biologico', 'massa-integral', 'saco-papel', 'pao-integral']

function demoProducts(now: string): ProductRecord[] {
  return [
    {
      id: 'farinha-de-trigo', productCode: 'farinha-de-trigo', name: 'Farinha de trigo',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 5.8, saleValue: null, notes: 'Base da massa de pizza.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'agua-morna', productCode: 'agua-morna', name: 'Água morna',
      category: 'm', unit: 'L', weight: 1, purchaseQuoteValue: 0.01, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'fermento-biologico-seco', productCode: 'fermento-biologico-seco', name: 'Fermento biológico seco',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 45, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'acucar', productCode: 'acucar', name: 'Açúcar',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 4.5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'sal', productCode: 'sal', name: 'Sal',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 3.2, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'azeite', productCode: 'azeite', name: 'Azeite',
      category: 'm', unit: 'L', weight: 0.92, purchaseQuoteValue: 35, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'tomate', productCode: 'tomate', name: 'Tomate',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 7.5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'mucarela', productCode: 'mucarela', name: 'Muçarela',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 42, saleValue: null, notes: 'Queijo ralado ou fatiado.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'oregano', productCode: 'oregano', name: 'Orégano',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 160, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'massa-de-pizza', productCode: 'massa-de-pizza', name: 'Massa de pizza',
      category: 's', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: 'Fórmula por kg de massa; uma pizza usa 0,508 kg.', preparation: 'Misture farinha, sal, açúcar e fermento. Junte azeite e água morna aos poucos, sove até ficar lisa e deixe descansar por 30 a 45 minutos.',
      recipe: [{ id: 'farinha-de-trigo', quantity: 0.472 }, { id: 'agua-morna', quantity: 0.393 }, { id: 'fermento-biologico-seco', quantity: 0.02 }, { id: 'acucar', quantity: 0.024 }, { id: 'sal', quantity: 0.01 }, { id: 'azeite', quantity: 0.089 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'molho-de-tomate', productCode: 'molho-de-tomate', name: 'Molho de tomate',
      category: 's', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: 'Molho de tomate temperado.', preparation: 'Cozinhe o tomate com azeite, sal e orégano até obter um molho homogêneo. Reserve para a montagem.',
      recipe: [{ id: 'tomate', quantity: 0.93 }, { id: 'azeite', quantity: 0.03 }, { id: 'sal', quantity: 0.02 }, { id: 'oregano', quantity: 0.002 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'pizza-de-mucarela', productCode: 'pizza-de-mucarela', name: 'Pizza de muçarela',
      category: 'u', unit: 'UN', weight: 1.035, purchaseQuoteValue: null, saleValue: 28, notes: 'Pizza individual pronta para assar. Ingredientes medidos em kg ou L.', preparation: '1. Misture os secos: em uma tigela, misture farinha, sal, açúcar e fermento biológico.\n2. Adicione os líquidos: acrescente azeite e água morna aos poucos, até a massa soltar das mãos.\n3. Sove e descanse: sove até ficar lisa, cubra e deixe crescer por 30 a 45 minutos.\n4. Abra a massa: abra em uma assadeira untada com azeite.\n5. Monte a pizza: espalhe o molho, cubra com muçarela, tomate e orégano.\n6. Asse: leve ao forno preaquecido a 200 °C por 20 a 30 minutos, até dourar e o queijo derreter.',
      recipe: [{ id: 'massa-de-pizza', quantity: 0.508 }, { id: 'molho-de-tomate', quantity: 0.125 }, { id: 'mucarela', quantity: 0.3 }, { id: 'tomate', quantity: 0.1 }, { id: 'oregano', quantity: 0.002 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'caixa-para-3-pizzas', productCode: 'caixa-para-3-pizzas', name: 'Caixa para 3 pizzas',
      category: 'e', unit: 'BX', weight: 0.2, purchaseQuoteValue: 3.5, saleValue: null, notes: 'Embalagem para o pacote.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'pacote-3-pizzas-mucarela', productCode: 'pacote-3-pizzas-mucarela', name: 'Pacote com 3 pizzas de muçarela',
      category: 'p', unit: 'PC', weight: 3.305, purchaseQuoteValue: null, saleValue: 75, notes: 'Produto final: três pizzas de muçarela em uma caixa.', preparation: 'Asse ou congele as três pizzas conforme a operação. Depois de resfriadas, acomode-as na caixa e feche o pacote.',
      recipe: [{ id: 'pizza-de-mucarela', quantity: 3 }, { id: 'caixa-para-3-pizzas', quantity: 1 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
  ]
}

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
  return products.length === DEMO_CODES.length &&
    products.every((product) => DEMO_CODES.includes(product.productCode)) &&
    lists.length === 1 &&
    lists[0]?.id === DEMO_LIST_ID &&
    entries.length === 1 &&
    entries[0]?.listId === DEMO_LIST_ID &&
    entries[0]?.productCode === 'pacote-3-pizzas-mucarela'
}

export async function addDemo(): Promise<void> {
  await db.transaction('rw', db.products, db.materialLists, db.materialListEntries, db.meta, async () => {
    const state = await db.meta.get('demo-state')
    if (state?.value === 'inserted') return
    const [conflictingProducts, conflictingList, conflictingEntries] = await Promise.all([
      db.products.where('productCode').anyOf(DEMO_CODES).toArray(),
      db.materialLists.get(DEMO_LIST_ID),
      db.materialListEntries.where('listId').equals(DEMO_LIST_ID).toArray(),
    ])
    if (conflictingProducts.length > 0 || conflictingList || conflictingEntries.length > 0) {
      throw new Error('Já existem registros com a identidade da demonstração neste aparelho. Remova ou renomeie-os antes de adicioná-la.')
    }

    const now = new Date().toISOString()
    await db.products.bulkAdd(demoProducts(now))
    await db.materialLists.add({ id: DEMO_LIST_ID, name: 'Pacote com 3 pizzas de muçarela', createdAt: now, updatedAt: now })
    await db.materialListEntries.bulkAdd([
      { listId: DEMO_LIST_ID, productCode: 'pacote-3-pizzas-mucarela', quantity: 1 },
    ])
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
  const [products, materialLists, materialListEntries] = await Promise.all([
    db.products.toArray(),
    db.materialLists.toArray(),
    db.materialListEntries.toArray(),
  ])
  return { format: 'lista-de-materiais', version: 1, exportedAt: new Date().toISOString(), products, materialLists, materialListEntries }
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
