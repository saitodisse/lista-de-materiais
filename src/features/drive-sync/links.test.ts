import { describe, expect, it } from 'vitest'
import { parseDriveReference } from './links'

describe('links do Google Drive', () => {
  it('aceita ID, links do Drive e chave de recurso', () => {
    expect(parseDriveReference('abc_123-xyz')).toEqual({ fileId: 'abc_123-xyz', resourceKey: null })
    expect(parseDriveReference('https://drive.google.com/file/d/abc_123-xyz/view?resourcekey=rk-1')).toEqual({ fileId: 'abc_123-xyz', resourceKey: 'rk-1' })
    expect(parseDriveReference('https://drive.google.com/open?id=abc_123-xyz')).toEqual({ fileId: 'abc_123-xyz', resourceKey: null })
    expect(parseDriveReference('https://lista-de-materiais.com.br/configuracoes#drive=abc_123-xyz&resourceKey=rk-2')).toEqual({ fileId: 'abc_123-xyz', resourceKey: 'rk-2' })
    expect(parseDriveReference('/configuracoes#drive=abc_123-xyz&resourcekey=rk-3')).toEqual({ fileId: 'abc_123-xyz', resourceKey: 'rk-3' })
  })

  it('recusa texto que não identifica um arquivo', () => {
    expect(parseDriveReference('')).toBeNull()
    expect(parseDriveReference('https://example.com/arquivo')).toBeNull()
    expect(parseDriveReference('https://example.com/open?id=abc_123-xyz')).toBeNull()
    expect(parseDriveReference('https://example.com/configuracoes#drive=abc_123-xyz')).toBeNull()
    expect(parseDriveReference('https://drive.google.com/drive/folders/abc_123-xyz')).toBeNull()
  })
})
