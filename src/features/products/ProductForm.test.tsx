import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductForm } from './ProductForm'

const existingProduct = {
  id: 'pao-integral',
  productCode: 'pao-integral',
  name: 'Pão integral',
  category: 'p' as const,
  unit: 'UN' as const,
  weight: null,
  purchaseQuoteValue: null,
  saleValue: null,
  notes: null,
  preparation: null,
  recipe: null,
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('formulário de Produto', () => {
  afterEach(() => cleanup())

  it('salva um novo Produto com o código normalizado', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProductForm products={[]} onSave={onSave} />)
    await user.type(screen.getByPlaceholderText('pao-integral-1-kg'), 'Pão Integral 1 kg')
    await user.tab()
    await user.type(screen.getByPlaceholderText('Ex.: Pão integral'), 'Pão integral')
    await user.type(screen.getByLabelText('Modo de preparo'), 'Asse até dourar.')
    await user.click(screen.getByRole('button', { name: 'Salvar Produto' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ id: 'pao-integral-1-kg', productCode: 'pao-integral-1-kg', name: 'Pão integral', preparation: 'Asse até dourar.', recipe: null })
  })

  it('bloqueia um novo Produto quando o código normalizado já existe', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProductForm products={[existingProduct]} onSave={onSave} />)

    const code = screen.getByPlaceholderText('pao-integral-1-kg')
    await user.type(code, 'Pão integral')
    await user.tab()

    expect(code).toHaveValue('pao-integral')
    expect(await screen.findByText('Já existe um Produto com o código “pao-integral”.')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Ex.: Pão integral'), 'Outro pão')
    await user.click(screen.getByRole('button', { name: 'Salvar Produto' }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('permite salvar após corrigir um código duplicado', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProductForm products={[existingProduct]} onSave={onSave} />)

    const code = screen.getByPlaceholderText('pao-integral-1-kg')
    await user.type(code, 'Pão integral')
    await user.tab()
    expect(await screen.findByText('Já existe um Produto com o código “pao-integral”.')).toBeInTheDocument()

    await user.clear(code)
    await user.type(code, 'Pão de milho')
    await user.tab()
    await user.type(screen.getByPlaceholderText('Ex.: Pão integral'), 'Pão de milho')
    await user.click(screen.getByRole('button', { name: 'Salvar Produto' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ productCode: 'pao-de-milho' })
  })

  it('mostra categoria e usa a ordenação de seleção nos componentes da Receita', async () => {
    const user = userEvent.setup()
    const rawMaterial = { ...existingProduct, id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm' as const, unit: 'KG' as const }
    render(<ProductForm products={[rawMaterial, existingProduct]} onSave={vi.fn().mockResolvedValue(undefined)} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar componente' }))

    const select = screen.getByRole('combobox', { name: 'Componente 1' })
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Selecione um Produto',
      'Pão integral · Produto Final · pao-integral',
      'Farinha · Materia-prima · farinha',
    ])
  })
})
