import type { ProductRecord } from '../../domain/catalog'
import { calculateBom, calculateProductTree } from '../bom/calculator'

const createdAt = '2026-01-01T00:00:00.000Z'

function product(values: Pick<ProductRecord, 'productCode' | 'name' | 'category' | 'unit' | 'recipe'> & Partial<Pick<ProductRecord, 'weight' | 'notes' | 'preparation'>>): ProductRecord {
  return {
    id: values.productCode,
    productCode: values.productCode,
    name: values.name,
    category: values.category,
    unit: values.unit,
    weight: values.weight ?? null,
    purchaseQuoteValue: null,
    saleValue: null,
    notes: values.notes ?? null,
    preparation: values.preparation ?? null,
    recipe: values.recipe,
    imageUrl: null,
    createdAt,
    updatedAt: createdAt,
  }
}

/** Exemplo didático isolado: esses registros nunca são lidos ou escritos no IndexedDB. */
export const guideProducts: ProductRecord[] = [
  product({ productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', recipe: null }),
  product({ productCode: 'agua', name: 'Água', category: 'm', unit: 'L', recipe: null }),
  product({ productCode: 'mucarela', name: 'Muçarela', category: 'm', unit: 'KG', recipe: null }),
  product({ productCode: 'caixa', name: 'Caixa', category: 'e', unit: 'BX', recipe: null }),
  product({
    productCode: 'massa-de-pizza',
    name: 'Massa de pizza',
    category: 's',
    unit: 'KG',
    recipe: [{ id: 'farinha', quantity: 0.6 }, { id: 'agua', quantity: 0.4 }],
  }),
  product({
    productCode: 'pizza-de-mucarela',
    name: 'Pizza de muçarela',
    category: 'u',
    unit: 'UN',
    weight: 1,
    recipe: [{ id: 'massa-de-pizza', quantity: 1 }, { id: 'mucarela', quantity: 0.3 }],
  }),
  product({
    productCode: 'pacote-com-3-pizzas',
    name: 'Pacote com 3 pizzas',
    category: 'p',
    unit: 'PC',
    recipe: [{ id: 'pizza-de-mucarela', quantity: 3 }, { id: 'caixa', quantity: 1 }],
  }),
]

export const guideTrees = {
  massa: calculateProductTree(guideProducts, 'massa-de-pizza'),
  pizza: calculateProductTree(guideProducts, 'pizza-de-mucarela'),
  pacote: calculateProductTree(guideProducts, 'pacote-com-3-pizzas'),
  lista: calculateBom(guideProducts, [{ listId: 'guia', productCode: 'pacote-com-3-pizzas', quantity: 10 }]),
} as const
