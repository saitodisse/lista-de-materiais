import { clearDriveSync, exportLocalData, getDriveSync, importLocalData, saveDriveSync, type DriveSyncRecord } from '../../db/database'
import type { LocalDataExport } from '../../domain/catalog'
import { connectGoogleDrive, getGoogleAccountEmail, getGoogleAccessToken } from './auth'
import { createDriveJsonFile, downloadDriveJson, type DriveFileMetadata, type DriveRemoteFile, updateDriveJsonFile } from './client'
import { fingerprintLocalData } from './content'

export type SyncDecision = 'receive' | 'overwrite' | 'cancel'

export interface DriveFileReference {
  fileId: string
  resourceKey?: string | null
}

export interface SyncConflict {
  local: LocalDataExport
  remote: DriveRemoteFile
  hasPreviousReference: boolean
}

export class DriveSyncConflictError extends Error {
  readonly conflict: SyncConflict

  constructor(conflict: SyncConflict) {
    super('A cópia local e a cópia do Drive não coincidem. Escolha qual deve prevalecer.')
    this.name = 'DriveSyncConflictError'
    this.conflict = conflict
  }
}

export class LocalChangedDuringSyncError extends Error {
  constructor() {
    super('Os dados locais mudaram durante a sincronização. Consulte o Drive novamente antes de continuar.')
    this.name = 'LocalChangedDuringSyncError'
  }
}

function appLink(fileId: string, resourceKey?: string | null): string {
  const params = new URLSearchParams({ drive: fileId })
  if (resourceKey) params.set('resourceKey', resourceKey)
  return `https://listademateriais.vercel.app/configuracoes#${params.toString()}`
}

function recordFromRemote(reference: DriveFileReference, remote: DriveRemoteFile, previous: DriveSyncRecord | undefined, accountEmail: string | null): DriveSyncRecord {
  return {
    key: 'active',
    fileId: reference.fileId,
    link: appLink(reference.fileId, reference.resourceKey ?? remote.metadata.resourceKey),
    resourceKey: reference.resourceKey ?? remote.metadata.resourceKey,
    fileName: remote.metadata.name,
    accountEmail: accountEmail ?? previous?.accountEmail ?? null,
    canDownload: remote.metadata.capabilities.canDownload ?? null,
    canModifyContent: remote.metadata.capabilities.canModifyContent ?? null,
    linkedAt: previous?.linkedAt ?? new Date().toISOString(),
    lastRemoteModifiedTime: remote.metadata.modifiedTime,
    lastRemoteCheckedAt: new Date().toISOString(),
    lastUploadedAt: previous?.lastUploadedAt ?? null,
    lastDownloadedAt: previous?.lastDownloadedAt ?? null,
    lastObservedFingerprint: fingerprintLocalData(remote.data),
    lastObservedVersion: remote.etag ?? remote.metadata.version,
    lastSyncedFingerprint: previous?.lastSyncedFingerprint ?? null,
  }
}

function recordAfterUpload(reference: DriveFileReference, remoteMetadata: DriveFileMetadata, etag: string | null, previous: DriveSyncRecord | undefined, accountEmail: string | null, syncedFingerprint: string | null): DriveSyncRecord {
  return {
    key: 'active',
    fileId: reference.fileId,
    link: appLink(reference.fileId, reference.resourceKey ?? remoteMetadata.resourceKey),
    resourceKey: reference.resourceKey ?? remoteMetadata.resourceKey,
    fileName: remoteMetadata.name,
    accountEmail: accountEmail ?? previous?.accountEmail ?? null,
    canDownload: remoteMetadata.capabilities.canDownload ?? null,
    canModifyContent: remoteMetadata.capabilities.canModifyContent ?? null,
    linkedAt: previous?.linkedAt ?? new Date().toISOString(),
    lastRemoteModifiedTime: remoteMetadata.modifiedTime,
    lastRemoteCheckedAt: new Date().toISOString(),
    lastUploadedAt: new Date().toISOString(),
    lastDownloadedAt: previous?.lastDownloadedAt ?? null,
    lastObservedFingerprint: syncedFingerprint,
    lastObservedVersion: etag ?? remoteMetadata.version,
    lastSyncedFingerprint: syncedFingerprint ?? previous?.lastSyncedFingerprint ?? null,
  }
}

function recordAfterDownload(previous: DriveSyncRecord, remote: DriveRemoteFile): DriveSyncRecord {
  const now = new Date().toISOString()
  return {
    ...previous,
    fileName: remote.metadata.name,
    resourceKey: previous.resourceKey ?? remote.metadata.resourceKey,
    canDownload: remote.metadata.capabilities.canDownload ?? null,
    canModifyContent: remote.metadata.capabilities.canModifyContent ?? null,
    lastRemoteModifiedTime: remote.metadata.modifiedTime,
    lastRemoteCheckedAt: now,
    lastDownloadedAt: now,
    lastObservedFingerprint: fingerprintLocalData(remote.data),
    lastObservedVersion: remote.etag ?? remote.metadata.version,
    lastSyncedFingerprint: fingerprintLocalData(remote.data),
  }
}

async function tokenAndAccount(): Promise<{ token: string; accountEmail: string | null }> {
  const token = getGoogleAccessToken()
  return { token, accountEmail: await getGoogleAccountEmail(token) }
}

async function assertLocalFingerprint(expected: string): Promise<LocalDataExport> {
  const current = await exportLocalData()
  if (fingerprintLocalData(current) !== expected) throw new LocalChangedDuringSyncError()
  return current
}

export async function connectAndGetAccount(): Promise<string | null> {
  const token = await connectGoogleDrive()
  return getGoogleAccountEmail(token)
}

export async function createDriveShare(): Promise<{ record: DriveSyncRecord; link: string }> {
  const { token, accountEmail } = await tokenAndAccount()
  const local = await exportLocalData()
  const fingerprint = fingerprintLocalData(local)
  const created = await createDriveJsonFile(token, local)
  const stillCurrent = await exportLocalData()
  const syncedFingerprint = fingerprintLocalData(stillCurrent) === fingerprint ? fingerprint : null
  const record = recordAfterUpload({ fileId: created.metadata.id, resourceKey: created.metadata.resourceKey }, created.metadata, created.etag, undefined, accountEmail, syncedFingerprint)
  await saveDriveSync(record)
  return { record, link: record.link }
}

export async function attachDriveFile(reference: DriveFileReference): Promise<{ record: DriveSyncRecord; remote: DriveRemoteFile }> {
  const { token, accountEmail } = await tokenAndAccount()
  const remote = await downloadDriveJson(token, reference.fileId, reference.resourceKey)
  const previous = await getDriveSync()
  const record = recordFromRemote(reference, remote, previous?.fileId === reference.fileId ? previous : undefined, accountEmail)
  await saveDriveSync(record)
  return { record, remote }
}

export async function refreshDriveShare(): Promise<{ record: DriveSyncRecord; remote: DriveRemoteFile }> {
  const current = await getDriveSync()
  if (!current) throw new Error('Nenhum arquivo do Drive está vinculado neste aparelho.')
  const { token, accountEmail } = await tokenAndAccount()
  const remote = await downloadDriveJson(token, current.fileId, current.resourceKey)
  const record = recordFromRemote({ fileId: current.fileId, resourceKey: current.resourceKey }, remote, current, accountEmail)
  await saveDriveSync(record)
  return { record, remote }
}

async function applyRemoteSnapshot(current: DriveSyncRecord, remote: DriveRemoteFile): Promise<DriveSyncRecord> {
  await importLocalData(remote.data)
  const record = recordAfterDownload(current, remote)
  await saveDriveSync(record)
  return record
}

export async function receiveDriveShare(expectedLocalFingerprint?: string): Promise<{ record: DriveSyncRecord; remote: DriveRemoteFile }> {
  const current = await getDriveSync()
  if (!current) throw new Error('Nenhum arquivo do Drive está vinculado neste aparelho.')
  const { token } = await tokenAndAccount()
  const local = await exportLocalData()
  const localFingerprint = fingerprintLocalData(local)
  if (expectedLocalFingerprint && localFingerprint !== expectedLocalFingerprint) throw new LocalChangedDuringSyncError()
  const remote = await downloadDriveJson(token, current.fileId, current.resourceKey)
  await assertLocalFingerprint(localFingerprint)
  const record = await applyRemoteSnapshot(current, remote)
  return { record, remote }
}

export async function sendDriveShare(decision?: SyncDecision): Promise<{ record: DriveSyncRecord; remote: DriveRemoteFile | null; uploaded: boolean }> {
  const current = await getDriveSync()
  if (!current) throw new Error('Nenhum arquivo do Drive está vinculado neste aparelho.')
  const { token, accountEmail } = await tokenAndAccount()
  const local = await exportLocalData()
  const localFingerprint = fingerprintLocalData(local)
  const remote = await downloadDriveJson(token, current.fileId, current.resourceKey)
  const remoteFingerprint = fingerprintLocalData(remote.data)
  const remoteChangedSinceReference = current.lastSyncedFingerprint !== null && remoteFingerprint !== current.lastSyncedFingerprint
  const needsChoice = current.lastSyncedFingerprint === null || remoteChangedSinceReference

  if (needsChoice && !decision) throw new DriveSyncConflictError({ local, remote, hasPreviousReference: current.lastSyncedFingerprint !== null })
  if (decision === 'cancel') throw new DriveSyncConflictError({ local, remote, hasPreviousReference: current.lastSyncedFingerprint !== null })
  if (decision === 'receive') {
    await assertLocalFingerprint(localFingerprint)
    const record = await applyRemoteSnapshot(current, remote)
    return { record, remote, uploaded: false }
  }
  if (!needsChoice && localFingerprint === remoteFingerprint) {
    const record = recordFromRemote({ fileId: current.fileId, resourceKey: current.resourceKey }, remote, current, accountEmail)
    record.lastSyncedFingerprint = localFingerprint
    await saveDriveSync(record)
    return { record, remote, uploaded: false }
  }

  await assertLocalFingerprint(localFingerprint)
  const updated = await updateDriveJsonFile(token, current.fileId, local, current.resourceKey, remote.etag)
  const after = await exportLocalData()
  const syncedFingerprint = fingerprintLocalData(after) === localFingerprint ? localFingerprint : null
  const record = recordAfterUpload({ fileId: current.fileId, resourceKey: current.resourceKey }, updated.metadata, updated.etag, current, accountEmail, syncedFingerprint)
  await saveDriveSync(record)
  return { record, remote, uploaded: true }
}

export async function disconnectDriveShare(): Promise<void> {
  await clearDriveSync()
}

export function getDriveAppLink(record: DriveSyncRecord): string {
  return record.link
}
