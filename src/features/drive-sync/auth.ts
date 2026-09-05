const GIS_URL = 'https://accounts.google.com/gsi/client'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive openid email'
export const GOOGLE_CONNECTION_PREFERENCE_KEY = 'lista-de-materiais:google-drive-connected'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

let session: { token: string; expiresAt: number } | null = null

function clientId(): string {
  const value = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!value) throw new Error('A integração Google Drive ainda não foi configurada neste build.')
  return value
}

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing) return existing.dataset.loaded === 'true' ? Promise.resolve() : new Promise((resolve, reject) => {
    existing.addEventListener('load', () => resolve(), { once: true })
    existing.addEventListener('error', () => reject(new Error('Não foi possível carregar a autenticação Google.')), { once: true })
  })
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve() }, { once: true })
    script.addEventListener('error', () => reject(new Error('Não foi possível carregar a autenticação Google.')), { once: true })
    document.head.appendChild(script)
  })
}

function hasGoogleConnectionPreference(): boolean {
  try { return window.localStorage.getItem(GOOGLE_CONNECTION_PREFERENCE_KEY) === '1' }
  catch { return false }
}

function rememberGoogleConnection(): void {
  try { window.localStorage.setItem(GOOGLE_CONNECTION_PREFERENCE_KEY, '1') }
  catch { /* localStorage may be unavailable in a restricted browser context. */ }
}

function forgetGoogleConnection(): void {
  try { window.localStorage.removeItem(GOOGLE_CONNECTION_PREFERENCE_KEY) }
  catch { /* localStorage may be unavailable in a restricted browser context. */ }
}

export { hasGoogleConnectionPreference }

async function requestAccessToken(prompt: '' | 'consent'): Promise<string> {
  await loadScript(GIS_URL, 'google-identity-services')
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new Error('A biblioteca de autenticação Google não está disponível.')
  return new Promise((resolve, reject) => {
    const callbackClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId(),
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response: TokenResponse) => {
        if (!response.access_token) {
          session = null
          reject(new Error(response.error_description ?? 'A autorização Google foi cancelada.'))
          return
        }
        session = { token: response.access_token, expiresAt: Date.now() + ((response.expires_in ?? 3600) - 30) * 1000 }
        resolve(response.access_token)
      },
    }) as TokenClient
    callbackClient.requestAccessToken({ prompt })
  })
}

export async function connectGoogleDrive(): Promise<string> {
  const token = await requestAccessToken('consent')
  rememberGoogleConnection()
  return token
}

export async function restoreGoogleDrive(): Promise<string> {
  if (!hasGoogleConnectionPreference()) throw new Error('Nenhuma sessão Google foi marcada para restauração.')
  const token = await requestAccessToken('')
  rememberGoogleConnection()
  return token
}

export function getGoogleAccessToken(): string {
  if (!session || session.expiresAt <= Date.now()) throw new Error('A sessão Google expirou. Conecte a conta novamente.')
  return session.token
}

export function isGoogleConnected(): boolean {
  return Boolean(session && session.expiresAt > Date.now())
}

export function disconnectGoogleDrive(): void {
  session = null
  forgetGoogleConnection()
}

export async function getGoogleAccountEmail(token: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) return null
    const value = await response.json() as { email?: string }
    return value.email ?? null
  } catch {
    return null
  }
}
