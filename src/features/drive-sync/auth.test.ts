import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectGoogleDrive, disconnectGoogleDrive, hasGoogleConnectionPreference, restoreGoogleDrive, GOOGLE_CONNECTION_PREFERENCE_KEY, GOOGLE_DRIVE_SCOPE, GoogleDriveScopeError } from './auth'

function installGoogleIdentity(responses: Array<{ access_token?: string; expires_in?: number; scope?: string }> = []) {
  const requests: Array<{ prompt?: string }> = []
  const initTokenClient = vi.fn((options: { callback: (response: { access_token?: string; expires_in?: number }) => void }) => ({
    requestAccessToken: vi.fn((config?: { prompt?: string }) => {
      requests.push(config ?? {})
      options.callback(responses.shift() ?? { access_token: 'token-after-refresh', expires_in: 3600 })
    }),
  }))
  const script = document.createElement('script')
  script.id = 'google-identity-services'
  script.dataset.loaded = 'true'
  document.head.appendChild(script)
  window.google = { accounts: { oauth2: { initTokenClient } } }
  return { requests, initTokenClient }
}

describe('sessão Google Drive', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.googleusercontent.com')
    localStorage.clear()
    document.getElementById('google-identity-services')?.remove()
    window.google = undefined
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    disconnectGoogleDrive()
    localStorage.clear()
    document.getElementById('google-identity-services')?.remove()
    window.google = undefined
  })

  it('solicita acesso amplo ao Drive sem incorporar permissões anteriores', async () => {
    const google = installGoogleIdentity()

    await connectGoogleDrive()

    expect(GOOGLE_DRIVE_SCOPE.split(' ')).toEqual(['https://www.googleapis.com/auth/drive', 'openid', 'email'])
    expect(google.initTokenClient).toHaveBeenCalledWith(expect.objectContaining({
      scope: GOOGLE_DRIVE_SCOPE,
      include_granted_scopes: false,
    }))
  })

  it('restaura a sessão após F5 sem persistir o token', async () => {
    const google = installGoogleIdentity()
    localStorage.setItem(GOOGLE_CONNECTION_PREFERENCE_KEY, '1')

    await expect(restoreGoogleDrive()).resolves.toBe('token-after-refresh')

    expect(google.requests).toEqual([{ prompt: '' }])
    expect(hasGoogleConnectionPreference()).toBe(true)
    expect(localStorage.getItem('google-access-token')).toBeNull()
  })

  it('pede consentimento novamente quando a sessão restaurada não tem o escopo Drive', async () => {
    const google = installGoogleIdentity([
      { access_token: 'old-token', expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.file openid email' },
      { access_token: 'new-token', expires_in: 3600, scope: GOOGLE_DRIVE_SCOPE },
    ])
    localStorage.setItem(GOOGLE_CONNECTION_PREFERENCE_KEY, '1')

    await expect(restoreGoogleDrive()).resolves.toBe('new-token')

    expect(google.requests).toEqual([{ prompt: '' }, { prompt: 'consent' }])
  })

  it('recusa uma autorização explícita que não concede o escopo necessário', async () => {
    installGoogleIdentity([{ access_token: 'old-token', expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.file openid email' }])

    await expect(connectGoogleDrive()).rejects.toBeInstanceOf(GoogleDriveScopeError)
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
