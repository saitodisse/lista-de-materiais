import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProfile, getGoogleProfile, resetDatabaseForTest, saveGoogleProfile } from '../../db/database'
import { DriveSyncPanel } from './DriveSyncPanel'

const authMocks = vi.hoisted(() => ({
  isGoogleConnected: vi.fn(),
  hasGoogleConnectionPreference: vi.fn(),
  getGoogleAccessToken: vi.fn(),
  getGoogleAccountEmail: vi.fn(),
  connectGoogleDrive: vi.fn(),
  disconnectGoogleDrive: vi.fn(),
  restoreGoogleDrive: vi.fn(),
}))

vi.mock('./auth', () => authMocks)
vi.mock('./client', async (importOriginal) => ({ ...await importOriginal<typeof import('./client')>(), downloadDriveJson: vi.fn(), listDriveJsonFiles: vi.fn() }))

describe('restauração da conta Google no Perfil', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    authMocks.isGoogleConnected.mockReturnValue(false)
    authMocks.hasGoogleConnectionPreference.mockReturnValue(false)
    authMocks.getGoogleAccountEmail.mockResolvedValue('owner@example.com')
    authMocks.restoreGoogleDrive.mockResolvedValue('restored-token')
    await resetDatabaseForTest()
  })

  afterEach(() => {
    cleanup()
  })

  it('restaura silenciosamente a conta lembrada ao abrir o painel', async () => {
    await saveGoogleProfile({ key: 'account', subject: 'google-subject-1', email: 'owner@example.com', emailVerified: true, connectedAt: '2026-01-01', lastSeenAt: '2026-01-01' }, 'principal')

    render(<DriveSyncPanel profileId="principal" />)

    await waitFor(() => expect(authMocks.restoreGoogleDrive).toHaveBeenCalledWith('principal'))
    expect(await screen.findByText('owner@example.com')).toBeInTheDocument()
    expect(await getGoogleProfile('principal')).toMatchObject({ email: 'owner@example.com' })
  })

  it('não reutiliza a conta lembrada de outro Perfil', async () => {
    const otherProfile = await createProfile('Outro Perfil')
    await saveGoogleProfile({ key: 'account', subject: 'google-subject-b', email: 'b@example.com', emailVerified: true, connectedAt: '2026-01-01', lastSeenAt: '2026-01-01' }, otherProfile.id)

    render(<DriveSyncPanel profileId="principal" />)

    await waitFor(() => expect(authMocks.restoreGoogleDrive).not.toHaveBeenCalled())
    expect(screen.queryByText('b@example.com')).not.toBeInTheDocument()
  })

  it('apaga a identidade lembrada ao desconectar a conta', async () => {
    await saveGoogleProfile({ key: 'account', subject: 'google-subject-1', email: 'owner@example.com', emailVerified: true, connectedAt: '2026-01-01', lastSeenAt: '2026-01-01' }, 'principal')
    render(<DriveSyncPanel profileId="principal" />)

    await waitFor(() => expect(authMocks.restoreGoogleDrive).toHaveBeenCalledWith('principal'))
    await screen.findByRole('button', { name: 'Desconectar conta' })
    screen.getByRole('button', { name: 'Desconectar conta' }).click()

    await waitFor(() => expect(getGoogleProfile('principal')).resolves.toBeUndefined())
    expect(authMocks.disconnectGoogleDrive).toHaveBeenCalledWith('principal')
  })
})
