import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState, ErrorNotice } from './Page'

describe('estados de orientação', () => {
  it('torna visíveis os estados vazio e de erro', () => {
    render(<><EmptyState title="Nenhum registro">Crie o primeiro.</EmptyState><ErrorNotice>Não foi possível salvar.</ErrorNotice></>)
    expect(screen.getByRole('heading', { name: 'Nenhum registro' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.')
  })
})
