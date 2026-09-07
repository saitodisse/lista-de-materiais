import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseDriveFile } from './picker'

function installPicker() {
  let callback!: (response: { action: string; docs?: Array<{ id?: string; resourceKey?: string }> }) => void
  const setFileIds = vi.fn()
  const setAppId = vi.fn()
  const setVisible = vi.fn()
  window.gapi = { load: (_name, ready) => ready() }
  window.google = { picker: {
    Action: { PICKED: 'picked', CANCEL: 'cancel', ERROR: 'error' },
    ViewId: { DOCS: 'docs' },
    DocsView: class {
      setIncludeFolders = vi.fn()
      setMimeTypes = vi.fn()
      setFileIds = setFileIds
    },
    PickerBuilder: class {
      setDeveloperKey = vi.fn()
      setAppId = setAppId
      setOAuthToken = vi.fn()
      addView = vi.fn()
      setCallback(value: typeof callback) { callback = value }
      build() { return { setVisible } }
    },
  } }
  const script = document.createElement('script')
  script.id = 'google-api-js'
  document.head.appendChild(script)
  return { respond: (value: Parameters<typeof callback>[0]) => callback(value), setFileIds, setAppId, setVisible }
}

describe('seleção de arquivos autorizados no Drive', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-key')
    vi.stubEnv('VITE_GOOGLE_APP_ID', '123456')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    window.google = undefined
    window.gapi = undefined
    document.getElementById('google-api-js')?.remove()
  })

  it('só conclui após a seleção e preserva a chave de recurso', async () => {
    const google = installPicker()
    const result = chooseDriveFile('test-token', 'shared-file')
    await vi.waitFor(() => expect(google.setVisible).toHaveBeenCalledWith(true))
    const settled = vi.fn()
    void result.then(settled)

    google.respond({ action: 'loaded' })
    await Promise.resolve()
    expect(settled).not.toHaveBeenCalled()
    expect(google.setFileIds).toHaveBeenCalledWith('shared-file')
    expect(google.setAppId).toHaveBeenCalledWith('123456')

    google.respond({ action: 'picked', docs: [{ id: 'shared-file', resourceKey: 'resource-key' }] })
    await expect(result).resolves.toEqual({ fileId: 'shared-file', resourceKey: 'resource-key' })
  })

  it('retorna sem arquivo quando a seleção é cancelada', async () => {
    const google = installPicker()
    const result = chooseDriveFile('test-token')
    await vi.waitFor(() => expect(google.setVisible).toHaveBeenCalled())
    google.respond({ action: 'cancel' })
    await expect(result).resolves.toBeNull()
  })

  it('informa falha do seletor para permitir uma nova tentativa', async () => {
    const google = installPicker()
    const result = chooseDriveFile('test-token')
    await vi.waitFor(() => expect(google.setVisible).toHaveBeenCalled())
    const rejected = expect(result).rejects.toThrow('Não foi possível abrir o seletor')
    google.respond({ action: 'error' })
    await rejected
  })
})
