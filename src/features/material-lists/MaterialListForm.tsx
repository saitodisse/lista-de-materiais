import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Minus, Plus, Save } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorNotice } from '../../components/Page'
import { DomainValidationError, productSelectionLabel, sortProductsForSelection, type MaterialList, type MaterialListEntry, type ProductRecord } from '../../domain/catalog'

const listFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome para a Lista.'),
  entries: z.array(z.object({ productCode: z.string().min(1, 'Selecione um Produto.'), quantity: z.coerce.number().positive('Use uma quantidade maior que zero.') })).min(1, 'Inclua ao menos um Produto.'),
})

type ListFormInput = z.input<typeof listFormSchema>

export function MaterialListForm({
  list,
  entries,
  products,
  onSave,
}: {
  list?: MaterialList
  entries: MaterialListEntry[]
  products: ProductRecord[]
  onSave: (name: string, entries: Array<Omit<MaterialListEntry, 'listId'>>) => Promise<void>
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ListFormInput>({
    resolver: zodResolver(listFormSchema),
    defaultValues: { name: list?.name ?? '', entries: entries.map((entry) => ({ productCode: entry.productCode, quantity: entry.quantity })) },
  })
  const fields = useFieldArray({ control: form.control, name: 'entries' })
  const productsForSelection = sortProductsForSelection(products)
  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSave(values.name.trim(), values.entries.map((entry) => ({ productCode: entry.productCode, quantity: Number(entry.quantity) })))
    } catch (error) {
      setFormError(error instanceof DomainValidationError ? error.issues.join(' ') : error instanceof Error ? error.message : 'Não foi possível salvar a Lista.')
    }
  })

  return (
    <form className="editor-form" onSubmit={(event) => void submit(event)} noValidate>
      <section className="form-section">
        <div className="section-heading"><p className="eyebrow">identificação</p><h2>Lista de Materiais</h2></div>
        <div className="form-grid"><label htmlFor="list-name">Nome
          <input id="list-name" {...form.register('name')} placeholder="Ex.: 100 pães integrais" autoFocus />
          {form.formState.errors.name && <span className="field-error">{form.formState.errors.name.message}</span>}
        </label></div>
      </section>
      <section className="form-section">
        <div className="section-heading inline-heading"><div><p className="eyebrow">quantidades desejadas</p><h2>Produtos da lista</h2><p>Cada Produto pode aparecer uma vez.</p></div><button type="button" className="button secondary" disabled={products.length === 0} onClick={() => fields.append({ productCode: '', quantity: 1 })}><Plus size={17} /> Adicionar Produto</button></div>
        {fields.fields.length === 0 ? <p className="hint-box">Inclua os Produtos que deseja calcular.</p> : <div className="recipe-lines list-lines">
          {fields.fields.map((field, index) => <div className="recipe-line" key={field.id}>
            <label className="sr-only" htmlFor={`list-product-${field.id}`}>Produto {index + 1}</label>
            <select id={`list-product-${field.id}`} {...form.register(`entries.${index}.productCode`)}>
              <option value="">Selecione um Produto</option>
              {productsForSelection.map((product) => <option key={product.id} value={product.productCode}>{productSelectionLabel(product)}</option>)}
            </select>
            <label className="sr-only" htmlFor={`list-quantity-${field.id}`}>Quantidade {index + 1}</label>
            <input id={`list-quantity-${field.id}`} type="number" step="any" min="0" inputMode="decimal" {...form.register(`entries.${index}.quantity`)} />
            <button type="button" className="icon-button" onClick={() => fields.remove(index)} aria-label={`Remover Produto ${index + 1}`}><Minus size={18} /></button>
          </div>)}
        </div>}
        {form.formState.errors.entries?.message && <span className="field-error">{form.formState.errors.entries.message}</span>}
      </section>
      {formError && <ErrorNotice>{formError}</ErrorNotice>}
      <div className="form-actions"><button type="submit" className="button primary" disabled={form.formState.isSubmitting || products.length === 0}><Save size={18} /> {form.formState.isSubmitting ? 'Salvando…' : 'Salvar Lista'}</button></div>
    </form>
  )
}
