import { useCallback } from 'react'
import { parseAsBoolean, parseAsFloat, parseAsStringEnum, useQueryStates } from 'nuqs'
import { roundProductTreeValue, type ProductTreeExpansion, type ProductTreeUnit } from './productTree'

export const productTreeExpansions = ['one-layer', 'full'] as const
export const productTreeUnits = ['kg', 'g'] as const

const productTreeOptionParsers = {
  multiplier: parseAsFloat.withDefault(1).withOptions({ history: 'replace' }),
  cost: parseAsBoolean.withDefault(false).withOptions({ history: 'replace' }),
  unit: parseAsStringEnum<ProductTreeUnit>([...productTreeUnits]).withDefault('kg').withOptions({ history: 'replace' }),
  tree: parseAsStringEnum<ProductTreeExpansion>([...productTreeExpansions]).withDefault('full').withOptions({ history: 'replace' }),
}

function validMultiplier(value: number): number {
  return Number.isFinite(value) && value > 0 ? roundProductTreeValue(value) : 1
}

export function useProductTreeOptions() {
  const [query, setQuery] = useQueryStates(productTreeOptionParsers)
  const multiplier = validMultiplier(query.multiplier)
  const setMultiplier = useCallback((value: number) => {
    void setQuery({ multiplier: validMultiplier(value) })
  }, [setQuery])
  const setShowCost = useCallback((value: boolean) => {
    void setQuery({ cost: value })
  }, [setQuery])
  const setUnit = useCallback((value: ProductTreeUnit) => {
    void setQuery({ unit: value })
  }, [setQuery])
  const setExpansion = useCallback((value: ProductTreeExpansion) => {
    void setQuery({ tree: value })
  }, [setQuery])
  return {
    multiplier,
    setMultiplier,
    showCost: query.cost,
    setShowCost,
    unit: query.unit,
    setUnit,
    expansion: query.tree,
    setExpansion,
  }
}
