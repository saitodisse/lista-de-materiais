import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProductRecord } from '../../domain/catalog'
import { MaterialListForm } from './MaterialListForm'

const flour: ProductRecord = { id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const finalProduct: ProductRecord = { ...flour, id: 'pao', productCode: 'pao', name: 'Pão', category: 'p', unit: 'UN' }

describe('formulário de Lista de Materiais', () => {
  afterEach(() => cleanup())

  it('monta uma Lista com Produto e quantidade desejada', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<MaterialListForm entries={[]} products={[flour]} onSave={onSave} />)
    await user.type(screen.getByPlaceholderText('Ex.: 100 pães integrais'), 'Compra semanal')
    await user.click(screen.getByRole('button', { name: 'Adicionar Produto' }))
    await user.selectOptions(screen.getByRole('combobox'), 'farinha')
    await user.clear(screen.getByRole('spinbutton'))
    await user.type(screen.getByRole('spinbutton'), '3')
    await user.click(screen.getByRole('button', { name: 'Salvar Lista' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Compra semanal', [{ productCode: 'farinha', quantity: 3 }]))
  })

  it('mostra categoria e usa a ordenação de seleção nos Produtos da Lista', async () => {
    const user = userEvent.setup()
    render(<MaterialListForm entries={[]} products={[flour, finalProduct]} onSave={vi.fn().mockResolvedValue(undefined)} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar Produto' }))

    const select = screen.getByRole('combobox', { name: 'Produto 1' })
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Selecione um Produto',
      'Pão · Produto Final · pao',
      'Farinha · Materia-prima · farinha',
    ])
  })
})
