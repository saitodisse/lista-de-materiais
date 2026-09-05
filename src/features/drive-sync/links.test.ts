import { describe, expect, it } from 'vitest'
import { parseDriveReference } from './links'

describe('links do Google Drive', () => {
  it('aceita ID, link /file/d e chave de recurso', () => {
    expect(parseDriveReference('abc_123-xyz')).toEqual({ fileId: 'abc_123-xyz', resourceKey: null })
    expect(parseDriveReference('https://drive.google.com/file/d/abc_123-xyz/view?resourcekey=rk-1')).toEqual({ fileId: 'abc_123-xyz', resourceKey: 'rk-1' })
    expect(parseDriveReference('https://drive.google.com/open?id=abc_123-xyz')).toEqual({ fileId: 'abc_123-xyz', resourceKey: null })
  })

  it('recusa texto que não identifica um arquivo', () => {
    expect(parseDriveReference('')).toBeNull()
    expect(parseDriveReference('https://example.com/arquivo')).toBeNull()
  })
})

