import { calculateBom, calculateProductTree } from '../bom/calculator'
import {
  createDemoProducts,
  DEMO_LIST_ID,
  DEMO_LIST_PRODUCT_CODE,
  DEMO_LIST_QUANTITY,
} from '../demo/demoData'

const createdAt = '2026-01-01T00:00:00.000Z'

/** A mesma estrutura persistida pela demonstração, com horário fixo apenas para o cálculo didático. */
export const guideProducts = createDemoProducts(createdAt)

export const guideTrees = {
  massa: calculateProductTree(guideProducts, 'massa-de-pizza'),
  molho: calculateProductTree(guideProducts, 'molho-de-tomate'),
  pizza: calculateProductTree(guideProducts, 'pizza-de-mucarela'),
  pacote: calculateProductTree(guideProducts, DEMO_LIST_PRODUCT_CODE),
  lista: calculateBom(guideProducts, [{ listId: DEMO_LIST_ID, productCode: DEMO_LIST_PRODUCT_CODE, quantity: DEMO_LIST_QUANTITY }]),
} as const
