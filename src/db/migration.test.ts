import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { db, initializeDatabase, MaterialsDatabase, PRINCIPAL_PROFILE_ID } from './database'
import type { ProductRecord } from '../domain/catalog'

const DB_NAME = `migration-test-${(Date.now() * Math.random()).toString(36)}`

function seedProduct(overrides: Partial<ProductRecord> = {}): ProductRecord {
  const now = '2026-01-01T00:00:00.000Z'
  return { id: 'pizza-de-mucarela', productCode: 'pizza-de-mucarela', name: 'Pizza de muçarela', category: 'u', unit: 'UN', weight: 1.035, purchaseQuoteValue: 12, saleValue: 28, notes: 'Polietileno do fabricante.', preparation: 'Estirar y hornear.', recipe: null, imageUrl: null, createdAt: now, updatedAt: now, ...overrides }
}

async function seedV7Database(): Promise<void> {
  const legacy = new Dexie(DB_NAME)
  legacy.version(7).stores({
    products: 'id, productCode, name, category',
    materialLists: 'id, name, updatedAt',
    materialListEntries: '[listId+productCode], listId, productCode',
    meta: 'key',
    driveSync: 'key',
  })
  await legacy.open()
  await legacy.table('products').bulkAdd([
    seedProduct(),
    seedProduct({ id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', recipe: null }),
    seedProduct({ id: 'masa', productCode: 'masa', name: 'Masa', category: 'l', unit: 'KG', recipe: null }),
    seedProduct({ id: 'paquete', productCode: 'paquete', name: 'Paquete', category: 'p', unit: 'PC', recipe: [{ id: 'pizza-de-mucarela', quantity: 3 }] }),
  ])
  await legacy.table('materialLists').add({ id: 'lista-1', name: 'Plan semanal', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' })
  await legacy.table('materialListEntries').bulkAdd([
    { listId: 'lista-1', productCode: 'paquete', quantity: 2 },
    { listId: 'lista-1', productCode: 'farinha', quantity: 5 },
  ])
  await legacy.table('meta').bulkAdd([
    { key: 'demo-state', value: 'inserted' },
    { key: 'otra-clave', value: 'valor' },
  ])
  await legacy.table('driveSync').put({
    key: 'active', fileId: 'file-9', link: 'https://drive.google.com/file/d/file-9', resourceKey: 'rk-1', fileName: 'lista-de-materiais.json',
    accountEmail: 'julio@example.com', canDownload: true, canModifyContent: true, linkedAt: '2026-01-01T00:00:00.000Z',
    lastRemoteModifiedTime: '2026-01-02T00:00:00.000Z', lastRemoteCheckedAt: '2026-01-03T00:00:00.000Z', lastUploadedAt: null,
    lastDownloadedAt: null, lastObservedFingerprint: 'abc', lastObservedVersion: '12', lastSyncedFingerprint: 'abc',
  })
  await legacy.close()
}

describe('migração Dexie v7 → v8 (Perfis locais)', () => {
  it('cria o Perfil Principal em uma base nova', async () => {
    try {
      await db.delete()
      await initializeDatabase()
      expect(await db.profiles.get(PRINCIPAL_PROFILE_ID)).toMatchObject({ id: PRINCIPAL_PROFILE_ID, name: 'Principal' })
    } finally {
      await db.delete()
    }
  })

  it('sube los datos legados al Perfil Principal y preserva meta y driveSync', async () => {
    await seedV7Database()
    const upgraded = new MaterialsDatabase(DB_NAME)
    try {
      await upgraded.open()
      upgraded.bindTables()

      // El Perfil Principal se creó y recibió los datos legados.
      const profile = await upgraded.profiles.get(PRINCIPAL_PROFILE_ID)
      expect(profile?.id).toBe(PRINCIPAL_PROFILE_ID)

      const products = (await upgraded.profileProducts.where('profileId').equals(PRINCIPAL_PROFILE_ID).toArray())
      expect(products).toHaveLength(4)
      expect(products.map((p) => p.productCode)).toEqual(expect.arrayContaining(['paquete', 'masa']))
      // Categoría legada `l` (Outros) queda intacta en migración; no cruza Perfiles.
      expect(products.find((p) => p.productCode === 'masa')?.category).toBe('l')

      const lists = await upgraded.profileMaterialLists.where('profileId').equals(PRINCIPAL_PROFILE_ID).toArray()
      expect(lists).toHaveLength(1)
      const entries = await upgraded.profileMaterialListEntries.where('profileId').equals(PRINCIPAL_PROFILE_ID).toArray()
      expect(entries).toHaveLength(2)
      const meta = await upgraded.profileMeta.get([PRINCIPAL_PROFILE_ID, 'demo-state'])
      expect(meta?.value).toBe('inserted')

      const drive = await upgraded.profileDriveSync.get([PRINCIPAL_PROFILE_ID, 'active'])
      expect(drive?.fileId).toBe('file-9')
      expect(drive?.accountEmail).toBe('julio@example.com')
      expect(drive?.lastSyncedFingerprint).toBe('abc')
    } finally {
      await upgraded.close()
      await Dexie.delete(DB_NAME)
    }
  })

  it('preserva las relaciones entre catálogo, Lista y vínculo Drive', async () => {
    await seedV7Database()
    const upgraded = new MaterialsDatabase(DB_NAME)
    try {
      await upgraded.open()
      upgraded.bindTables()

      const products = await upgraded.profileProducts.where('profileId').equals(PRINCIPAL_PROFILE_ID).toArray()
      const paquete = products.find((p) => p.productCode === 'paquete')
      expect(paquete?.category).toBe('p')
      expect(paquete?.recipe).toEqual([{ id: 'pizza-de-mucarela', quantity: 3 }])

      expect(await upgraded.profileMaterialLists.where('profileId').equals(PRINCIPAL_PROFILE_ID).count()).toBe(1)
      const entries = await upgraded.profileMaterialListEntries.where('[profileId+listId]').equals([PRINCIPAL_PROFILE_ID, 'lista-1']).toArray()
      expect(entries).toHaveLength(2)

      const drive = await upgraded.profileDriveSync.get([PRINCIPAL_PROFILE_ID, 'active'])
      expect(drive?.fileId).toBe('file-9')
      expect(drive?.resourceKey).toBe('rk-1')
      expect(drive?.lastSyncedFingerprint).toBe('abc')
    } finally {
      await upgraded.close()
      await Dexie.delete(DB_NAME)
    }
  })
})
