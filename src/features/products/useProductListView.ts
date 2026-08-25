import { useCallback, useEffect, useState } from 'react'
import { parseAsStringEnum, useQueryState } from 'nuqs'

const productListViews = ['cards', 'table'] as const
export type ProductListView = typeof productListViews[number]

const storageKey = 'lista-de-materiais:products-view'
const viewParser = parseAsStringEnum<ProductListView>([...productListViews])

function isProductListView(value: string | null): value is ProductListView {
  return value === 'cards' || value === 'table'
}

function readStoredView(): ProductListView {
  if (typeof window === 'undefined') return 'cards'
  const stored = window.localStorage.getItem(storageKey)
  return isProductListView(stored) ? stored : 'cards'
}

function storeView(view: ProductListView): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, view)
}

export function useProductListView(): readonly [ProductListView, (view: ProductListView) => void] {
  const [queryView, setQueryView] = useQueryState('view', viewParser)
  const [storedView, setStoredView] = useState<ProductListView>(() => queryView ?? readStoredView())
  const view = queryView ?? storedView

  useEffect(() => {
    if (queryView) {
      storeView(queryView)
      return
    }

    void setQueryView(storedView)
  }, [queryView, setQueryView, storedView])

  const selectView = useCallback((nextView: ProductListView) => {
    storeView(nextView)
    setStoredView(nextView)
    void setQueryView(nextView)
  }, [setQueryView])

  return [view, selectView]
}
