import { describe, expect, it } from 'vitest'
import { formatProductTreeInput, formatProductTreeQuantity, parseProductTreeInput, roundProductTreeDisplayValue } from './productTree'

describe('formatação da árvore de Produtos', () => {
    it('arredonda somente uma casa decimal quando a unidade exibida é G', () => {
      expect(roundProductTreeDisplayValue(2000.00108, 'G')).toBe(2000)
      expect(formatProductTreeInput(2000.00108, 'G')).toBe('2.000,0')
      expect(formatProductTreeQuantity(2000.00108, 'G')).toBe('2.000,0')
      expect(formatProductTreeInput(4237.29, 'G')).toBe('4.237,3')
      expect(formatProductTreeQuantity(4237.29, 'G')).toBe('4.237,3')
    })

    it('mantém a precisão existente nas demais unidades', () => {
      expect(formatProductTreeInput(1.56173, 'KG')).toBe('1,56173')
      expect(formatProductTreeQuantity(1.56173, 'KG')).toBe('1,56173')
      expect(formatProductTreeQuantity(3.93701, 'UN')).toBe('3,93701')
    })

    it('interpreta vírgula decimal e pontos de milhar no campo após o blur', () => {
      expect(parseProductTreeInput('1.000,00')).toBe(1000)
      expect(parseProductTreeInput('2.000,5')).toBe(2000.5)
      expect(parseProductTreeInput('3.123456')).toBe(3.123456)
      expect(parseProductTreeInput('2.000')).toBe(2000)
    })
})
