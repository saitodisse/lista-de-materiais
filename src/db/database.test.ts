import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllLocalData, db, deleteProduct, exportLocalData, getDriveSync, importLocalData, replaceAllWithDemo, resetDatabaseForTest, saveDriveSync, saveMaterialList, saveProduct } from './database'
import { ProductDependencyError, type ProductRecord } from '../domain/catalog'
import { DEMO_LIST_ID, DEMO_PRODUCT_CODES } from '../features/demo/demoData'

function rawMaterial(code: string): ProductRecord {
  const now = '2026-01-01T00:00:00.000Z'
  return { id: code, productCode: code, name: code, category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 3, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now }
}

describe('persistência Dexie', () => {
  beforeEach(async () => { await resetDatabaseForTest() })

  it('guarda uma Lista e preserva sua integridade com o catálogo', async () => {
    const farinha = rawMaterial('farinha')
    await saveProduct(farinha)
    await saveMaterialList({ id: 'lista', name: 'Teste', createdAt: farinha.createdAt, updatedAt: farinha.updatedAt }, [{ listId: 'lista', productCode: 'farinha', quantity: 2 }])
    expect(await db.materialLists.get('lista')).toMatchObject({ name: 'Teste' })
    expect(await db.materialListEntries.get(['lista', 'farinha'])).toMatchObject({ quantity: 2 })
  })

  it('bloqueia exclusão quando o Produto aparece em receita ou Lista', async () => {
    const farinha = rawMaterial('farinha')
    const massa = { ...rawMaterial('massa'), category: 's' as const, recipe: [{ id: 'farinha', quantity: 1 }] }
    await saveProduct(farinha)
    await saveProduct(massa)
    await expect(deleteProduct('farinha')).rejects.toBeInstanceOf(ProductDependencyError)
  })

  it('bloqueia exclusão quando o Produto aparece em uma Lista', async () => {
    const farinha = rawMaterial('farinha')
    await saveProduct(farinha)
    await saveMaterialList({ id: 'lista', name: 'Compra', createdAt: farinha.createdAt, updatedAt: farinha.updatedAt }, [{ listId: 'lista', productCode: 'farinha', quantity: 2 }])
    await expect(deleteProduct('farinha')).rejects.toBeInstanceOf(ProductDependencyError)
  })

  it('substitui toda a base pela demonstração oficial de pizzas', async () => {
    const materialLocal = rawMaterial('material-local')
    await saveProduct(materialLocal)
    await saveMaterialList({ id: 'lista-local', name: 'Lista local', createdAt: materialLocal.createdAt, updatedAt: materialLocal.updatedAt }, [{ listId: 'lista-local', productCode: materialLocal.productCode, quantity: 2 }])
    await replaceAllWithDemo()

    expect((await db.products.toArray()).map((product) => product.productCode).sort()).toEqual([...DEMO_PRODUCT_CODES].sort())
    expect(await db.products.get('pacote-3-pizzas-mucarela')).toMatchObject({ name: 'Pacote com 3 pizzas de muçarela', category: 'p' })
    expect(await db.products.get('pizza-de-mucarela')).toMatchObject({ category: 'u' })
    expect(await db.products.get('massa-de-pizza')).toMatchObject({ category: 's', unit: 'KG' })
    expect(await db.products.get('molho-de-tomate')).toMatchObject({ category: 's' })
    expect(await db.materialLists.get(DEMO_LIST_ID)).toMatchObject({ name: 'Pacote com 3 pizzas de muçarela' })
    expect(await db.materialListEntries.get([DEMO_LIST_ID, 'pacote-3-pizzas-mucarela'])).toMatchObject({ quantity: 1 })
    expect(await db.products.get(materialLocal.productCode)).toBeUndefined()
    expect(await db.materialLists.get('lista-local')).toBeUndefined()
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'inserted' })
  })

  it('limpa Produtos, Listas, entradas e mantém o aparelho vazio após reiniciar', async () => {
    await replaceAllWithDemo()
    await clearAllLocalData()

    expect(await db.products.count()).toBe(0)
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'cleared' })
  })

  it('exporta e importa a cópia local substituindo Produtos e Listas', async () => {
    const antigo = rawMaterial('antigo')
    const importado = { ...rawMaterial('cafe'), name: 'Café', purchaseQuoteValue: 12 }
    const list = { id: 'lista-cafe', name: 'Compra de café', createdAt: importado.createdAt, updatedAt: importado.updatedAt }
    await saveProduct(antigo)

    await importLocalData({
      format: 'lista-de-materiais',
      version: 1,
      exportedAt: '2026-01-02T00:00:00.000Z',
      products: [importado],
      materialLists: [list],
      materialListEntries: [{ listId: list.id, productCode: importado.productCode, quantity: 2 }],
    })

    expect(await db.products.get('antigo')).toBeUndefined()
    expect(await db.products.get('cafe')).toMatchObject({ name: 'Café' })
    expect(await db.materialListEntries.get([list.id, 'cafe'])).toMatchObject({ quantity: 2 })
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'imported' })
    expect(await exportLocalData()).toMatchObject({ format: 'lista-de-materiais', version: 1, products: [expect.objectContaining({ productCode: 'cafe' })] })
  })

  it('não apaga os dados atuais quando o arquivo importado é inválido', async () => {
    const atual = rawMaterial('atual')
    await saveProduct(atual)

    await expect(importLocalData({
      format: 'lista-de-materiais',
      version: 1,
      exportedAt: '2026-01-02T00:00:00.000Z',
      products: [],
      materialLists: [{ id: 'lista-invalida', name: 'Lista inválida', createdAt: atual.createdAt, updatedAt: atual.updatedAt }],
      materialListEntries: [],
    })).rejects.toThrow(/ao menos um Produto/i)

    expect(await db.products.get('atual')).toMatchObject({ name: 'atual' })
  })

  it('mantém o vínculo do Drive separado ao importar e limpar o catálogo', async () => {
    await saveDriveSync({ key: 'active', fileId: 'file-1', link: 'link', resourceKey: null, fileName: 'dados.json', accountEmail: null, linkedAt: '2026-01-01', lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null, lastDownloadedAt: null, lastObservedFingerprint: null, lastObservedVersion: null, lastSyncedFingerprint: null })
    await importLocalData({ format: 'lista-de-materiais', version: 1, exportedAt: '2026-01-02', products: [rawMaterial('importado')], materialLists: [], materialListEntries: [] })
    expect(await getDriveSync()).toMatchObject({ fileId: 'file-1' })
    await clearAllLocalData()
    expect(await getDriveSync()).toMatchObject({ fileId: 'file-1' })
  })
})
