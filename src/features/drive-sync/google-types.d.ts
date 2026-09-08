export {}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: { client_id: string; scope: string; include_granted_scopes?: boolean; callback: (response: { access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string }) => void }) => { requestAccessToken: (options?: { prompt?: string }) => void }
        }
      }
    }
  }
}
