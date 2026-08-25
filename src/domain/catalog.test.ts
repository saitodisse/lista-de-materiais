import { describe, expect, it } from 'vitest'
import type { ProductRecord } from './catalog'
import { categoryOptions, findRecipeIssues, normalizeProductCategory, productSelectionLabel, slugify, sortProductsForSelection, validateProductRecord } from './catalog'
import { calculateBom } from '../features/bom/calculator'

function product(overrides: Partial<ProductRecord>): ProductRecord {
  const code = overrides.productCode ?? overrides.id ?? 'produto'
  return {
    id: code,
    productCode: code,
    name: code,
    category: 'm',
    unit: 'KG',
    weight: null,
    purchaseQuoteValue: 1,
    saleValue: null,
    notes: null,
    preparation: null,
    recipe: null,
    imageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('catálogo local', () => {
  it('normaliza o código para um slug estável', () => {
    expect(slugify(' Pão Integral 1 kg ')).toBe('pao-integral-1-kg')
  })

  it('rejeita componentes inexistentes, repetidos e autorreferência', () => {
    const issues = findRecipeIssues({
      productCode: 'pao',
      recipe: [{ id: 'pao', quantity: 1 }, { id: 'ausente', quantity: 1 }, { id: 'ausente', quantity: 2 }],
    }, [])
    expect(issues.join(' ')).toMatch(/não pode usar a si mesmo/i)
    expect(issues.join(' ')).toMatch(/não existe/i)
    expect(issues.join(' ')).toMatch(/mais de uma vez/i)
  })

  it('rejeita um segundo Produto com o mesmo código', () => {
    const current = product({ id: 'farinha-a', productCode: 'farinha' })
    const duplicate = product({ id: 'farinha-b', productCode: 'farinha' })
    expect(() => validateProductRecord(duplicate, [current])).toThrow(/Já existe um Produto/i)
  })

  it('ordena Produtos de seleção por categoria e nome em português', () => {
    const products = [
      product({ id: 'amaciante', productCode: 'amaciante', name: 'Amaciante', category: 'm' }),
      product({ id: 'semi', productCode: 'semi', name: 'Massa base', category: 's' }),
      product({ id: 'final', productCode: 'final', name: 'Pão integral', category: 'p' }),
      product({ id: 'embalagem', productCode: 'embalagem', name: 'Saco de papel', category: 'e' }),
      product({ id: 'agua', productCode: 'agua', name: 'Água filtrada', category: 'm' }),
      product({ id: 'unitario', productCode: 'unitario', name: 'Pão individual', category: 'u' }),
    ]

    const ordered = sortProductsForSelection(products)

    expect(ordered.map((item) => item.productCode)).toEqual(['final', 'unitario', 'semi', 'agua', 'amaciante', 'embalagem'])
    expect(productSelectionLabel(ordered[0]!)).toBe('Pão integral · Produto Final · final')
  })

  it('consolida as categorias antigas de limpeza em Outros', () => {
    expect(categoryOptions.map((category) => category.descriptionPtBr)).toContain('Outros')
    expect(categoryOptions.map((category) => category.descriptionPtBr)).not.toContain('Limpeza')
    expect(categoryOptions.map((category) => category.id)).not.toContain('l')
    expect(normalizeProductCategory('l')).toBe('c')
    expect(productSelectionLabel(product({ category: 'c' }))).toContain('Outros')
  })

  it('detecta ciclo ao editar uma receita', () => {
    const farinha = product({ id: 'farinha', productCode: 'farinha' })
    const massa = product({ id: 'massa', productCode: 'massa', category: 's', recipe: [{ id: 'farinha', quantity: 1 }] })
    const issues = findRecipeIssues({ productCode: 'farinha', recipe: [{ id: 'massa', quantity: 1 }] }, [farinha, massa])
    expect(issues.join(' ')).toMatch(/ciclo/i)
  })

  it('consolida materiais terminais de vários Produtos pela biblioteca BOM', () => {
    const farinha = product({ id: 'farinha', productCode: 'farinha', name: 'Farinha', purchaseQuoteValue: 5 })
    const embalagem = product({ id: 'embalagem', productCode: 'embalagem', name: 'Embalagem', category: 'e', unit: 'UN', weight: 0.01, purchaseQuoteValue: 0.5 })
    const bolo = product({ id: 'bolo', productCode: 'bolo', name: 'Bolo', category: 'p', unit: 'UN', purchaseQuoteValue: null, recipe: [{ id: 'farinha', quantity: 0.4 }, { id: 'embalagem', quantity: 1 }] })
    const calculation = calculateBom([farinha, embalagem, bolo], [
      { listId: 'lista', productCode: 'bolo', quantity: 2 },
      { listId: 'lista', productCode: 'farinha', quantity: 1 },
    ])
    expect(calculation.materials).toEqual(expect.arrayContaining([
      expect.objectContaining({ productCode: 'farinha', quantity: 1.8, unit: 'KG' }),
      expect.objectContaining({ productCode: 'embalagem', quantity: 2, unit: 'UN' }),
    ]))
    expect(calculation.trees).toHaveLength(2)
  })
})
