import { parseLocalDataExport, type LocalDataExport, validateLocalDataExport } from '../../domain/catalog'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  modifiedTime: string | null
  webViewLink: string | null
  resourceKey: string | null
  version: string | null
  capabilities: { canDownload?: boolean; canModifyContent?: boolean }
}

export interface DriveRemoteFile {
  metadata: DriveFileMetadata
  data: LocalDataExport
  etag: string | null
}

export class DriveApiError extends Error {
  readonly status: number
  readonly reason: string | null
  readonly retryable: boolean

  constructor(message: string, status: number, reason: string | null = null) {
    super(message)
    this.name = 'DriveApiError'
    this.status = status
    this.reason = reason
    this.retryable = status === 408 || status === 429 || status >= 500
  }
}

export function describeDriveApiError(error: DriveApiError): string {
  if (error.reason === 'accessNotConfigured') return 'A Google Drive API não está habilitada no projeto deste cliente OAuth. Habilite a Drive API no Google Cloud e tente novamente.'
  if (error.reason === 'insufficientPermissions') return 'A autorização Google não concedeu a permissão necessária para criar ou alterar este arquivo. Desconecte a conta, autorize novamente e tente outra vez.'
  if (error.reason === 'insufficientFilePermissions') return 'A conta tem acesso de leitura, mas não pode alterar este arquivo. Peça permissão de editor ao proprietário.'
  if (error.reason === 'appNotAuthorizedToFile') return 'O aplicativo ainda não foi autorizado para este arquivo. Escolha o arquivo pelo Google Picker antes de vinculá-lo.'
  if (error.reason === 'storageQuotaExceeded') return 'A conta Google não tem espaço disponível para criar este arquivo.'
  if (error.reason === 'dailyLimitExceeded' || error.reason === 'rateLimitExceeded' || error.reason === 'userRateLimitExceeded') return 'O projeto ou a conta atingiu o limite de solicitações do Google Drive. Aguarde e tente novamente.'
  if (error.reason === 'domainPolicy') return 'Uma política da organização Google Workspace bloqueou esta operação.'
  if (error.status === 403) return `O Google Drive recusou a operação${error.reason ? ` (${error.reason})` : ''}. Verifique a permissão da conta e a configuração da API.`
  return error.message
}

function resourceKeyHeader(fileId: string, resourceKey: string | null | undefined): Record<string, string> {
  return resourceKey ? { 'X-Goog-Drive-Resource-Keys': `${fileId}/${resourceKey}` } : {}
}

async function errorFromResponse(response: Response): Promise<DriveApiError> {
  let reason: string | null = null
  let message = `O Google Drive retornou o erro ${response.status}.`
  try {
    const body = await response.json() as { error?: { message?: string; errors?: Array<{ reason?: string }> } }
    reason = body.error?.errors?.[0]?.reason ?? null
    message = body.error?.message ?? message
  } catch {
    // The response may be an HTML gateway error or an empty response.
  }
  return new DriveApiError(message, response.status, reason)
}

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit): Promise<{ value: T; response: Response }> {
  const response = await fetch(input, init)
  if (!response.ok) throw await errorFromResponse(response)
  return { value: await response.json() as T, response }
}

function fields(): string {
  return 'id,name,mimeType,modifiedTime,webViewLink,resourceKey,version,capabilities(canDownload,canModifyContent)'
}

function mapMetadata(value: Partial<DriveFileMetadata>): DriveFileMetadata {
  return {
    id: value.id ?? '',
    name: value.name ?? 'arquivo JSON',
    mimeType: value.mimeType ?? 'application/json',
    modifiedTime: value.modifiedTime ?? null,
    webViewLink: value.webViewLink ?? null,
    resourceKey: value.resourceKey ?? null,
    version: value.version ?? null,
    capabilities: value.capabilities ?? {},
  }
}

export async function getDriveFileMetadata(token: string, fileId: string, resourceKey?: string | null): Promise<{ metadata: DriveFileMetadata; etag: string | null }> {
  const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=${encodeURIComponent(fields())}`
  const { value, response } = await requestJson<DriveFileMetadata>(url, {
    headers: { Authorization: `Bearer ${token}`, ...resourceKeyHeader(fileId, resourceKey) },
  })
  return { metadata: mapMetadata(value), etag: response.headers.get('etag') }
}

export async function downloadDriveJson(token: string, fileId: string, resourceKey?: string | null): Promise<DriveRemoteFile> {
  const metadataResponse = await getDriveFileMetadata(token, fileId, resourceKey)
  const response = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}`, ...resourceKeyHeader(fileId, resourceKey ?? metadataResponse.metadata.resourceKey) },
  })
  if (!response.ok) throw await errorFromResponse(response)
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new DriveApiError('O arquivo do Drive não contém um JSON válido.', 422, 'invalidJson')
  }
  const parsed = parseLocalDataExport(data)
  validateLocalDataExport(parsed)
  return { metadata: metadataResponse.metadata, data: parsed, etag: response.headers.get('etag') ?? metadataResponse.etag }
}

function multipartBody(metadata: Record<string, string>, json: string, boundary: string): string {
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    json,
    `--${boundary}--`,
    '',
  ].join('\r\n')
}

export async function createDriveJsonFile(token: string, data: LocalDataExport): Promise<{ metadata: DriveFileMetadata; etag: string | null }> {
  const boundary = `listaMateriais${Date.now().toString(36)}`
  const { value, response } = await requestJson<DriveFileMetadata>(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=${encodeURIComponent(fields())}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody({ name: 'lista-de-materiais.json', mimeType: 'application/json' }, JSON.stringify(data), boundary),
  })
  return { metadata: mapMetadata(value), etag: response.headers.get('etag') }
}

export async function updateDriveJsonFile(token: string, fileId: string, data: LocalDataExport, resourceKey?: string | null, expectedEtag?: string | null): Promise<{ metadata: DriveFileMetadata; etag: string | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...resourceKeyHeader(fileId, resourceKey),
  }
  if (expectedEtag) headers['If-Match'] = expectedEtag
  const { value, response } = await requestJson<DriveFileMetadata>(`${DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=media&supportsAllDrives=true&fields=${encodeURIComponent(fields())}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  return { metadata: mapMetadata(value), etag: response.headers.get('etag') }
}
