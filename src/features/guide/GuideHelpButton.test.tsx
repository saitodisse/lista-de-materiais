import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuideHelpButton } from './GuideHelpButton'

const tourMocks = vi.hoisted(() => ({
  hasSeenScreenGuide: vi.fn(),
  markScreenGuideSeen: vi.fn(),
  startGuideTour: vi.fn(),
  stopGuideTour: vi.fn(),
}))

vi.mock('./tours', () => tourMocks)

describe('botão de ajuda das telas', () => {
  beforeEach(() => {
    tourMocks.hasSeenScreenGuide.mockReturnValue(false)
    tourMocks.startGuideTour.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('inicia automaticamente uma vez e grava a tela após abrir o tour', async () => {
    render(<GuideHelpButton topic="catalogo-tabela" />)

    await waitFor(() => expect(tourMocks.startGuideTour).toHaveBeenCalledWith('catalogo-tabela'))
    expect(tourMocks.markScreenGuideSeen).toHaveBeenCalledWith('catalogo-tabela')
  })

  it('não inicia automaticamente uma tela já vista, mas permite reabrir pelo botão', async () => {
    const user = userEvent.setup()
    tourMocks.hasSeenScreenGuide.mockReturnValue(true)

    render(<GuideHelpButton topic="detalhe-produto" />)

    expect(tourMocks.startGuideTour).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Abrir ajuda desta tela' }))
    expect(tourMocks.startGuideTour).toHaveBeenCalledWith('detalhe-produto')
  })
})
