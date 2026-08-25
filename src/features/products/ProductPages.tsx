import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Edit3, Search, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { categoryName, formatCurrency, unitName } from '../../components/format'
import { EmptyState, ErrorNotice, PageHeader } from '../../components/Page'
import { db, deleteProduct, getProductDependencies, saveProduct } from '../../db/database'
import { categoryOptions, ProductDependencyError, type ProductDependencies, type ProductRecord } from '../../domain/catalog'
import { ProductBomTree } from '../bom/ProductBomTree'
import { ProductForm } from './ProductForm'
import { useProductFilters } from './useProductFilters'
import { useProductListView } from './useProductListView'

export function ProductsPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray())
  const [view, setView] = useProductListView()
  const { search, setSearch, selectedCategories, toggleCategory } = useProductFilters()
  if (!products) return <p className="loading-state">Abrindo o catálogo local…</p>
  const searchTerm = normalizeSearch(search)
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(product.category)
    return matchesCategory && (!searchTerm || normalizeSearch(`${product.name} ${product.productCode}`).includes(searchTerm))
  })
  return (
    <div className="page">
      <PageHeader eyebrow="catálogo" title="Produtos" description="Cada ficha tem um código permanente, medidas e uma receita opcional." action={{ to: '/produtos/novo', label: 'Novo Produto' }} />
      {products.length === 0 ? <EmptyState title="Seu catálogo está vazio" action={<Link to="/produtos/novo" className="button primary">Criar primeiro Produto</Link>}>Comece por uma matéria-prima, embalagem ou Produto final.</EmptyState> : (
        <>
          <div className="catalog-toolbar">
            <p>{filteredProducts.length} de {products.length} Produto{products.length === 1 ? '' : 's'} no catálogo local</p>
            <div className="view-switch" role="group" aria-label="Modo de exibição dos Produtos">
              <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Tabela</button>
              <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>Cartões</button>
            </div>
          </div>
          <section className="catalog-filters" aria-label="Filtros de Produtos">
            <label className="catalog-search" htmlFor="product-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar por nome ou código</span><input id="product-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou código" /></label>
            <div className="category-filters" role="group" aria-label="Filtrar por categoria">
              {categoryOptions.map((category) => <button key={category.id} type="button" className="category-filter" data-category={category.id} aria-pressed={selectedCategories.has(category.id)} onClick={() => toggleCategory(category.id)}>{category.descriptionPtBr}</button>)}
            </div>
          </section>
          {filteredProducts.length === 0 ? <EmptyState title="Nenhum Produto encontrado">Ajuste a busca ou ligue outras categorias para consultar o catálogo.</EmptyState> : view === 'cards' ? <section className="record-grid" aria-label="Produtos cadastrados">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </section> : <ProductTable products={filteredProducts} />}
        </>
      )}
    </div>
  )
}

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

function ProductCard({ product }: { product: ProductRecord }) {
  return (
    <Link to="/produtos/$productCode" params={{ productCode: product.productCode }} className="record-card">
      <div className="record-card-head"><CategoryMark category={product.category} /><code>{product.productCode}</code></div>
      <h2>{product.name}</h2>
      <p>{categoryName(product.category)} · {unitName(product.unit)}</p>
      <footer>{product.recipe?.length ? `${product.recipe.length} componente${product.recipe.length === 1 ? '' : 's'}` : 'Material terminal'} <span>Ver ficha →</span></footer>
    </Link>
  )
}

function CategoryMark({ category }: { category: ProductRecord['category'] }) {
  return <span className="category-mark" data-category={category} aria-hidden="true">{category === 'c' ? 'o' : category}</span>
}

function ProductTable({ products }: { products: ProductRecord[] }) {
  return (
    <div className="catalog-table-wrap">
      <table className="catalog-table" aria-label="Produtos cadastrados">
        <thead>
          <tr><th scope="col" aria-label="Categoria">CAT</th><th scope="col">Produto</th><th scope="col" aria-label="Unidade">UN</th><th scope="col" data-column="recipe">Receita</th><th scope="col" data-column="purchase-cost">Custo de compra</th><th scope="col" data-column="sale-value">Valor de venda</th></tr>
        </thead>
        <tbody>
          {products.map((product) => <tr key={product.id}>
            <td data-column="category" title={categoryName(product.category)} aria-label={categoryName(product.category)}><span className="category-cell"><CategoryMark category={product.category} /></span></td>
            <td data-column="product"><div className="record-card-head"><Link to="/produtos/$productCode" params={{ productCode: product.productCode }}>{product.name}</Link><code className="catalog-product-code">{product.productCode}</code></div></td>
            <td>{product.unit}</td>
            <td data-column="recipe">{product.recipe?.length ? `${product.recipe.length} componente${product.recipe.length === 1 ? '' : 's'}` : 'Material terminal'}</td>
            <td data-column="purchase-cost">{product.purchaseQuoteValue == null ? '—' : formatCurrency(product.purchaseQuoteValue)}</td>
            <td data-column="sale-value">{product.saleValue == null ? '—' : formatCurrency(product.saleValue)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}

export function ProductEditorPage() {
  const { productCode } = useParams({ strict: false }) as { productCode?: string }
  const navigate = useNavigate()
  const products = useLiveQuery(() => db.products.toArray())
  const product = useMemo(() => products?.find((item) => item.productCode === productCode), [products, productCode])
  if (!products) return <p className="loading-state">Abrindo o catálogo local…</p>
  if (productCode && !product) return <div className="page"><PageHeader title="Produto não encontrado" backTo="/produtos" /><ErrorNotice>Esse código não existe neste aparelho.</ErrorNotice></div>
  return (
    <div className="page editor-page">
      <PageHeader eyebrow={product ? 'edição' : 'novo registro'} title={product ? `Editar ${product.name}` : 'Novo Produto'} description="Os componentes da receita devem existir no catálogo." backTo={product ? `/produtos/${product.productCode}` : '/produtos'} />
      <ProductForm product={product} products={products} onSave={async (record, previousCode) => {
        await saveProduct(record, previousCode)
        await navigate({ to: '/produtos/$productCode', params: { productCode: record.productCode } })
      }} />
    </div>
  )
}

export function ProductDetailPage() {
  const { productCode } = useParams({ strict: false }) as { productCode: string }
  const navigate = useNavigate()
  const result = useLiveQuery(async () => {
    const product = await db.products.get(productCode)
    const dependencies = product ? await getProductDependencies(productCode) : undefined
    const products = await db.products.toArray()
    return { product, dependencies, products }
  }, [productCode])
  const [error, setError] = useState<string | null>(null)
  if (!result) return <p className="loading-state">Lendo a ficha local…</p>
  if (!result.product || !result.dependencies) return <div className="page"><PageHeader title="Produto não encontrado" backTo="/produtos" /><ErrorNotice>Esse código não existe neste aparelho.</ErrorNotice></div>
  const { product, dependencies, products } = result
  const canDelete = dependencies.recipes.length === 0 && dependencies.lists.length === 0
  const deleteCurrent = async () => {
    setError(null)
    if (!window.confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteProduct(product.productCode)
      await navigate({ to: '/produtos' })
    } catch (reason) {
      const message = reason instanceof ProductDependencyError ? dependencyMessage(reason.dependencies) : reason instanceof Error ? reason.message : 'Não foi possível excluir o Produto.'
      setError(message)
    }
  }
  return (
    <div className="page detail-page">
      <PageHeader eyebrow="ficha técnica" title={product.name} description={`${categoryName(product.category)} · ${unitName(product.unit)}`} backTo="/produtos" />
      <section className="detail-card">
        <div className="detail-title"><CategoryMark category={product.category} /><code>{product.productCode}</code></div>
        <dl className="spec-list">
          <div><dt>Unidade</dt><dd>{product.unit} · {unitName(product.unit)}</dd></div>
          <div><dt>Peso</dt><dd>{product.weight == null ? 'Não informado' : `${product.weight} kg por unidade`}</dd></div>
          <div><dt>Custo de compra</dt><dd>{product.purchaseQuoteValue == null ? 'Não informado' : formatCurrency(product.purchaseQuoteValue)}</dd></div>
          <div><dt>Valor de venda</dt><dd>{product.saleValue == null ? 'Não informado' : formatCurrency(product.saleValue)}</dd></div>
          <div><dt>Receita</dt><dd>{product.recipe?.length ? `${product.recipe.length} componente(s)` : 'Material terminal'}</dd></div>
        </dl>
        {product.notes && <div className="notes"><strong>Observações</strong><pre>{product.notes}</pre></div>}
        {product.preparation && <div className="notes"><strong>Modo de preparo</strong><pre>{product.preparation}</pre></div>}
      </section>
      <div className="detail-actions detail-actions--record">
        <Link to="/produtos/$productCode/editar" params={{ productCode: product.productCode }} className="button secondary"><Edit3 size={17} /> Editar</Link>
      </div>
      <section className="form-section"><div className="section-heading"><p className="eyebrow">composição</p><h2>Receita</h2></div>
        {product.recipe?.length ? <ProductBomTree key={product.productCode} productCode={product.productCode} products={products} /> : <p className="hint-box">Este Produto não tem Receita. Ele aparece como material terminal no BOM.</p>}
      </section>
      <section className="danger-zone">
        <div>
          <p className="eyebrow">exclusão</p>
          <h2>Remover Produto</h2>
          {canDelete ? <p>Não há receitas nem Listas de Materiais que usem este Produto.</p> : <>
            <p>Remoção bloqueada enquanto estes registros usarem o Produto:</p>
            <DependencyList dependencies={dependencies} />
          </>}
        </div>
      </section>
      <div className="detail-actions danger-actions"><button type="button" className="button danger" disabled={!canDelete} onClick={() => void deleteCurrent}><Trash2 size={17} /> Excluir</button></div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </div>
  )
}

function dependencyMessage(dependencies: ProductDependencies): string {
  const recipeNames = dependencies.recipes.map((product) => product.name)
  const listNames = dependencies.lists.map((list) => list.name)
  const parts = [recipeNames.length ? `Receitas: ${recipeNames.join(', ')}` : '', listNames.length ? `Listas: ${listNames.join(', ')}` : ''].filter(Boolean)
  return parts.length ? `Não pode excluir enquanto houver dependências. ${parts.join('. ')}` : 'Não há dependências.'
}

function DependencyList({ dependencies }: { dependencies: ProductDependencies }) {
  return <ul className="dependency-list" aria-label="Dependências que impedem a exclusão">
    {dependencies.recipes.map((product) => <li key={`recipe-${product.productCode}`}><span>Receita</span><Link to="/produtos/$productCode" params={{ productCode: product.productCode }}>{product.name}</Link></li>)}
    {dependencies.lists.map((list) => <li key={`list-${list.id}`}><span>Lista de Materiais</span><Link to="/listas/$listId" params={{ listId: list.id }}>{list.name}</Link></li>)}
  </ul>
}
