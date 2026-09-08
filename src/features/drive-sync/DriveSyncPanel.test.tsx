import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getDriveSync, resetDatabaseForTest, saveDriveSync, saveProduct } from '../../db/database'
import type { ProductRecord } from '../../domain/catalog'
import { DriveSyncPanel } from './DriveSyncPanel'
import { downloadDriveJson, listDriveJsonFiles } from './client'

vi.mock('./auth', () => ({
  isGoogleConnected: () => true,
  hasGoogleConnectionPreference: () => false,
  getGoogleAccessToken: () => 'test-token',
  getGoogleAccountEmail: async () => 'owner@example.com',
  connectGoogleDrive: vi.fn(),
  disconnectGoogleDrive: vi.fn(),
  restoreGoogleDrive: vi.fn(),
}))
vi.mock('./client', async (importOriginal) => ({
  ...await importOriginal<typeof import('./client')>(),
  downloadDriveJson: vi.fn(),
  listDriveJsonFiles: vi.fn(),
}))

const remoteData = { format: 'lista-de-materiais' as const, version: 1 as const, exportedAt: '2026-09-07', products: [], materialLists: [], materialListEntries: [] }
const metadata = (id: string, modifiedTime = '2026-09-07T12:00:00.000Z') => ({
  id,
  name: 'lista-de-materiais.json',
  mimeType: 'application/json',
  modifiedTime,
  webViewLink: null,
  resourceKey: id === 'file-2' ? 'resource-2' : null,
  version: null,
  capabilities: { canDownload: true, canModifyContent: true },
})

const previous = {
  key: 'active' as const, fileId: 'previous-file', link: 'link', resourceKey: 'previous-key',
  fileName: 'anterior.json', accountEmail: null, linkedAt: '2026-09-01',
  lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null,
  lastDownloadedAt: null, lastObservedFingerprint: null, lastObservedVersion: null,
  lastSyncedFingerprint: 'previous-reference',
}

describe('compartilhamento Google Drive no painel', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    await resetDatabaseForTest()
    window.history.replaceState(null, '', '/configuracoes')
    vi.mocked(downloadDriveJson).mockResolvedValue({ metadata: metadata('shared-file'), data: remoteData, etag: null })
    vi.mocked(listDriveJsonFiles).mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })

  it('aceita o link completo do aplicativo e consulta diretamente o arquivo', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/configuracoes#drive=shared-file&resourceKey=link-key')
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Vincular arquivo' }))

    await waitFor(() => expect(downloadDriveJson).toHaveBeenCalledWith('test-token', 'shared-file', 'link-key'))
    expect(await screen.findByRole('status')).toHaveTextContent('vinculado')
    expect(await getDriveSync()).toMatchObject({ fileId: 'shared-file', resourceKey: 'link-key' })
    expect(await db.products.count()).toBe(0)
  })

  it('aceita um ID simples sem substituir o catálogo local', async () => {
    const user = userEvent.setup()
    const product: ProductRecord = { id: 'local', productCode: 'local', name: 'Local', category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    await saveProduct(product)
    render(<DriveSyncPanel />)

    await user.type(screen.getByLabelText('Link ou ID do arquivo compartilhado'), 'shared-file')
    await user.click(screen.getByRole('button', { name: 'Vincular arquivo' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Nenhum dado local foi substituído')
    expect(await db.products.get('local')).toEqual(product)
  })

  it('encontra nenhum arquivo sem criar uma cópia nova', async () => {
    const user = userEvent.setup()
    await saveDriveSync(previous)
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Encontrar meu arquivo' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Nenhum arquivo “lista-de-materiais.json” foi encontrado')
    expect(await getDriveSync()).toEqual(previous)
  })

  it('vincula automaticamente o único arquivo encontrado', async () => {
    const user = userEvent.setup()
    vi.mocked(listDriveJsonFiles).mockResolvedValue([metadata('file-1')])
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Encontrar meu arquivo' }))

    await waitFor(() => expect(downloadDriveJson).toHaveBeenCalledWith('test-token', 'file-1', null))
    expect(await getDriveSync()).toMatchObject({ fileId: 'file-1' })
  })

  it('preserva o vínculo anterior quando o único arquivo encontrado tem JSON inválido', async () => {
    const user = userEvent.setup()
    await saveDriveSync(previous)
    vi.mocked(listDriveJsonFiles).mockResolvedValue([metadata('file-1')])
    vi.mocked(downloadDriveJson).mockRejectedValue(new Error('O arquivo do Drive não contém um JSON válido.'))
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Encontrar meu arquivo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('JSON válido')
    expect(await getDriveSync()).toEqual(previous)
  })

  it('apresenta vários arquivos com data para escolha e valida somente o escolhido', async () => {
    const user = userEvent.setup()
    vi.mocked(listDriveJsonFiles).mockResolvedValue([metadata('file-1'), metadata('file-2', '2026-09-06T12:00:00.000Z')])
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Encontrar meu arquivo' }))

    expect(await screen.findByRole('heading', { name: 'Escolha seu arquivo' })).toBeInTheDocument()
    const choices = screen.getAllByRole('button', { name: /lista-de-materiais\.json/ })
    expect(choices).toHaveLength(2)
    expect(screen.getAllByText(/Alterado em/)).toHaveLength(2)
    await user.click(choices[1]!)

    await waitFor(() => expect(downloadDriveJson).toHaveBeenCalledWith('test-token', 'file-2', 'resource-2'))
    expect(await getDriveSync()).toMatchObject({ fileId: 'file-2', resourceKey: 'resource-2' })
  })

  it('mantém o recebimento explícito e permite leitura quando o arquivo é somente leitura', async () => {
    const user = userEvent.setup()
    await saveDriveSync({ ...previous, fileId: 'shared-file', resourceKey: null, canModifyContent: false })
    render(<DriveSyncPanel />)

    const sendButton = await screen.findByRole('button', { name: 'Enviar dados' })
    expect(sendButton).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Receber dados' }))
    const dialog = screen.getByRole('dialog', { name: 'Substituir os dados deste aparelho?' })
    const receiveButton = within(dialog).getByRole('button', { name: 'Receber dados' })
    expect(receiveButton).toBeDisabled()
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(receiveButton)

    await waitFor(() => expect(db.products.count()).resolves.toBe(0))
    expect(await screen.findByRole('status')).toHaveTextContent('Dados recebidos')
  })
})
