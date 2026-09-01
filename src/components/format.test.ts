import { describe, expect, it } from 'vitest'
import { formatCurrency, formatNumber, formatQuantity } from './format'

describe('formatação numérica', () => {
  it('usa separador de milhar e vírgula decimal no padrão pt-BR', () => {
    expect(formatNumber(1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe('1.000,00')
    expect(formatQuantity(1000.5)).toBe('1.000,5')
    expect(formatCurrency(1000)).toMatch(/R\$\s*1\.000,00/)
  })
})
