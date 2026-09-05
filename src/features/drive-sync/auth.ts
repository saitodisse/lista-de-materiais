const GIS_URL = 'https://accounts.google.com/gsi/client'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file openid email'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

let tokenClient: TokenClient | null = null
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

async function getTokenClient(): Promise<TokenClient> {
  await loadScript(GIS_URL, 'google-identity-services')
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new Error('A biblioteca de autenticação Google não está disponível.')
  tokenClient ??= oauth2.initTokenClient({
    client_id: clientId(),
    scope: DRIVE_SCOPE,
    callback: () => undefined,
  }) as TokenClient
  return tokenClient
}

export async function connectGoogleDrive(): Promise<string> {
  await getTokenClient()
  return new Promise((resolve, reject) => {
    const callbackClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId(),
      scope: DRIVE_SCOPE,
      callback: (response: TokenResponse) => {
        if (!response.access_token) {
          reject(new Error(response.error_description ?? 'A autorização Google foi cancelada.'))
          return
        }
        session = { token: response.access_token, expiresAt: Date.now() + ((response.expires_in ?? 3600) - 30) * 1000 }
        resolve(response.access_token)
      },
    }) as TokenClient
    callbackClient.requestAccessToken({ prompt: 'consent' })
  })
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
