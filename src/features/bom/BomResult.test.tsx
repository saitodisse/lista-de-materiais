import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProductRecord } from '../../domain/catalog'
import { BomResult } from './BomResult'
import { calculateBom } from './calculator'

const flour: ProductRecord = { id: 'flour', productCode: 'flour', name: 'Farinha', category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const bread: ProductRecord = { ...flour, id: 'bread', productCode: 'bread', name: 'Pão', category: 'p', unit: 'UN', purchaseQuoteValue: null, saleValue: 12, recipe: [{ id: 'flour', quantity: 0.5 }] }

describe('resultado BOM', () => {
  it('mostra consolidação e árvore calculadas', () => {
    const calculation = calculateBom([flour, bread], [{ listId: 'lista', productCode: 'bread', quantity: 2 }])
    render(<BomResult calculation={calculation} />)
    expect(screen.getByRole('heading', { name: 'Materiais consolidados' })).toBeInTheDocument()
    expect(screen.getByText('Farinha')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Árvore BOM' })).toBeInTheDocument()
    expect(screen.getByText(/Pão: 2 UN/)).toBeInTheDocument()
    expect(screen.getAllByText('Custo de compra')).toHaveLength(2)
    expect(screen.getByText('Valor de venda')).toBeInTheDocument()
    expect(screen.queryByText('Peso total')).not.toBeInTheDocument()
    expect(calculation.totalPurchaseCost).toBe(5)
    expect(calculation.totalSaleValue).toBe(24)
  })

  it('soma o custo de compra conhecido mesmo quando outro material não tem custo', () => {
    const waterWithoutCost: ProductRecord = { ...flour, id: 'water', productCode: 'water', name: 'Água', purchaseQuoteValue: null }
    const breadWithUnknownMaterial: ProductRecord = { ...bread, recipe: [{ id: 'flour', quantity: 0.5 }, { id: 'water', quantity: 1 }] }

    const calculation = calculateBom([flour, waterWithoutCost, breadWithUnknownMaterial], [{ listId: 'lista', productCode: 'bread', quantity: 2 }])

    expect(calculation.totalPurchaseCost).toBe(5)
    expect(calculation.totalSaleValue).toBe(24)
  })
})
