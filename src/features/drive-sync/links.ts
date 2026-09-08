const FILE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/
const DRIVE_HOSTS = new Set(['drive.google.com', 'www.drive.google.com', 'docs.google.com'])
const APP_HOSTS = new Set([
  'lista-de-materiais.com.br',
  'www.lista-de-materiais.com.br',
  'listademateriais.vercel.app',
  'www.listademateriais.vercel.app',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
])

function resourceKeyFrom(params: URLSearchParams): string | null {
  const value = params.get('resourcekey') ?? params.get('resourceKey')
  return value || null
}

function validFileId(value: string | null): string | null {
  return value && FILE_ID_PATTERN.test(value) ? value : null
}

function parseAppReference(pathAndHash: string): { fileId: string; resourceKey: string | null } | null {
  const hashIndex = pathAndHash.indexOf('#')
  if (hashIndex < 0 || pathAndHash.slice(0, hashIndex).replace(/\/$/, '') !== '/configuracoes') return null
  const params = new URLSearchParams(pathAndHash.slice(hashIndex + 1))
  const fileId = validFileId(params.get('drive'))
  return fileId ? { fileId, resourceKey: resourceKeyFrom(params) } : null
}

export function parseDriveReference(value: string): { fileId: string; resourceKey: string | null } | null {
  const input = value.trim()
  if (!input) return null
  if (FILE_ID_PATTERN.test(input)) return { fileId: input, resourceKey: null }
  const relativeAppReference = parseAppReference(input)
  if (relativeAppReference) return relativeAppReference

  let url: URL
  try { url = new URL(input) }
  catch { return null }

  if (DRIVE_HOSTS.has(url.hostname.toLowerCase())) {
    const pathMatch = url.pathname.match(/\/d\/([^/]+)/)
    const fileId = validFileId(pathMatch?.[1] ?? url.searchParams.get('id') ?? url.searchParams.get('fileId'))
    if (!fileId) return null
    return { fileId, resourceKey: resourceKeyFrom(url.searchParams) }
  }

  if (APP_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.replace(/\/$/, '') === '/configuracoes') {
    const hash = url.hash.replace(/^#/, '')
    const hashParams = new URLSearchParams(hash)
    const fileId = validFileId(hashParams.get('drive'))
    if (!fileId) return null
    return { fileId, resourceKey: resourceKeyFrom(hashParams) ?? resourceKeyFrom(url.searchParams) }
  }

  return null
}
