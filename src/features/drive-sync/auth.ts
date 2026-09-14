import { getDriveSync, getGoogleProfile, PRINCIPAL_PROFILE_ID, saveGoogleProfile, type GoogleProfileRecord } from '../../db/database'

const GIS_URL = 'https://accounts.google.com/gsi/client'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive openid email'
export const GOOGLE_DRIVE_REQUIRED_SCOPE = 'https://www.googleapis.com/auth/drive'
export const GOOGLE_CONNECTION_PREFERENCE_KEY = 'lista-de-materiais:google-drive-connected'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

export interface GoogleAccountProfile {
  sub: string
  email: string | null
  emailVerified: boolean | null
}

interface GoogleSession {
  token: string
  expiresAt: number
  grantedScopes: Set<string> | null
  profileId?: string
  accountProfile: GoogleAccountProfile | null
}

export class GoogleDriveScopeError extends Error {
  constructor() {
    super('A autorização Google não concedeu acesso amplo ao Google Drive. Autorize novamente para recuperar arquivos compartilhados.')
    this.name = 'GoogleDriveScopeError'
  }
}

export class GoogleAccountMismatchError extends Error {
  constructor() {
    super('A conta Google restaurada não corresponde à conta lembrada neste Perfil local. Conecte a conta explicitamente para trocar de usuário.')
    this.name = 'GoogleAccountMismatchError'
  }
}

let session: GoogleSession | null = null

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

function hasGoogleConnectionPreference(profileId?: string): boolean {
  if (profileId && profileId !== PRINCIPAL_PROFILE_ID) return false
  try { return window.localStorage.getItem(GOOGLE_CONNECTION_PREFERENCE_KEY) === '1' }
  catch { return false }
}

function rememberGoogleConnection(profileId?: string): void {
  if (profileId) return
  try { window.localStorage.setItem(GOOGLE_CONNECTION_PREFERENCE_KEY, '1') }
  catch { /* localStorage may be unavailable in a restricted browser context. */ }
}

function forgetGoogleConnection(): void {
  try { window.localStorage.removeItem(GOOGLE_CONNECTION_PREFERENCE_KEY) }
  catch { /* localStorage may be unavailable in a restricted browser context. */ }
}

export { hasGoogleConnectionPreference }

function parseGrantedScopes(scope: string | undefined): Set<string> | null {
  if (!scope) return null
  return new Set(scope.split(/\s+/).filter(Boolean))
}

function hasRequiredScope(scopes: Set<string> | null): boolean {
  return scopes === null || scopes.has(GOOGLE_DRIVE_REQUIRED_SCOPE)
}

async function requestAccessToken(prompt: '' | 'consent', profileId?: string, loginHint?: string): Promise<string> {
  await loadScript(GIS_URL, 'google-identity-services')
  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) throw new Error('A biblioteca de autenticação Google não está disponível.')
  return new Promise((resolve, reject) => {
    const callbackClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId(),
      scope: GOOGLE_DRIVE_SCOPE,
      include_granted_scopes: false,
      ...(loginHint ? { login_hint: loginHint } : {}),
      callback: (response: TokenResponse) => {
        if (!response.access_token) {
          session = null
          reject(new Error(response.error_description ?? 'A autorização Google foi cancelada.'))
          return
        }
        const grantedScopes = parseGrantedScopes(response.scope)
        if (!hasRequiredScope(grantedScopes)) {
          session = null
          reject(new GoogleDriveScopeError())
          return
        }
        session = { token: response.access_token, expiresAt: Date.now() + ((response.expires_in ?? 3600) - 30) * 1000, grantedScopes, profileId, accountProfile: null }
        resolve(response.access_token)
      },
    }) as TokenClient
    callbackClient.requestAccessToken({ prompt })
  })
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function fetchGoogleAccountProfile(token: string): Promise<GoogleAccountProfile | null> {
  try {
    const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) return null
    const value = await response.json() as { sub?: unknown; email?: unknown; email_verified?: unknown }
    const sub = cleanString(value.sub)
    if (!sub) return null
    return { sub, email: cleanString(value.email), emailVerified: typeof value.email_verified === 'boolean' ? value.email_verified : null }
  } catch {
    return null
  }
}

async function loadGoogleAccountProfile(token: string): Promise<GoogleAccountProfile | null> {
  if (session?.token === token && session.accountProfile) return session.accountProfile
  const account = await fetchGoogleAccountProfile(token)
  if (session?.token === token) session.accountProfile = account
  return account
}

function isSameGoogleAccount(stored: GoogleProfileRecord, current: GoogleAccountProfile): boolean {
  if (stored.subject) return stored.subject === current.sub
  if (stored.email && current.email) return stored.email.toLocaleLowerCase() === current.email.toLocaleLowerCase()
  return true
}

async function rememberGoogleAccount(token: string, profileId?: string, expected?: GoogleProfileRecord): Promise<GoogleAccountProfile | null> {
  const account = await loadGoogleAccountProfile(token)
  if (!profileId || !account) return account
  if (expected && !isSameGoogleAccount(expected, account)) {
    session = null
    throw new GoogleAccountMismatchError()
  }
  const now = new Date().toISOString()
  await saveGoogleProfile({
    key: 'account',
    subject: account.sub,
    email: account.email,
    emailVerified: account.emailVerified,
    connectedAt: expected?.connectedAt ?? now,
    lastSeenAt: now,
  }, profileId)
  return account
}

export async function connectGoogleDrive(profileId?: string): Promise<string> {
  const token = await requestAccessToken('consent', profileId)
  await rememberGoogleAccount(token, profileId)
  rememberGoogleConnection(profileId)
  return token
}

export async function restoreGoogleDrive(profileId?: string): Promise<string> {
  const remembered = profileId ? await getGoogleProfile(profileId) : undefined
  const legacyDrive = profileId ? await getDriveSync(profileId) : undefined
  const shouldRestore = Boolean(remembered || legacyDrive?.accountEmail || hasGoogleConnectionPreference(profileId))
  if (!shouldRestore) throw new Error('Nenhuma sessão Google foi marcada para restauração.')
  const loginHint = remembered?.email ?? legacyDrive?.accountEmail ?? undefined
  let token: string
  try {
    token = await requestAccessToken('', profileId, loginHint)
  } catch (reason) {
    if (!(reason instanceof GoogleDriveScopeError)) throw reason
    token = await requestAccessToken('consent', profileId, loginHint)
  }
  await rememberGoogleAccount(token, profileId, remembered)
  rememberGoogleConnection(profileId)
  return token
}

export function getGoogleAccessToken(profileId?: string): string {
  if (!session || session.expiresAt <= Date.now()) throw new Error('A sessão Google expirou. Conecte a conta novamente.')
  if (profileId !== undefined && session.profileId !== profileId) throw new Error('A conta Google não está conectada a este Perfil local. Reconecte a conta para continuar.')
  if (!hasRequiredScope(session.grantedScopes)) throw new GoogleDriveScopeError()
  return session.token
}

export function isGoogleConnected(profileId?: string): boolean {
  return Boolean(session && session.expiresAt > Date.now() && (profileId === undefined || session.profileId === profileId) && hasRequiredScope(session.grantedScopes))
}

export function hasGoogleDriveScope(profileId?: string): boolean {
  return Boolean(session && session.expiresAt > Date.now() && (profileId === undefined || session.profileId === profileId) && hasRequiredScope(session.grantedScopes))
}

export function disconnectGoogleDrive(profileId?: string): void {
  if (profileId === undefined || session?.profileId === profileId) session = null
  forgetGoogleConnection()
}

export async function getGoogleAccountEmail(token: string, profileId?: string): Promise<string | null> {
  const account = await rememberGoogleAccount(token, profileId)
  return account?.email ?? null
}
