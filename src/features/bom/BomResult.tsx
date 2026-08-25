import { BadgeDollarSign, ChevronRight, WalletCards } from 'lucide-react'
import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { formatCurrency, formatQuantity } from '../../components/format'
import type { BomCalculation } from './calculator'

function TreeNode({ node }: { node: ITreeNode }) {
  const children = Object.values(node.children ?? {})
  const label = `${node.name}: ${formatQuantity(node.calculatedQuantity)} ${node.unit}`
  if (children.length === 0) {
    return <li className="tree-leaf"><span className="tree-dot" /><span>{label}</span><code>{node.id}</code></li>
  }
  return (
    <li className="tree-branch">
      <details open>
        <summary><ChevronRight size={17} /><span>{label}</span><code>{node.id}</code></summary>
        <ul>{children.map((child) => <TreeNode key={child.path} node={child} />)}</ul>
      </details>
    </li>
  )
}

export function BomResult({ calculation }: { calculation: BomCalculation }) {
  return (
    <section className="bom-result" aria-label="Resultado da Lista de Materiais">
      <div className="section-heading"><p className="eyebrow">resultado</p><h2>Materiais consolidados</h2></div>
      {(calculation.totalPurchaseCost !== null || calculation.totalSaleValue !== null) && <div className="metric-grid">
        {calculation.totalPurchaseCost !== null && <article className="metric"><WalletCards size={20} /><span>Custo de compra</span><strong>{formatCurrency(calculation.totalPurchaseCost)}</strong><small>Soma dos custos informados nos materiais.</small></article>}
        {calculation.totalSaleValue !== null && <article className="metric"><BadgeDollarSign size={20} /><span>Valor de venda</span><strong>{formatCurrency(calculation.totalSaleValue)}</strong><small>Soma dos valores informados nos Produtos da Lista.</small></article>}
      </div>}
      <div className="materials-table-wrap">
        <table className="materials-table">
          <thead><tr><th>Material terminal</th><th>Quantidade</th><th>Custo de compra</th><th>Peso</th></tr></thead>
          <tbody>{calculation.materials.map((material) => (
            <tr key={material.productCode}>
              <td><strong>{material.name}</strong><code>{material.productCode}</code></td>
              <td>{formatQuantity(material.quantity)} {material.unit}</td>
              <td>{material.purchaseCost === null ? '—' : formatCurrency(material.purchaseCost)}</td>
              <td>{material.weightKg === null ? '—' : `${formatQuantity(material.weightKg)} kg`}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="section-heading tree-heading"><p className="eyebrow">composição</p><h2>Árvore BOM</h2><p>Abra ou feche cada ramo para inspecionar a composição.</p></div>
      <div className="bom-trees">
        {calculation.trees.map(({ entry, root }) => (
          <article className="tree-card" key={`${entry.listId}-${entry.productCode}`}>
            <ul className="material-tree"><TreeNode node={root} /></ul>
          </article>
        ))}
      </div>
    </section>
  )
}
