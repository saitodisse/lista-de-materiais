import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ClipboardCopy, Printer } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { ErrorNotice } from '../../components/Page'
import { formatCurrency } from '../../components/format'
import type { ProductRecord } from '../../domain/catalog'
import { calculateProductTree } from './calculator'
import { convertProductTreeQuantity, displayProductTreeQuantity, formatProductTreeInput, formatProductTreeQuantity, parseProductTreeInput, productTreeToSpreadsheet, roundProductTreeDisplayValue, roundProductTreeValue, type ProductTreeExpansion, type ProductTreeUnit } from './productTree'
import { useProductTreeOptions } from './useProductTreeOptions'

function findNodeByPath(node: ITreeNode, path: string): ITreeNode | undefined {
  if (node.path === path) return node
  for (const child of Object.values(node.children ?? {})) {
    const found = findNodeByPath(child, path)
    if (found) return found
  }
  return undefined
}

function inputId(path: string): string {
  return `tree-quantity-${path.replace(/[^a-z0-9-]/gi, '-')}`
}

function selectQuantityInput(input: HTMLInputElement): void {
  input.focus()
  input.select()
}

interface TreeRowsProps {
  node: ITreeNode
  expansion: ProductTreeExpansion
  showCost: boolean
  unit: ProductTreeUnit
  drafts: Record<string, string>
  onQuantityChange: (node: ITreeNode, value: string) => void
  onQuantityCommit: (node: ITreeNode) => void
}

function TreeRows({ node, expansion, showCost, unit, drafts, onQuantityChange, onQuantityCommit }: TreeRowsProps) {
  const children = Object.values(node.children ?? {})
  const visibleChildren = expansion === 'full' || node.level === 0
  const fieldId = inputId(node.path)
  const displayQuantity = displayProductTreeQuantity(node, unit)

  return <>
    <tr>
      <td className="product-tree-name" style={{ '--tree-depth': node.level } as CSSProperties}>
        <Link to="/produtos/$productCode" params={{ productCode: node.id }}>{node.name}</Link>
        <code>{node.id}</code>
      </td>
      <td className="product-tree-quantity">
        <label className="sr-only" htmlFor={fieldId}>Quantidade simulada de {node.name}</label>
        <div>
          <input
            id={fieldId}
            type="text"
            role="spinbutton"
            min="0.00001"
            step="0.00001"
            inputMode="decimal"
            value={drafts[node.path] ?? formatProductTreeInput(displayQuantity.value, displayQuantity.unit)}
            aria-valuetext={`${formatProductTreeQuantity(displayQuantity.value, displayQuantity.unit)} ${displayQuantity.unit}`}
            aria-valuemin={0.00001}
            aria-valuenow={roundProductTreeDisplayValue(displayQuantity.value, displayQuantity.unit)}
            onChange={(event) => onQuantityChange(node, event.target.value)}
            onPointerDown={(event) => {
              event.preventDefault()
              selectQuantityInput(event.currentTarget)
            }}
            onMouseDown={(event) => {
              event.preventDefault()
              selectQuantityInput(event.currentTarget)
            }}
            onMouseUp={(event) => {
              event.preventDefault()
              selectQuantityInput(event.currentTarget)
            }}
            onClick={(event) => {
              const input = event.currentTarget
              selectQuantityInput(input)
              window.setTimeout(() => {
                if (document.activeElement === input) selectQuantityInput(input)
              }, 0)
            }}
            onBlur={() => onQuantityCommit(node)}
          />
          <span>{displayQuantity.unit}</span>
        </div>
      </td>
      {showCost && <td className="product-tree-cost">{node.calculatedCost === null ? '—' : formatCurrency(node.calculatedCost)}</td>}
    </tr>
    {visibleChildren && children.map((child) => <TreeRows key={child.path} node={child} expansion={expansion} showCost={showCost} unit={unit} drafts={drafts} onQuantityChange={onQuantityChange} onQuantityCommit={onQuantityCommit} />)}
  </>
}

export function ProductBomTree({ productCode, products }: { productCode: string; products: ProductRecord[] }) {
  const { multiplier, setMultiplier, showCost, setShowCost, unit, setUnit, expansion, setExpansion } = useProductTreeOptions()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  useEffect(() => () => { if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current) }, [])
  const calculation = useMemo(() => {
    try {
      return {
        baseTree: calculateProductTree(products, productCode),
        tree: calculateProductTree(products, productCode, multiplier),
        error: null,
      }
    } catch (reason) {
      return {
        baseTree: null,
        tree: null,
        error: reason instanceof Error ? reason.message : 'Não foi possível calcular esta árvore.',
      }
    }
  }, [multiplier, productCode, products])

  if (calculation.error || !calculation.tree || !calculation.baseTree) {
    return <ErrorNotice>{calculation.error ?? 'Não foi possível calcular esta árvore.'}</ErrorNotice>
  }

  const changeQuantity = (node: ITreeNode, value: string) => {
    setDrafts({ [node.path]: value })
  }

  const commitQuantity = (node: ITreeNode) => {
    const value = drafts[node.path]
    if (value === undefined) return
    if (/[.,]$/.test(value)) {
      setDrafts({})
      return
    }
    const desiredDisplayQuantity = parseProductTreeInput(value)
    const desiredQuantity = convertProductTreeQuantity(desiredDisplayQuantity, node.unit, unit).unit === 'G' ? desiredDisplayQuantity / 1000 : desiredDisplayQuantity
    const originalNode = findNodeByPath(calculation.baseTree, node.path)
    if (!Number.isFinite(desiredQuantity) || desiredQuantity <= 0 || !originalNode || originalNode.calculatedQuantity <= 0) {
      setDrafts({})
      return
    }
    const roundedQuantity = roundProductTreeValue(desiredQuantity)
    const roundedDisplayQuantity = convertProductTreeQuantity(roundedQuantity, node.unit, unit)
    setDrafts({ [node.path]: formatProductTreeInput(roundedDisplayQuantity.value, roundedDisplayQuantity.unit) })
    setMultiplier(roundedQuantity / originalNode.calculatedQuantity)
  }

  const changeUnit = (nextUnit: ProductTreeUnit) => {
    setDrafts({})
    setUnit(nextUnit)
  }

  const copySpreadsheet = async () => {
    try {
      await navigator.clipboard.writeText(productTreeToSpreadsheet(calculation.tree!, { showCost, unit, expansion }))
      setCopyFeedback('Receita copiada para colar na planilha.')
    } catch {
      setCopyFeedback('Não foi possível copiar. Verifique a permissão da área de transferência.')
    }
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setCopyFeedback(null), 4000)
  }

  return (
    <div className="product-bom-tree" data-guide="product-bom-tree">
      <div className="product-bom-tree-head" data-guide="bom-tree-meaning">
        <div><p className="eyebrow">simulação de leitura</p><h3>Árvore completa da Receita</h3><p>Altere uma quantidade para aplicar o mesmo multiplicador a toda a árvore. Nada é salvo.</p></div>
        <div className="product-tree-controls">
          <button type="button" className="button quiet" aria-pressed={showCost} onClick={() => setShowCost(!showCost)}>Exibir custo</button>
          <div className="tree-toggle" role="group" aria-label="Unidade da quantidade">
            <button type="button" className="button quiet" aria-pressed={unit === 'kg'} onClick={() => changeUnit('kg')}>KG</button>
            <button type="button" className="button quiet" aria-pressed={unit === 'g'} onClick={() => changeUnit('g')}>G</button>
          </div>
          <div className="tree-expansion" role="group" aria-label="Expansão da árvore">
            <button type="button" className="button quiet" aria-pressed={expansion === 'one-layer'} onClick={() => setExpansion('one-layer')}>Uma camada</button>
            <button type="button" className="button quiet" aria-pressed={expansion === 'full'} onClick={() => setExpansion('full')}>Árvore completa</button>
          </div>
        </div>
      </div>
      <div className="product-tree-table-wrap" data-guide="bom-tree-table">
        <table className="product-tree-table" data-show-cost={showCost} aria-label="Árvore calculada da Receita">
          <thead><tr><th scope="col">Produto</th><th scope="col">Quantidade</th>{showCost && <th scope="col">Custo</th>}</tr></thead>
          <tbody><TreeRows node={calculation.tree} expansion={expansion} showCost={showCost} unit={unit} drafts={drafts} onQuantityChange={changeQuantity} onQuantityCommit={commitQuantity} /></tbody>
        </table>
      </div>
      <div className="product-tree-actions">
        <Link to="/produtos/$productCode/imprimir" params={{ productCode }} search={{ multiplier, cost: showCost, unit, tree: expansion }} target="_blank" rel="noopener noreferrer" className="button secondary"><Printer size={17} /> Imprimir receita</Link>
        <button type="button" className="button secondary" onClick={() => void copySpreadsheet()}><ClipboardCopy size={17} /> Copiar para planilha</button>
      </div>
      {copyFeedback && <p className="copy-feedback" role="status" aria-live="polite">{copyFeedback}</p>}
    </div>
  )
}
