import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDataExport } from '../../domain/catalog'
import { DriveApiError, downloadDriveJson, updateDriveJsonFile } from './client'

const validData: LocalDataExport = { format: 'lista-de-materiais', version: 1, exportedAt: '2026-01-01T00:00:00.000Z', products: [], materialLists: [], materialListEntries: [] }

afterEach(() => vi.restoreAllMocks())

describe('cliente Google Drive', () => {
  it('consulta metadados, envia resource key e valida o JSON baixado', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'file-1', name: 'dados.json', mimeType: 'application/json', capabilities: { canModifyContent: true } }), { status: 200, headers: { etag: '"one"' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(validData), { status: 200, headers: { etag: '"one"' } }))

    const remote = await downloadDriveJson('token', 'file-1', 'resource-1')

    expect(remote.data).toMatchObject(validData)
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/files/file-1')
    const metadataInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(metadataInit?.headers).toMatchObject({ 'X-Goog-Drive-Resource-Keys': 'file-1/resource-1' })
  })

  it('envia If-Match para evitar substituir uma versão consultada', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'file-1', name: 'dados.json', mimeType: 'application/json', capabilities: { canModifyContent: true } }), { status: 200, headers: { etag: '"two"' } }))
    await updateDriveJsonFile('token', 'file-1', validData, 'resource-1', '"one"')
    const updateInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(updateInit?.headers).toMatchObject({ 'If-Match': '"one"' })
  })

  it('transforma erro HTTP em DriveApiError sem tentar um novo envio', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Precondition Failed', errors: [{ reason: 'conditionNotMet' }] } }), { status: 412 }))
    await expect(updateDriveJsonFile('token', 'file-1', validData, null, '"old"')).rejects.toMatchObject({ status: 412, reason: 'conditionNotMet' } satisfies Partial<DriveApiError>)
  })
})
