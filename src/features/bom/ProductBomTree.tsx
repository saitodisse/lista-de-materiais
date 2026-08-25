import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { ErrorNotice } from '../../components/Page'
import { formatCurrency } from '../../components/format'
import type { ProductRecord } from '../../domain/catalog'
import { calculateProductTree } from './calculator'

type Expansion = 'one-layer' | 'full'

function roundToFive(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000) / 100_000
}

function formatTreeQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 5 }).format(roundToFive(value))
}

function formatInputQuantity(value: number): string {
  return roundToFive(value).toFixed(5).replace(/\.?0+$/, '')
}

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
  expansion: Expansion
  drafts: Record<string, string>
  onQuantityChange: (node: ITreeNode, value: string) => void
  onQuantityReset: () => void
}

function TreeRows({ node, expansion, drafts, onQuantityChange, onQuantityReset }: TreeRowsProps) {
  const children = Object.values(node.children ?? {})
  const visibleChildren = expansion === 'full' || node.level === 0
  const fieldId = inputId(node.path)

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
            value={drafts[node.path] ?? formatInputQuantity(node.calculatedQuantity)}
            aria-valuetext={`${formatTreeQuantity(node.calculatedQuantity)} ${node.unit}`}
            aria-valuemin={0.00001}
            aria-valuenow={node.calculatedQuantity}
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
            onBlur={onQuantityReset}
          />
          <span>{node.unit}</span>
        </div>
      </td>
      <td className="product-tree-cost">{node.calculatedCost === null ? '—' : formatCurrency(node.calculatedCost)}</td>
    </tr>
    {visibleChildren && children.map((child) => <TreeRows key={child.path} node={child} expansion={expansion} drafts={drafts} onQuantityChange={onQuantityChange} onQuantityReset={onQuantityReset} />)}
  </>
}

export function ProductBomTree({ productCode, products }: { productCode: string; products: ProductRecord[] }) {
  const [expansion, setExpansion] = useState<Expansion>('full')
  const [multiplier, setMultiplier] = useState(1)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
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
    if (/[.,]$/.test(value)) return
    const desiredQuantity = Number(value)
    const originalNode = findNodeByPath(calculation.baseTree, node.path)
    if (!Number.isFinite(desiredQuantity) || desiredQuantity <= 0 || !originalNode || originalNode.calculatedQuantity <= 0) return
    const roundedQuantity = roundToFive(desiredQuantity)
    setDrafts({ [node.path]: formatInputQuantity(roundedQuantity) })
    setMultiplier(roundedQuantity / originalNode.calculatedQuantity)
  }

  return (
    <div className="product-bom-tree">
      <div className="product-bom-tree-head">
        <div><p className="eyebrow">simulação de leitura</p><h3>Árvore completa da Receita</h3><p>Altere uma quantidade para aplicar o mesmo multiplicador a toda a árvore. Nada é salvo.</p></div>
        <div className="tree-expansion" role="group" aria-label="Expansão da árvore">
          <button type="button" className="button quiet" aria-pressed={expansion === 'one-layer'} onClick={() => setExpansion('one-layer')}>Uma camada</button>
          <button type="button" className="button quiet" aria-pressed={expansion === 'full'} onClick={() => setExpansion('full')}>Árvore completa</button>
        </div>
      </div>
      <div className="product-tree-table-wrap">
        <table className="product-tree-table" aria-label="Árvore calculada da Receita">
          <thead><tr><th scope="col">Produto</th><th scope="col">Quantidade</th><th scope="col">Custo</th></tr></thead>
          <tbody><TreeRows node={calculation.tree} expansion={expansion} drafts={drafts} onQuantityChange={changeQuantity} onQuantityReset={() => setDrafts({})} /></tbody>
        </table>
      </div>
    </div>
  )
}
