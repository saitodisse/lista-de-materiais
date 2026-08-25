import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'
import { categoryOptions, type ProductRecord } from '../../domain/catalog'

const categoryIds = categoryOptions.map((category) => category.id) as ProductRecord['category'][]
const categoryParser = parseAsArrayOf(parseAsStringEnum(categoryIds)).withDefault([])

const productFilterParsers = {
  search: parseAsString.withDefault(''),
  categories: categoryParser,
}

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(productFilterParsers)
  const [search, setSearchDraft] = useState(filters.search)
  const pendingSearch = useRef<string | null>(null)
  const selectedCategories = useMemo(() => new Set(filters.categories), [filters.categories])

  useEffect(() => {
    if (pendingSearch.current === filters.search) {
      pendingSearch.current = null
      return
    }
    if (pendingSearch.current === null) setSearchDraft(filters.search)
  }, [filters.search])

  const toggleCategory = useCallback((category: ProductRecord['category']) => {
    const next = new Set(selectedCategories)
    if (next.has(category)) next.delete(category)
    else next.add(category)
    void setFilters({ categories: categoryIds.filter((id) => next.has(id)) })
  }, [selectedCategories, setFilters])

  const setSearch = useCallback((nextSearch: string) => {
    pendingSearch.current = nextSearch
    setSearchDraft(nextSearch)
    void setFilters({ search: nextSearch }).then(() => {
      if (pendingSearch.current === nextSearch) pendingSearch.current = null
    })
  }, [setFilters])

  return { search, setSearch, selectedCategories, toggleCategory }
}
