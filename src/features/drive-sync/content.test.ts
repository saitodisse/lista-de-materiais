import { describe, expect, it } from 'vitest'
import type { LocalDataExport } from '../../domain/catalog'
import { fingerprintLocalData, normalizeLocalData, normalizedLocalDataJson } from './content'

const data = (exportedAt: string, reverse = false): LocalDataExport => ({
  format: 'lista-de-materiais',
  version: 1,
  exportedAt,
  products: [{ id: 'b', productCode: 'b', name: 'B', category: 'm', unit: 'kg', weight: null, purchaseQuoteValue: null, saleValue: null, notes: null, preparation: null, recipe: [{ id: 'a', quantity: 2 }, { id: 'c', quantity: 1 }], imageUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' } as never, { id: 'a', productCode: 'a', name: 'A', category: 'm', unit: 'kg', weight: null, purchaseQuoteValue: null, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' } as never],
  materialLists: reverse ? [{ id: 'l2', name: 'L2', createdAt: '2026-01-01', updatedAt: '2026-01-01' }, { id: 'l1', name: 'L1', createdAt: '2026-01-01', updatedAt: '2026-01-01' }] : [{ id: 'l1', name: 'L1', createdAt: '2026-01-01', updatedAt: '2026-01-01' }, { id: 'l2', name: 'L2', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
  materialListEntries: reverse ? [{ listId: 'l2', productCode: 'b', quantity: 1 }, { listId: 'l1', productCode: 'a', quantity: 2 }] : [{ listId: 'l1', productCode: 'a', quantity: 2 }, { listId: 'l2', productCode: 'b', quantity: 1 }],
})

describe('conteúdo compartilhado', () => {
  it('ignora exportedAt e ordena registros para comparar cópias', () => {
    expect(fingerprintLocalData(data('2026-01-01'))).toBe(fingerprintLocalData(data('2026-02-01', true)))
    expect(normalizeLocalData(data('2026-01-01')).products[1]?.id).toBe('b')
    expect(normalizedLocalDataJson(data('2026-01-01'))).not.toContain('exportedAt')
  })

  it('muda a referência quando um valor do catálogo muda', () => {
    const changed = data('2026-01-01')
    changed.products[0]!.name = 'Outro nome'
    expect(fingerprintLocalData(changed)).not.toBe(fingerprintLocalData(data('2026-01-01')))
  })
})

