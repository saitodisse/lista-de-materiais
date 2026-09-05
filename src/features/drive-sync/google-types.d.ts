export {}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: { client_id: string; scope: string; callback: (response: { access_token?: string; expires_in?: number; error?: string; error_description?: string }) => void }) => { requestAccessToken: (options?: { prompt?: string }) => void }
        }
      }
      picker?: {
        Action: { PICKED: string; CANCEL: string }
        DocsView: new (viewId?: string) => { setIncludeFolders: (value: boolean) => unknown; setMimeTypes: (value: string) => unknown; setFileIds: (value: string) => unknown }
        ViewId: { DOCS: string }
        PickerBuilder: new () => {
          setDeveloperKey: (value: string) => unknown
          setAppId: (value: string) => unknown
          setOAuthToken: (value: string) => unknown
          addView: (value: unknown) => unknown
          setCallback: (value: (response: { action: string; docs?: Array<{ id?: string; name?: string; resourceKey?: string }> }) => void) => unknown
          build: () => { setVisible: (value: boolean) => void }
        }
      }
    }
  }

  interface Window {
    gapi?: { load: (name: string, callback: () => void) => void }
  }
}

