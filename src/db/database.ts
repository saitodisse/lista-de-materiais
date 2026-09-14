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

export const PRINCIPAL_PROFILE_ID = 'principal'
export const PRINCIPAL_PROFILE_NAME = 'Principal'
export const DEMO_PROFILE_NAME = 'Demonstração'

export interface ProfileRecord { id: string; name: string; createdAt: string; updatedAt: string }
interface ScopedProductRecord extends ProductRecord { profileId?: string }
interface ScopedMaterialList extends MaterialList { profileId?: string }
interface ScopedMaterialListEntry extends MaterialListEntry { profileId?: string }
interface MetaRecord { profileId?: string; key: string; value: string }

export interface DriveSyncRecord {
  profileId?: string
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
interface ScopedDriveSyncRecord extends Omit<DriveSyncRecord, 'profileId'> { profileId?: string }

export class MaterialsDatabase extends Dexie {
  profiles!: EntityTable<ProfileRecord, 'id'>
  profileProducts!: Table<ScopedProductRecord, any>
  profileMaterialLists!: Table<ScopedMaterialList, any>
  profileMaterialListEntries!: Table<ScopedMaterialListEntry, any>
  profileMeta!: Table<MetaRecord, any>
  profileDriveSync!: Table<ScopedDriveSyncRecord, any>
  products!: EntityTable<ProductRecord, 'id'>
  materialLists!: EntityTable<MaterialList, 'id'>
  materialListEntries!: Table<MaterialListEntry, any>
  meta!: EntityTable<{ key: string; value: string }, 'key'>
  driveSync!: EntityTable<Omit<DriveSyncRecord, 'profileId'>, 'key'>

  constructor(name = 'lista-de-materiais') {
    super(name)
    this.version(1).stores({ products: 'id, productCode, name, category', materialLists: 'id, name', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' })
    this.version(2).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' })
    this.version(3).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' }).upgrade(async (transaction) => {
      await transaction.table('products').toCollection().modify((product) => { product.saleValue ??= null })
      const demoState = await transaction.table('meta').get('demo-state') as MetaRecord | undefined
      if (demoState?.value === 'inserted') await transaction.table('products').update('pao-integral', { saleValue: 18 })
    })
    this.version(4).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' }).upgrade(async (transaction) => {
      const products = transaction.table('products')
      await products.toCollection().modify((product) => { product.preparation ??= null })
      const [demo, storedProducts, storedLists, storedEntries] = await Promise.all([
        transaction.table('meta').get('demo-state') as Promise<MetaRecord | undefined>, products.toArray() as Promise<ProductRecord[]>, transaction.table('materialLists').toArray() as Promise<MaterialList[]>, transaction.table('materialListEntries').toArray() as Promise<MaterialListEntry[]>,
      ])
      if (demo?.value !== 'inserted' || !isLegacyBreadDemo(storedProducts, storedLists, storedEntries)) return
      const now = new Date().toISOString()
      await transaction.table('materialListEntries').clear(); await transaction.table('materialLists').clear(); await products.clear()
      await products.bulkAdd(createDemoProducts(now)); await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now }); await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY })
    })
    this.version(5).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' }).upgrade(async (transaction) => {
      const products = transaction.table('products')
      const [demo, storedProducts, storedLists, storedEntries] = await Promise.all([
        transaction.table('meta').get('demo-state') as Promise<MetaRecord | undefined>, products.toArray() as Promise<ProductRecord[]>, transaction.table('materialLists').toArray() as Promise<MaterialList[]>, transaction.table('materialListEntries').toArray() as Promise<MaterialListEntry[]>,
      ])
      if (demo?.value !== 'inserted' || !isPizzaDemo(storedProducts, storedLists, storedEntries)) return
      const now = new Date().toISOString()
      await transaction.table('materialListEntries').clear(); await transaction.table('materialLists').clear(); await products.clear()
      await products.bulkAdd(createDemoProducts(now)); await transaction.table('materialLists').add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now }); await transaction.table('materialListEntries').add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY })
    })
    this.version(6).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key' }).upgrade(async (transaction) => { await transaction.table('products').where('category').equals('l').modify((product) => { product.category = normalizeProductCategory(product.category) }) })
    this.version(7).stores({ products: 'id, productCode, name, category', materialLists: 'id, name, updatedAt', materialListEntries: '[listId+productCode], listId, productCode', meta: 'key', driveSync: 'key' })
    this.version(8).stores({
      profiles: 'id', profileProducts: '[profileId+id], profileId, [profileId+productCode], [profileId+name], [profileId+category]', profileMaterialLists: '[profileId+id], profileId, [profileId+updatedAt]', profileMaterialListEntries: '[profileId+listId+productCode], profileId, [profileId+listId], [profileId+productCode]', profileMeta: '[profileId+key], profileId', profileDriveSync: '[profileId+key], profileId, fileId',
      compatProducts: 'id, productCode, name, category', compatMaterialLists: 'id, name, updatedAt', compatMaterialListEntries: '[listId+productCode], listId, productCode', compatMeta: 'key', compatDriveSync: 'key',
      products: null, materialLists: null, materialListEntries: null, meta: null, driveSync: null,
    }).upgrade(async (transaction) => {
      const hasLegacy = (() => { try { transaction.table('products'); return true } catch { return false } })()
      const profiles = transaction.table('profiles'); const now = new Date().toISOString(); let principal = await profiles.get(PRINCIPAL_PROFILE_ID) as ProfileRecord | undefined
      if (!principal) { principal = { id: PRINCIPAL_PROFILE_ID, name: PRINCIPAL_PROFILE_NAME, createdAt: now, updatedAt: now }; await profiles.add(principal) }
      if (!hasLegacy) return
      const legacyProducts = await transaction.table('products').toArray() as ProductRecord[]
      const legacyLists = await transaction.table('materialLists').toArray() as MaterialList[]
      const legacyEntries = await transaction.table('materialListEntries').toArray() as MaterialListEntry[]
      const legacyMeta = await transaction.table('meta').toArray() as Array<{ key: string; value: string }>
      const legacyDrive = await transaction.table('driveSync').toArray() as Array<Omit<DriveSyncRecord, 'profileId'>>
      await transaction.table('profileProducts').bulkAdd(legacyProducts.map((product) => ({ ...product, profileId: principal!.id }))); await transaction.table('profileMaterialLists').bulkAdd(legacyLists.map((list) => ({ ...list, profileId: principal!.id }))); await transaction.table('profileMaterialListEntries').bulkAdd(legacyEntries.map((entry) => ({ ...entry, profileId: principal!.id }))); await transaction.table('profileMeta').bulkAdd(legacyMeta.map((record) => ({ ...record, profileId: principal!.id }))); await transaction.table('profileDriveSync').bulkAdd(legacyDrive.map((record) => ({ ...record, profileId: principal!.id })))
      const [productCount, listCount, entryCount, metaCount, driveCount] = await Promise.all([transaction.table('profileProducts').where('profileId').equals(principal.id).count(), transaction.table('profileMaterialLists').where('profileId').equals(principal.id).count(), transaction.table('profileMaterialListEntries').where('profileId').equals(principal.id).count(), transaction.table('profileMeta').where('profileId').equals(principal.id).count(), transaction.table('profileDriveSync').where('profileId').equals(principal.id).count()])
      if (productCount !== legacyProducts.length || listCount !== legacyLists.length || entryCount !== legacyEntries.length || metaCount !== legacyMeta.length || driveCount !== legacyDrive.length) throw new Error('A migração para Perfis locais não conferiu todos os registros legados.')
    })
    this.bindTables()
  }

  bindTables(): void {
    this.profileProducts = this.table('profileProducts') as Table<ScopedProductRecord, any>
    this.profileMaterialLists = this.table('profileMaterialLists') as Table<ScopedMaterialList, any>
    this.profileMaterialListEntries = this.table('profileMaterialListEntries') as Table<ScopedMaterialListEntry, any>
    this.profileMeta = this.table('profileMeta') as Table<MetaRecord, any>
    this.profileDriveSync = this.table('profileDriveSync') as Table<ScopedDriveSyncRecord, any>
    this.products = this.table('compatProducts') as EntityTable<ProductRecord, 'id'>
    this.materialLists = this.table('compatMaterialLists') as EntityTable<MaterialList, 'id'>
    this.materialListEntries = this.table('compatMaterialListEntries') as Table<MaterialListEntry, any>
    this.meta = this.table('compatMeta') as EntityTable<{ key: string; value: string }, 'key'>
    this.driveSync = this.table('compatDriveSync') as EntityTable<Omit<DriveSyncRecord, 'profileId'>, 'key'>
  }
}

export const db = new MaterialsDatabase()
const LEGACY_DEMO_LIST_ID = 'demo-lista-pao-integral'; const LEGACY_DEMO_CODES = ['farinha-integral', 'agua-filtrada', 'fermento-biologico', 'massa-integral', 'saco-papel', 'pao-integral']
function isLegacyBreadDemo(products: ProductRecord[], lists: MaterialList[], entries: MaterialListEntry[]): boolean { return products.length === LEGACY_DEMO_CODES.length && products.every((product) => LEGACY_DEMO_CODES.includes(product.productCode)) && lists.length === 1 && lists[0]?.id === LEGACY_DEMO_LIST_ID && entries.length === 1 && entries[0]?.listId === LEGACY_DEMO_LIST_ID && entries[0]?.productCode === 'pao-integral' }
function isPizzaDemo(products: ProductRecord[], lists: MaterialList[], entries: MaterialListEntry[]): boolean { return products.length === DEMO_PRODUCT_CODES.length && products.every((product) => DEMO_PRODUCT_CODES.includes(product.productCode as typeof DEMO_PRODUCT_CODES[number])) && lists.length === 1 && lists[0]?.id === DEMO_LIST_ID && entries.length === 1 && entries[0]?.listId === DEMO_LIST_ID && entries[0]?.productCode === 'pacote-3-pizzas-mucarela' }
function profileNameKey(name: string): string { return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ') }
function newPrincipalProfile(): ProfileRecord { const now = new Date().toISOString(); return { id: PRINCIPAL_PROFILE_ID, name: PRINCIPAL_PROFILE_NAME, createdAt: now, updatedAt: now } }
async function openDatabase(): Promise<void> { if (!db.isOpen()) { await db.open(); db.bindTables() } }
async function ensureDatabase(): Promise<void> { await openDatabase(); if (await db.profiles.count() > 0) return; await db.profiles.put(newPrincipalProfile()) }
export async function initializeDatabase(): Promise<void> { await ensureDatabase() }
export async function getProfiles(): Promise<ProfileRecord[]> { await openDatabase(); const profiles = await db.profiles.toArray(); return (profiles.length > 0 ? profiles : [newPrincipalProfile()]).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' })) }
export async function getProfile(profileId: string): Promise<ProfileRecord | undefined> { await openDatabase(); return (await db.profiles.get(profileId)) ?? (profileId === PRINCIPAL_PROFILE_ID ? newPrincipalProfile() : undefined) }
export async function getInitialProfileId(): Promise<string> { const profiles = await getProfiles(); const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem('lista-de-materiais:profile'); const selected = stored && profiles.some((profile) => profile.id === stored) ? stored : profiles[0]?.id; if (!selected) throw new Error('Nenhum Perfil local está disponível.'); return selected }
export async function rememberProfile(profileId: string): Promise<void> { if (typeof localStorage !== 'undefined') localStorage.setItem('lista-de-materiais:profile', profileId) }
async function resolveProfileId(profileId?: string, createIfMissing = false): Promise<string> { await openDatabase(); const id = profileId ?? await getInitialProfileId(); if (createIfMissing) await ensureDatabase(); if (!(await db.profiles.get(id)) && id !== PRINCIPAL_PROFILE_ID) throw new Error('O Perfil local selecionado não existe.'); return id }

export async function createProfile(name: string): Promise<ProfileRecord> { await ensureDatabase(); const cleanName = name.trim(); if (!cleanName) throw new Error('Informe um nome para o Perfil.'); const profiles = await db.profiles.toArray(); if (profiles.some((profile) => profileNameKey(profile.name) === profileNameKey(cleanName))) throw new Error('Já existe um Perfil com esse nome.'); const now = new Date().toISOString(); const profile = { id: `profile-${crypto.randomUUID()}`, name: cleanName, createdAt: now, updatedAt: now }; await db.profiles.add(profile); return profile }
export async function getOrCreateDemoProfile(): Promise<ProfileRecord> { await ensureDatabase(); const existing = (await db.profiles.toArray()).find((profile) => profileNameKey(profile.name) === profileNameKey(DEMO_PROFILE_NAME)); if (existing) return existing; const now = new Date().toISOString(); const profile = { id: `profile-${crypto.randomUUID()}`, name: DEMO_PROFILE_NAME, createdAt: now, updatedAt: now }; await db.profiles.add(profile); return profile }
export async function renameProfile(profileId: string, name: string): Promise<void> { const id = await resolveProfileId(profileId, true); const cleanName = name.trim(); if (!cleanName) throw new Error('Informe um nome para o Perfil.'); const profiles = await db.profiles.toArray(); if (profiles.some((profile) => profile.id !== id && profileNameKey(profile.name) === profileNameKey(cleanName))) throw new Error('Já existe um Perfil com esse nome.'); await db.profiles.update(id, { name: cleanName, updatedAt: new Date().toISOString() }) }
export async function deleteProfile(profileId: string): Promise<void> { const id = await resolveProfileId(profileId, true); if (await db.profiles.count() <= 1) throw new Error('O último Perfil local não pode ser excluído.'); await db.transaction('rw', [db.profiles, db.profileProducts, db.profileMaterialLists, db.profileMaterialListEntries, db.profileMeta, db.profileDriveSync, db.products, db.materialLists, db.materialListEntries, db.meta, db.driveSync], async () => { await db.profileMaterialListEntries.where('profileId').equals(id).delete(); await db.profileMaterialLists.where('profileId').equals(id).delete(); await db.profileProducts.where('profileId').equals(id).delete(); await db.profileMeta.where('profileId').equals(id).delete(); await db.profileDriveSync.where('profileId').equals(id).delete(); if (id === PRINCIPAL_PROFILE_ID) { await db.products.clear(); await db.materialLists.clear(); await db.materialListEntries.clear(); await db.meta.clear(); await db.driveSync.clear() } await db.profiles.delete(id) }); if (typeof localStorage !== 'undefined' && localStorage.getItem('lista-de-materiais:profile') === id) await rememberProfile(await getInitialProfileId()) }

function stripProfile<T extends { profileId?: string }>(record: T): Omit<T, 'profileId'> { const { profileId: _profileId, ...publicRecord } = record; return publicRecord }
async function listProfileProducts(id: string): Promise<ProductRecord[]> { return (await db.profileProducts.where('profileId').equals(id).toArray()).map(stripProfile) }
async function listProfileMaterialLists(id: string): Promise<MaterialList[]> { return (await db.profileMaterialLists.where('profileId').equals(id).toArray()).map(stripProfile) }
async function listProfileMaterialListEntries(id: string, listId?: string): Promise<MaterialListEntry[]> { const rows = listId ? await db.profileMaterialListEntries.where('[profileId+listId]').equals([id, listId]).toArray() : await db.profileMaterialListEntries.where('profileId').equals(id).toArray(); return rows.map(stripProfile) }
export async function listProducts(profileId?: string): Promise<ProductRecord[]> { const id = await resolveProfileId(profileId); const products = await listProfileProducts(id); if (products.length || id !== PRINCIPAL_PROFILE_ID) return products; return db.products.toArray() }
export async function getProduct(productCode: string, profileId?: string): Promise<ProductRecord | undefined> { const id = await resolveProfileId(profileId); const product = await db.profileProducts.get([id, productCode]); if (product) return stripProfile(product); return id === PRINCIPAL_PROFILE_ID ? db.products.get(productCode) : undefined }
export async function listMaterialLists(profileId?: string): Promise<MaterialList[]> { const id = await resolveProfileId(profileId); const lists = await db.profileMaterialLists.where('profileId').equals(id).toArray(); return (lists.length || id !== PRINCIPAL_PROFILE_ID ? lists.map(stripProfile) : await db.materialLists.toArray()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)) }
export async function getMaterialList(listId: string, profileId?: string): Promise<MaterialList | undefined> { const id = await resolveProfileId(profileId); const list = await db.profileMaterialLists.get([id, listId]); return list ? stripProfile(list) : id === PRINCIPAL_PROFILE_ID ? db.materialLists.get(listId) : undefined }
export async function listMaterialListEntries(listId?: string, profileId?: string): Promise<MaterialListEntry[]> { const id = await resolveProfileId(profileId); const entries = listId ? await db.profileMaterialListEntries.where('[profileId+listId]').equals([id, listId]).toArray() : await db.profileMaterialListEntries.where('profileId').equals(id).toArray(); if (entries.length || id !== PRINCIPAL_PROFILE_ID) return entries.map(stripProfile); return listId ? db.materialListEntries.where('listId').equals(listId).toArray() : db.materialListEntries.toArray() }
export async function getProfileSummary(profileId?: string): Promise<{ products: number; lists: number; demo: string | null }> { const id = await resolveProfileId(profileId); const [products, lists, demo] = await Promise.all([listProducts(id), listMaterialLists(id), db.profileMeta.get([id, 'demo-state'])]); return { products: products.length, lists: lists.length, demo: demo?.value ?? (id === PRINCIPAL_PROFILE_ID ? (await db.meta.get('demo-state'))?.value ?? null : null) } }

async function clearProfileCatalogInTransaction(profileId: string): Promise<void> { await db.profileMaterialListEntries.where('profileId').equals(profileId).delete(); await db.profileMaterialLists.where('profileId').equals(profileId).delete(); await db.profileProducts.where('profileId').equals(profileId).delete(); await db.profileMeta.where('profileId').equals(profileId).delete() }
export async function replaceAllWithDemo(profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); const now = new Date().toISOString(); const products = createDemoProducts(now); await db.transaction('rw', db.profileProducts, db.profileMaterialLists, db.profileMaterialListEntries, db.profileMeta, async () => { await clearProfileCatalogInTransaction(id); await db.profileProducts.bulkAdd(products.map((product) => ({ ...product, profileId: id }))); await db.profileMaterialLists.add({ profileId: id, id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now }); await db.profileMaterialListEntries.add({ profileId: id, listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY }); await db.profileMeta.put({ profileId: id, key: 'demo-state', value: 'inserted' }) }); if (id === PRINCIPAL_PROFILE_ID) { await db.products.clear(); await db.materialLists.clear(); await db.materialListEntries.clear(); await db.meta.clear(); await db.products.bulkAdd(products); await db.materialLists.add({ id: DEMO_LIST_ID, name: DEMO_LIST_NAME, createdAt: now, updatedAt: now }); await db.materialListEntries.add({ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY }); await db.meta.put({ key: 'demo-state', value: 'inserted' }) } }
export async function clearAllLocalData(profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); await db.transaction('rw', db.profileProducts, db.profileMaterialLists, db.profileMaterialListEntries, db.profileMeta, async () => { await clearProfileCatalogInTransaction(id); await db.profileMeta.put({ profileId: id, key: 'demo-state', value: 'cleared' }) }); if (id === PRINCIPAL_PROFILE_ID) { await db.products.clear(); await db.materialLists.clear(); await db.materialListEntries.clear(); await db.meta.put({ key: 'demo-state', value: 'cleared' }) } }
export async function exportLocalData(profileId?: string): Promise<LocalDataExport> { const id = await resolveProfileId(profileId); return db.transaction('r', db.profileProducts, db.profileMaterialLists, db.profileMaterialListEntries, async () => { const [products, materialLists, materialListEntries] = await Promise.all([listProfileProducts(id), listProfileMaterialLists(id), listProfileMaterialListEntries(id)]); return { format: 'lista-de-materiais', version: 1, exportedAt: new Date().toISOString(), products, materialLists, materialListEntries } }) }
export async function importLocalData(value: unknown, profileId?: string): Promise<void> { const data = parseLocalDataExport(value); validateLocalDataExport(data); const id = await resolveProfileId(profileId, true); await db.transaction('rw', db.profileProducts, db.profileMaterialLists, db.profileMaterialListEntries, db.profileMeta, async () => { await clearProfileCatalogInTransaction(id); await db.profileProducts.bulkAdd(data.products.map((product) => ({ ...product, profileId: id }))); await db.profileMaterialLists.bulkAdd(data.materialLists.map((list) => ({ ...list, profileId: id }))); await db.profileMaterialListEntries.bulkAdd(data.materialListEntries.map((entry) => ({ ...entry, profileId: id }))); await db.profileMeta.put({ profileId: id, key: 'demo-state', value: 'imported' }) }); if (id === PRINCIPAL_PROFILE_ID) { await db.products.clear(); await db.materialLists.clear(); await db.materialListEntries.clear(); await db.meta.clear(); await db.products.bulkAdd(data.products); await db.materialLists.bulkAdd(data.materialLists); await db.materialListEntries.bulkAdd(data.materialListEntries); await db.meta.put({ key: 'demo-state', value: 'imported' }) } }

export async function saveProduct(product: ProductRecord, previousCode?: string, profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); const allProducts = await listProducts(id); if (previousCode && previousCode !== product.productCode) throw new Error('O código do Produto não pode ser alterado depois da criação.'); validateProductRecord(product, allProducts); await db.transaction('rw', db.profileProducts, async () => { await db.profileProducts.put({ ...product, profileId: id }) }); if (id === PRINCIPAL_PROFILE_ID) await db.products.put(product) }
export async function getProductDependencies(productCode: string, profileId?: string): Promise<ProductDependencies> { const id = await resolveProfileId(profileId); const [products, entries, lists] = await Promise.all([listProducts(id), listMaterialListEntries(undefined, id), listMaterialLists(id)]); const listIds = new Set(entries.filter((entry) => entry.productCode === productCode).map((entry) => entry.listId)); return { recipes: products.filter((product) => product.recipe?.some((item) => item.id === productCode)), lists: lists.filter((list) => listIds.has(list.id)) } }
export async function deleteProduct(productCode: string, profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); const dependencies = await getProductDependencies(productCode, id); if (dependencies.recipes.length > 0 || dependencies.lists.length > 0) throw new ProductDependencyError(dependencies); await db.profileProducts.delete([id, productCode]); if (id === PRINCIPAL_PROFILE_ID) await db.products.delete(productCode) }
export async function saveMaterialList(list: MaterialList, entries: MaterialListEntry[], profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); validateMaterialList(list, entries, await listProducts(id)); await db.transaction('rw', db.profileMaterialLists, db.profileMaterialListEntries, async () => { await db.profileMaterialLists.put({ ...list, profileId: id }); await db.profileMaterialListEntries.where('[profileId+listId]').equals([id, list.id]).delete(); await db.profileMaterialListEntries.bulkAdd(entries.map((entry) => ({ ...entry, profileId: id }))) }); if (id === PRINCIPAL_PROFILE_ID) { await db.materialLists.put(list); await db.materialListEntries.where('listId').equals(list.id).delete(); await db.materialListEntries.bulkAdd(entries) } }
export async function deleteMaterialList(listId: string, profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); await db.transaction('rw', db.profileMaterialLists, db.profileMaterialListEntries, db.materialLists, db.materialListEntries, async () => { await db.profileMaterialListEntries.where('[profileId+listId]').equals([id, listId]).delete(); await db.profileMaterialLists.delete([id, listId]); if (id === PRINCIPAL_PROFILE_ID) { await db.materialListEntries.where('listId').equals(listId).delete(); await db.materialLists.delete(listId) } }) }

export async function getDriveSync(profileId?: string): Promise<DriveSyncRecord | undefined> { const id = await resolveProfileId(profileId); const record = await db.profileDriveSync.get([id, 'active']); if (record) return stripProfile(record); return id === PRINCIPAL_PROFILE_ID ? db.driveSync.get('active') : undefined }
export async function saveDriveSync(record: DriveSyncRecord, profileId?: string): Promise<void> { const id = await resolveProfileId(profileId ?? record.profileId, true); const duplicate = await db.profileDriveSync.where('fileId').equals(record.fileId).filter((item) => item.profileId !== id).first(); if (duplicate?.profileId) throw new Error(`Este arquivo do Drive já está vinculado ao Perfil “${(await db.profiles.get(duplicate.profileId))?.name ?? duplicate.profileId}”.`); const { profileId: _ignored, ...withoutProfile } = record; await db.profileDriveSync.put({ ...withoutProfile, profileId: id }); if (id === PRINCIPAL_PROFILE_ID) await db.driveSync.put(withoutProfile) }
export async function clearDriveSync(profileId?: string): Promise<void> { const id = await resolveProfileId(profileId, true); await db.profileDriveSync.delete([id, 'active']); if (id === PRINCIPAL_PROFILE_ID) await db.driveSync.delete('active') }
export async function resetDatabaseForTest(): Promise<void> { await db.delete(); await db.open(); db.bindTables(); await ensureDatabase(); if (typeof localStorage !== 'undefined') localStorage.removeItem('lista-de-materiais:profile') }
