import type { LocalDataExport } from '../../domain/catalog'

export function normalizeLocalData(data: LocalDataExport): Omit<LocalDataExport, 'exportedAt'> {
  return {
    format: data.format,
    version: data.version,
    products: [...data.products]
      .map((product) => ({
        ...product,
        recipe: product.recipe ? [...product.recipe].sort((left, right) => left.id.localeCompare(right.id)) : null,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    materialLists: [...data.materialLists].sort((left, right) => left.id.localeCompare(right.id)),
    materialListEntries: [...data.materialListEntries].sort((left, right) => `${left.listId}\u0000${left.productCode}`.localeCompare(`${right.listId}\u0000${right.productCode}`)),
  }
}

export function normalizedLocalDataJson(data: LocalDataExport): string {
  return JSON.stringify(normalizeLocalData(data))
}

/** A stable, local-only fingerprint. It is a comparison key, not a security signature. */
export function fingerprintLocalData(data: LocalDataExport): string {
  const value = normalizedLocalDataJson(data)
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

