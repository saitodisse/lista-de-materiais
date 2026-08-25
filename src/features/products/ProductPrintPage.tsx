import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { Link, useParams } from '@tanstack/react-router'
import { ErrorNotice } from '../../components/Page'
import { categoryName, formatCurrency } from '../../components/format'
import { db } from '../../db/database'
import { calculateProductTree } from '../bom/calculator'
import { displayProductTreeQuantity, flattenProductTree, formatProductTreeQuantity, type ProductTreeExpansion, type ProductTreeUnit } from '../bom/productTree'
import { useProductTreeOptions } from '../bom/useProductTreeOptions'

function PrintTreeRows({ tree, expansion, showCost, unit }: { tree: ITreeNode; expansion: ProductTreeExpansion; showCost: boolean; unit: ProductTreeUnit }) {
  return <>{flattenProductTree(tree, expansion).map((node) => {
    const displayQuantity = displayProductTreeQuantity(node, unit)
    return (
    <tr key={node.path}>
      <td style={{ paddingInlineStart: `${10 + node.level * 18}px` }}><strong>{node.name}</strong></td>
      <td>{formatProductTreeQuantity(displayQuantity.value)}</td>
      <td>{displayQuantity.unit}</td>
      {showCost && <td>{node.calculatedCost === null ? '—' : formatCurrency(node.calculatedCost)}</td>}
    </tr>
    )
  })}</>
}

export function ProductPrintPage() {
  const { productCode } = useParams({ strict: false }) as { productCode: string }
  const { multiplier, showCost, setShowCost, unit, setUnit, expansion, setExpansion } = useProductTreeOptions()
  const data = useLiveQuery(async () => ({ product: await db.products.get(productCode), products: await db.products.toArray() }), [productCode])
  const calculation = useMemo(() => {
    if (!data?.product) return null
    try { return { tree: calculateProductTree(data.products, productCode, multiplier), error: null } }
    catch (reason) { return { tree: null, error: reason instanceof Error ? reason.message : 'Não foi possível calcular esta receita.' } }
  }, [data, multiplier, productCode])

  if (!data || !calculation) return <p className="loading-state">Preparando a receita para impressão…</p>
  if (!data.product) return <div className="page"><ErrorNotice>Esse Produto não existe neste aparelho.</ErrorNotice><Link to="/" className="button secondary">Voltar aos Produtos</Link></div>
  if (calculation.error || !calculation.tree) return <div className="page"><ErrorNotice>{calculation.error ?? 'Não foi possível calcular esta receita.'}</ErrorNotice><Link to="/produtos/$productCode" params={{ productCode }} className="button secondary">Voltar à ficha</Link></div>

  const { product } = data
  const displayRootQuantity = displayProductTreeQuantity(calculation.tree, unit)
  return <div className="page print-page">
    <div className="print-toolbar"><Link to="/produtos/$productCode" params={{ productCode }} search={{ multiplier, cost: showCost, unit, tree: expansion }} className="button secondary">Voltar à ficha</Link><button type="button" className="button primary" onClick={() => window.print()}>Imprimir</button></div>
    <header className="print-header"><p className="eyebrow">receita</p><h1>{product.name}</h1><p>{categoryName(product.category)} · {formatProductTreeQuantity(displayRootQuantity.value)} {displayRootQuantity.unit} · multiplicador {formatProductTreeQuantity(multiplier)}</p></header>
    <div className="print-options" role="group" aria-label="Opções da impressão">
      <button type="button" className="button quiet" aria-pressed={showCost} onClick={() => setShowCost(!showCost)}>Exibir custo</button>
      <div className="tree-toggle" role="group" aria-label="Unidade da quantidade">
        <button type="button" className="button quiet" aria-pressed={unit === 'kg'} onClick={() => setUnit('kg')}>KG</button>
        <button type="button" className="button quiet" aria-pressed={unit === 'g'} onClick={() => setUnit('g')}>G</button>
      </div>
      <div className="tree-expansion" role="group" aria-label="Expansão da árvore">
        <button type="button" className="button quiet" aria-pressed={expansion === 'one-layer'} onClick={() => setExpansion('one-layer')}>Uma camada</button>
        <button type="button" className="button quiet" aria-pressed={expansion === 'full'} onClick={() => setExpansion('full')}>Árvore completa</button>
      </div>
    </div>
    <table className="print-recipe-table" aria-label={`Receita de ${product.name}`}>
      <thead><tr><th scope="col">Produto</th><th scope="col">Quantidade</th><th scope="col">Unidade</th>{showCost && <th scope="col">Custo</th>}</tr></thead>
      <tbody><PrintTreeRows tree={calculation.tree} expansion={expansion} showCost={showCost} unit={unit} /></tbody>
    </table>
    <p className="print-note">Simulação local. Nenhuma quantidade foi alterada no cadastro.</p>
  </div>
}
