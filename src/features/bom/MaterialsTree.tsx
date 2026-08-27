import { ChevronRight } from 'lucide-react'
import type { ITreeNode } from '@saitodisse/bom-recipe-calculator'
import { formatQuantity } from '../../components/format'

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

/** Renderiza somente o resultado calculado; não conhece o catálogo nem repete o algoritmo BOM. */
export function MaterialsTree({ node, label = 'Árvore de materiais' }: { node: ITreeNode; label?: string }) {
  return <ul className="material-tree" aria-label={label}><TreeNode node={node} /></ul>
}
