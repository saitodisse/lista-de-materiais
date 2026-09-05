export function parseDriveReference(value: string): { fileId: string; resourceKey: string | null } | null {
  const input = value.trim()
  if (!input) return null
  try {
    const url = new URL(input)
    const pathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)
    const fileId = pathMatch?.[1] ?? url.searchParams.get('id') ?? url.searchParams.get('fileId')
    if (!fileId) return null
    return { fileId, resourceKey: url.searchParams.get('resourcekey') ?? url.searchParams.get('resourceKey') }
  } catch {
    return /^[a-zA-Z0-9_-]+$/.test(input) ? { fileId: input, resourceKey: null } : null
  }
}

