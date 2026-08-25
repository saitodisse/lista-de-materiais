import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Minus, Plus, Save } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ErrorNotice } from '../../components/Page'
import { categoryOptions, DomainValidationError, productSelectionLabel, slugify, sortProductsForSelection, unitOptions, type ProductRecord } from '../../domain/catalog'

const productFormSchema = z.object({
  productCode: z.string().trim().min(1, 'Informe um código.'),
  name: z.string().trim().min(1, 'Informe um nome.'),
  category: z.string().min(1, 'Selecione uma categoria.'),
  unit: z.string().min(1, 'Selecione uma unidade.'),
  weight: z.string(),
  purchaseQuoteValue: z.string(),
  saleValue: z.string(),
  notes: z.string(),
  preparation: z.string(),
  recipe: z.array(z.object({ id: z.string(), quantity: z.coerce.number() })),
})

type ProductFormInput = z.input<typeof productFormSchema>

function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export function ProductForm({
  product,
  products,
  onSave,
}: {
  product?: ProductRecord
  products: ProductRecord[]
  onSave: (record: ProductRecord, previousCode?: string) => Promise<void>
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const isEditing = Boolean(product)
  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productCode: product?.productCode ?? '',
      name: product?.name ?? '',
      category: product?.category ?? 'm',
      unit: product?.unit ?? 'UN',
      weight: product?.weight?.toString() ?? '',
      purchaseQuoteValue: product?.purchaseQuoteValue?.toString() ?? '',
      saleValue: product?.saleValue?.toString() ?? '',
      notes: product?.notes ?? '',
      preparation: product?.preparation ?? '',
      recipe: product?.recipe?.map((item) => ({ ...item })) ?? [],
    },
  })
  const recipe = useFieldArray({ control: form.control, name: 'recipe' })
  const productsForSelection = sortProductsForSelection(products)
  const duplicateCodeMessage = (value: string): string | null => {
    const normalizedCode = slugify(value)
    if (isEditing || !normalizedCode) return null
    return products.some((item) => item.productCode === normalizedCode)
      ? `Já existe um Produto com o código “${normalizedCode}”.`
      : null
  }
  const productCodeField = form.register('productCode')

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    const now = new Date().toISOString()
    const productCode = slugify(values.productCode)
    const duplicateMessage = duplicateCodeMessage(productCode)
    if (duplicateMessage) {
      form.setError('productCode', { type: 'duplicate', message: duplicateMessage })
      return
    }
    const record: ProductRecord = {
      id: product?.id ?? productCode,
      productCode,
      name: values.name.trim(),
      category: values.category as ProductRecord['category'],
      unit: values.unit as ProductRecord['unit'],
      weight: numberOrNull(values.weight),
      purchaseQuoteValue: numberOrNull(values.purchaseQuoteValue),
      saleValue: numberOrNull(values.saleValue),
      notes: values.notes.trim() || null,
      preparation: values.preparation.trim() || null,
      recipe: values.recipe.length > 0 ? values.recipe.map((item) => ({ id: item.id, quantity: Number(item.quantity) })) : null,
      imageUrl: null,
      createdAt: product?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      await onSave(record, product?.productCode)
    } catch (error) {
      setFormError(error instanceof DomainValidationError ? error.issues.join(' ') : error instanceof Error ? error.message : 'Não foi possível salvar o Produto.')
    }
  })

  return (
    <form className="editor-form" onSubmit={(event) => void submit(event)} noValidate>
      <section className="form-section">
        <div className="section-heading"><p className="eyebrow">identificação</p><h2>Ficha do Produto</h2></div>
        <div className="form-grid two-columns">
          <label htmlFor="product-code">Código
            <input
              id="product-code"
              className="code-input"
              {...productCodeField}
              disabled={isEditing}
              onChange={(event) => {
                productCodeField.onChange(event)
                if (form.getFieldState('productCode').error?.type === 'duplicate') {
                  form.clearErrors('productCode')
                }
              }}
              onBlur={(event) => {
                productCodeField.onBlur(event)
                const normalizedCode = slugify(event.target.value)
                const duplicateMessage = duplicateCodeMessage(normalizedCode)
                form.setValue('productCode', normalizedCode, { shouldDirty: true, shouldTouch: true })
                if (duplicateMessage) {
                  form.setError('productCode', { type: 'duplicate', message: duplicateMessage })
                } else {
                  form.clearErrors('productCode')
                  void form.trigger('productCode')
                }
              }}
              placeholder="pao-integral-1-kg"
              aria-describedby="product-code-help"
            />
            <small id="product-code-help">{isEditing ? 'Código permanente deste Produto.' : 'Será normalizado em minúsculas, com hífens.'}</small>
            {form.formState.errors.productCode && <span className="field-error">{form.formState.errors.productCode.message}</span>}
          </label>
          <label htmlFor="product-name">Nome
            <input id="product-name" {...form.register('name')} placeholder="Ex.: Pão integral" />
            {form.formState.errors.name && <span className="field-error">{form.formState.errors.name.message}</span>}
          </label>
          <label htmlFor="product-category">Categoria
            <select id="product-category" {...form.register('category')}>
              {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.descriptionPtBr}</option>)}
            </select>
          </label>
          <label htmlFor="product-unit">Unidade
            <select id="product-unit" {...form.register('unit')}>
              {unitOptions.map((unit) => <option key={unit.id} value={unit.id}>{unit.id} · {unit.descriptionPtBr}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading"><p className="eyebrow">medidas e valores opcionais</p><h2>Peso, custo e venda</h2></div>
        <div className="form-grid two-columns">
          <label htmlFor="product-weight">Peso por unidade (kg)
            <input id="product-weight" type="number" step="any" min="0" inputMode="decimal" {...form.register('weight')} placeholder="Ex.: 0,65" />
            <small>Use quando uma unidade tiver peso conhecido.</small>
          </label>
          <label htmlFor="product-cost">Custo de compra (R$)
            <input id="product-cost" type="number" step="any" min="0" inputMode="decimal" {...form.register('purchaseQuoteValue')} placeholder="Ex.: 12,90" />
            <small>Sem valor, o custo só aparece se a receita puder calculá-lo.</small>
          </label>
          <label htmlFor="product-sale-value">Valor de venda (R$)
            <input id="product-sale-value" type="number" step="any" min="0" inputMode="decimal" {...form.register('saleValue')} placeholder="Ex.: 24,90" />
            <small>Usado no total da Lista quando este Produto for selecionado.</small>
          </label>
          <label className="full-width" htmlFor="product-notes">Observações
            <textarea id="product-notes" rows={3} {...form.register('notes')} placeholder="Informação útil para quem consulta esta ficha." />
          </label>
          <label className="full-width" htmlFor="product-preparation">Modo de preparo
            <textarea id="product-preparation" rows={5} {...form.register('preparation')} placeholder="Descreva as etapas de preparo, montagem ou uso deste Produto." />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading inline-heading"><div><p className="eyebrow">composição</p><h2>Receita</h2><p>Produtos existentes, sem repetição e em quantidade positiva.</p></div><button type="button" className="button secondary" onClick={() => recipe.append({ id: '', quantity: 1 })}><Plus size={17} /> Adicionar componente</button></div>
        {recipe.fields.length === 0 ? <p className="hint-box">Este Produto não tem Receita e será tratado como material terminal.</p> : (
          <div className="recipe-lines">
            {recipe.fields.map((field, index) => (
              <div className="recipe-line" key={field.id}>
                <label className="sr-only" htmlFor={`recipe-${field.id}`}>Componente {index + 1}</label>
                <select id={`recipe-${field.id}`} {...form.register(`recipe.${index}.id`)}>
                  <option value="">Selecione um Produto</option>
                  {productsForSelection.filter((item) => item.productCode !== product?.productCode).map((item) => <option key={item.id} value={item.productCode}>{productSelectionLabel(item)}</option>)}
                </select>
                <label className="sr-only" htmlFor={`quantity-${field.id}`}>Quantidade de {index + 1}</label>
                <input id={`quantity-${field.id}`} type="number" step="any" min="0" inputMode="decimal" {...form.register(`recipe.${index}.quantity`)} />
                <button type="button" className="icon-button" onClick={() => recipe.remove(index)} aria-label={`Remover componente ${index + 1}`}><Minus size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </section>
      {formError && <ErrorNotice>{formError}</ErrorNotice>}
      <div className="form-actions"><button type="submit" className="button primary" disabled={form.formState.isSubmitting}><Save size={18} /> {form.formState.isSubmitting ? 'Salvando…' : 'Salvar Produto'}</button></div>
    </form>
  )
}
