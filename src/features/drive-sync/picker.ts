function loadPickerScript(): Promise<void> {
  const existing = document.getElementById('google-api-js') as HTMLScriptElement | null
  if (existing) return new Promise((resolve, reject) => {
    if (window.gapi) { resolve(); return }
    existing.addEventListener('load', () => resolve(), { once: true })
    existing.addEventListener('error', () => reject(new Error('Não foi possível carregar o seletor do Google Drive.')), { once: true })
  })
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'google-api-js'
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Não foi possível carregar o seletor do Google Drive.')), { once: true })
    document.head.appendChild(script)
  })
}

async function loadPicker(): Promise<void> {
  await loadPickerScript()
  if (!window.gapi) throw new Error('A biblioteca do Google Picker não está disponível.')
  await new Promise<void>((resolve) => window.gapi?.load('picker', resolve))
}

export async function chooseDriveFile(token: string, fileId?: string): Promise<{ fileId: string; resourceKey: string | null } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
  const appId = import.meta.env.VITE_GOOGLE_APP_ID as string | undefined
  if (!apiKey || !appId) throw new Error('A configuração do Google Picker está incompleta neste build.')
  await loadPicker()
  const google = window.google
  const pickerApi = google?.picker
  if (!pickerApi) throw new Error('O Google Picker não está disponível.')
  return new Promise((resolve) => {
    const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS)
    view.setIncludeFolders(false)
    view.setMimeTypes('application/json')
    if (fileId) view.setFileIds(fileId)
    const builder = new pickerApi.PickerBuilder()
    builder.setDeveloperKey(apiKey)
    builder.setAppId(appId)
    builder.setOAuthToken(token)
    builder.addView(view)
    builder.setCallback((response: { action: string; docs?: Array<{ id?: string; name?: string; resourceKey?: string }> }) => {
        if (response.action !== pickerApi.Action.PICKED) { resolve(null); return }
        const document = response.docs?.[0]
        resolve(document?.id ? { fileId: document.id, resourceKey: document.resourceKey ?? null } : null)
    })
    const picker = builder.build()
    picker.setVisible(true)
  })
}
