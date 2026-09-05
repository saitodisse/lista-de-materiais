import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getDriveSync, resetDatabaseForTest, saveDriveSync, saveProduct } from '../../db/database'
import type { ProductRecord } from '../../domain/catalog'
import { fingerprintLocalData } from './content'
import { DriveSyncConflictError, receiveDriveShare, sendDriveShare } from './sync'
import { downloadDriveJson, updateDriveJsonFile } from './client'

vi.mock('./auth', () => ({
  getGoogleAccessToken: vi.fn(() => 'token'),
  getGoogleAccountEmail: vi.fn(async () => 'owner@example.com'),
  connectGoogleDrive: vi.fn(),
}))
vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client')
  return { ...actual, downloadDriveJson: vi.fn(), updateDriveJsonFile: vi.fn() }
})

const product = (name: string): ProductRecord => ({ id: 'cafe', productCode: 'cafe', name, category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 3, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' })
const metadata = { id: 'file-1', name: 'dados.json', mimeType: 'application/json', modifiedTime: '2026-01-01T00:00:00.000Z', webViewLink: null, resourceKey: null, version: '1', capabilities: { canDownload: true, canModifyContent: true } }
const remote = (name: string) => ({ metadata, data: { format: 'lista-de-materiais' as const, version: 1 as const, exportedAt: '2026-01-02', products: [product(name)], materialLists: [], materialListEntries: [] }, etag: '"remote"' })

describe('coordenação do compartilhamento Drive', () => {
  beforeEach(async () => {
    await resetDatabaseForTest()
    vi.mocked(downloadDriveJson).mockReset()
    vi.mocked(updateDriveJsonFile).mockReset()
  })

  it('recebe uma cópia validada e preserva o vínculo', async () => {
    await saveProduct(product('local'))
    const remoteCopy = remote('remoto')
    vi.mocked(downloadDriveJson).mockResolvedValue(remoteCopy)
    await saveDriveSync({ key: 'active', fileId: 'file-1', link: 'https://lista-de-materiais.com.br/configuracoes#drive=file-1', resourceKey: null, fileName: 'dados.json', accountEmail: null, linkedAt: '2026-01-01', lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null, lastDownloadedAt: null, lastObservedFingerprint: null, lastObservedVersion: null, lastSyncedFingerprint: null })

    await receiveDriveShare()

    expect(await db.products.get('cafe')).toMatchObject({ name: 'remoto' })
    expect(await getDriveSync()).toMatchObject({ fileId: 'file-1', link: 'https://lista-de-materiais.com.br/configuracoes#drive=file-1', lastDownloadedAt: expect.any(String), lastSyncedFingerprint: fingerprintLocalData(remoteCopy.data) })
  })

  it('bloqueia envio quando a cópia remota divergiu da referência anterior', async () => {
    await saveProduct(product('local'))
    const remoteCopy = remote('remoto')
    vi.mocked(downloadDriveJson).mockResolvedValue(remoteCopy)
    await saveDriveSync({ key: 'active', fileId: 'file-1', link: 'link', resourceKey: null, fileName: 'dados.json', accountEmail: null, linkedAt: '2026-01-01', lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null, lastDownloadedAt: null, lastObservedFingerprint: null, lastObservedVersion: null, lastSyncedFingerprint: 'old-reference' })

    await expect(sendDriveShare()).rejects.toBeInstanceOf(DriveSyncConflictError)
    expect(updateDriveJsonFile).not.toHaveBeenCalled()
    expect(await db.products.get('cafe')).toMatchObject({ name: 'local' })
  })

  it('não marca como sincronizada uma edição local feita durante o envio', async () => {
    await saveProduct(product('local'))
    const remoteCopy = remote('remoto anterior')
    vi.mocked(downloadDriveJson).mockResolvedValue(remoteCopy)
    vi.mocked(updateDriveJsonFile).mockImplementation(async () => {
      await saveProduct(product('editado durante o envio'))
      return { metadata, etag: '"new"' }
    })
    await saveDriveSync({ key: 'active', fileId: 'file-1', link: 'link', resourceKey: null, fileName: 'dados.json', accountEmail: null, linkedAt: '2026-01-01', lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null, lastDownloadedAt: null, lastObservedFingerprint: fingerprintLocalData(remoteCopy.data), lastObservedVersion: '"remote"', lastSyncedFingerprint: fingerprintLocalData(remoteCopy.data) })

    await sendDriveShare()

    expect(await db.products.get('cafe')).toMatchObject({ name: 'editado durante o envio' })
    expect(await getDriveSync()).toMatchObject({ lastSyncedFingerprint: fingerprintLocalData(remoteCopy.data) })
  })
})
