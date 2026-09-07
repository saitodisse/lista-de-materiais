import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getDriveSync, resetDatabaseForTest, saveDriveSync } from '../../db/database'
import { DriveSyncPanel } from './DriveSyncPanel'
import { chooseDriveFile } from './picker'
import { downloadDriveJson } from './client'

vi.mock('./auth', () => ({
  isGoogleConnected: () => true,
  hasGoogleConnectionPreference: () => false,
  getGoogleAccessToken: () => 'test-token',
  getGoogleAccountEmail: async () => 'owner@example.com',
  connectGoogleDrive: vi.fn(),
  disconnectGoogleDrive: vi.fn(),
  restoreGoogleDrive: vi.fn(),
}))
vi.mock('./picker', () => ({ chooseDriveFile: vi.fn() }))
vi.mock('./client', async (importOriginal) => ({
  ...await importOriginal<typeof import('./client')>(),
  downloadDriveJson: vi.fn(),
}))

const previous = {
  key: 'active' as const, fileId: 'previous-file', link: 'link', resourceKey: 'previous-key',
  fileName: 'anterior.json', accountEmail: null, linkedAt: '2026-09-01',
  lastRemoteModifiedTime: null, lastRemoteCheckedAt: null, lastUploadedAt: null,
  lastDownloadedAt: null, lastObservedFingerprint: null, lastObservedVersion: null,
  lastSyncedFingerprint: 'previous-reference',
}

describe('autorização por arquivo no painel Drive', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    await resetDatabaseForTest()
    window.history.replaceState(null, '', '/configuracoes')
    vi.mocked(downloadDriveJson).mockResolvedValue({
      metadata: { id: 'shared-file', name: 'compartilhado.json', mimeType: 'application/json', modifiedTime: null, webViewLink: null, resourceKey: null, version: null, capabilities: {} },
      data: { format: 'lista-de-materiais', version: 1, exportedAt: '2026-09-07', products: [], materialLists: [], materialListEntries: [] },
      etag: null,
    })
  })

  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })

  it('aguarda a seleção do arquivo do link antes de consultar ou persistir o vínculo', async () => {
    const user = userEvent.setup()
    let select!: (value: { fileId: string; resourceKey: string | null }) => void
    vi.mocked(chooseDriveFile).mockReturnValue(new Promise((resolve) => { select = resolve }))
    window.history.replaceState(null, '', '/configuracoes#drive=shared-file&resourceKey=link-key')
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Autorizar e vincular' }))

    expect(chooseDriveFile).toHaveBeenCalledWith('test-token', 'shared-file')
    expect(downloadDriveJson).not.toHaveBeenCalled()
    expect(await getDriveSync()).toBeUndefined()
    select({ fileId: 'shared-file', resourceKey: null })

    expect(await screen.findByRole('status')).toHaveTextContent('vinculado')
    expect(downloadDriveJson).toHaveBeenCalledWith('test-token', 'shared-file', 'link-key')
    expect(await getDriveSync()).toMatchObject({ fileId: 'shared-file', resourceKey: 'link-key' })
    expect(await db.products.count()).toBe(0)
  })

  it('preserva o vínculo anterior se a pessoa cancelar a seleção', async () => {
    await saveDriveSync(previous)
    vi.mocked(chooseDriveFile).mockResolvedValue(null)
    const user = userEvent.setup()
    render(<DriveSyncPanel />)

    await user.click(screen.getByRole('button', { name: 'Escolher arquivo' }))

    expect(downloadDriveJson).not.toHaveBeenCalled()
    expect(await getDriveSync()).toEqual(previous)
  })

  it('permite autorizar novamente um vínculo antigo sem perder a referência de sincronização', async () => {
    await saveDriveSync(previous)
    vi.mocked(chooseDriveFile).mockResolvedValue({ fileId: 'previous-file', resourceKey: null })
    const user = userEvent.setup()
    render(<DriveSyncPanel />)

    await user.click(await screen.findByRole('button', { name: 'Autorizar arquivo' }))

    await waitFor(() => expect(downloadDriveJson).toHaveBeenCalledWith('test-token', 'previous-file', 'previous-key'))
    expect(await screen.findByRole('status')).toHaveTextContent('vinculado')
    expect(await getDriveSync()).toMatchObject({ fileId: 'previous-file', lastSyncedFingerprint: 'previous-reference' })
  })

  it('não vincula outro arquivo quando a seleção difere do link informado', async () => {
    await saveDriveSync(previous)
    vi.mocked(chooseDriveFile).mockResolvedValue({ fileId: 'different-file', resourceKey: null })
    const user = userEvent.setup()
    render(<DriveSyncPanel />)
    await user.type(screen.getByLabelText('Link ou ID do arquivo compartilhado'), 'shared-file')

    await user.click(screen.getByRole('button', { name: 'Autorizar e vincular' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione o mesmo arquivo')
    expect(downloadDriveJson).not.toHaveBeenCalled()
    expect(await getDriveSync()).toEqual(previous)
  })
})
