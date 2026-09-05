import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectGoogleDrive, disconnectGoogleDrive, hasGoogleConnectionPreference, restoreGoogleDrive, GOOGLE_CONNECTION_PREFERENCE_KEY, GOOGLE_DRIVE_SCOPE } from './auth'

function installGoogleIdentity() {
  const requests: Array<{ prompt?: string }> = []
  const initTokenClient = vi.fn((options: { callback: (response: { access_token?: string; expires_in?: number }) => void }) => ({
    requestAccessToken: vi.fn((config?: { prompt?: string }) => {
      requests.push(config ?? {})
      options.callback({ access_token: 'token-after-refresh', expires_in: 3600 })
    }),
  }))
  const script = document.createElement('script')
  script.id = 'google-identity-services'
  script.dataset.loaded = 'true'
  document.head.appendChild(script)
  window.google = { accounts: { oauth2: { initTokenClient } } }
  return { requests }
}

describe('sessão Google Drive', () => {
  beforeEach(() => {
    localStorage.clear()
    document.getElementById('google-identity-services')?.remove()
    window.google = undefined
  })

  afterEach(() => {
    disconnectGoogleDrive()
    localStorage.clear()
    document.getElementById('google-identity-services')?.remove()
    window.google = undefined
  })

  it('usa o escopo Drive completo para permitir arquivos compartilhados por ID', () => {
    expect(GOOGLE_DRIVE_SCOPE).toContain('https://www.googleapis.com/auth/drive ')
    expect(GOOGLE_DRIVE_SCOPE).not.toContain('https://www.googleapis.com/auth/drive.file')
  })

  it('restaura a sessão após F5 sem persistir o token', async () => {
    const google = installGoogleIdentity()
    localStorage.setItem(GOOGLE_CONNECTION_PREFERENCE_KEY, '1')

    await expect(restoreGoogleDrive()).resolves.toBe('token-after-refresh')

    expect(google.requests).toEqual([{ prompt: '' }])
    expect(hasGoogleConnectionPreference()).toBe(true)
    expect(localStorage.getItem('google-access-token')).toBeNull()
  })

  it('marca a preferência somente depois da autorização explícita', async () => {
    const google = installGoogleIdentity()

    await expect(connectGoogleDrive()).resolves.toBe('token-after-refresh')

    expect(google.requests).toEqual([{ prompt: 'consent' }])
    expect(localStorage.getItem(GOOGLE_CONNECTION_PREFERENCE_KEY)).toBe('1')
  })

  it('remove a preferência quando a pessoa desconecta explicitamente', async () => {
    installGoogleIdentity()
    await connectGoogleDrive()

    disconnectGoogleDrive()

    expect(hasGoogleConnectionPreference()).toBe(false)
  })
})
