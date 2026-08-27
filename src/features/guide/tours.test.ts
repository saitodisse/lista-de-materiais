import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { guideTourSteps, hasSeenScreenGuide, markScreenGuideSeen, startGuideTour, stopGuideTour } from './tours'

const fakeDriver = {
  drive: vi.fn(),
  destroy: vi.fn(),
}

vi.mock('driver.js', () => ({
  driver: vi.fn(() => fakeDriver),
}))

describe('tours do guia', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.body.innerHTML = Object.values(guideTourSteps).flat().map((step) => `<div data-guide="${String(step.element).match(/data-guide="([^"]+)/)?.[1] ?? ''}"></div>`).join('')
  })

  afterEach(() => {
    stopGuideTour()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('define os quatro assuntos do guia e os três tours de tela', () => {
    expect(Object.keys(guideTourSteps)).toEqual(['produto', 'arvore', 'lista', 'json', 'catalogo-tabela', 'detalhe-produto', 'edicao-produto'])
    for (const steps of Object.values(guideTourSteps)) {
      expect(steps.length).toBeGreaterThan(1)
      for (const step of steps) {
        expect(step.element).toMatch(/^\[data-guide=/)
        expect(step.popover?.title).toBeTruthy()
        expect(step.popover?.description).toBeTruthy()
      }
    }
  })

  it('usa uma narrativa amigável e progressiva nos textos', () => {
    expect(guideTourSteps.produto[0].popover?.title).toBe('1. Dê um nome e um código')
    expect(guideTourSteps.arvore[1].popover?.description).toContain('blocos básicos')
    expect(guideTourSteps.json[0].popover?.description).toContain('apenas neste navegador')
    expect(guideTourSteps['catalogo-tabela'][0].popover?.title).toBe('O coração do sistema')
    expect(guideTourSteps['detalhe-produto'][2].popover?.description).toContain('não estiver preso em nenhuma receita')
    expect(guideTourSteps['edicao-produto'][0].popover?.description).toContain('nada será modificado')
  })

  it('carrega Driver.js somente ao iniciar, mostra progresso e encerra o tour ativo', async () => {
    const { driver } = await import('driver.js')

    const instance = await startGuideTour('produto')
    expect(instance).toBe(fakeDriver)
    expect(driver).toHaveBeenCalledTimes(1)
    expect(driver).toHaveBeenCalledWith(expect.objectContaining({
      showProgress: true,
      allowClose: true,
      allowKeyboardControl: true,
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      popoverClass: 'guide-driver-popover',
      onPopoverRender: expect.any(Function),
    }))
    expect(fakeDriver.drive).toHaveBeenCalledTimes(1)

    stopGuideTour()
    expect(fakeDriver.destroy).toHaveBeenCalledTimes(1)
  })

  it('ignora um assunto quando nenhum de seus seletores está na tela', async () => {
    document.body.innerHTML = ''
    await expect(startGuideTour('json')).resolves.toBeNull()
  })

  it('persiste a visualização dos tours automáticos por tela', () => {
    expect(hasSeenScreenGuide('catalogo-tabela')).toBe(false)

    markScreenGuideSeen('catalogo-tabela')

    expect(hasSeenScreenGuide('catalogo-tabela')).toBe(true)
    expect(hasSeenScreenGuide('detalhe-produto')).toBe(false)
  })
})
