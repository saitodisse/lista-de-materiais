import type { ProductRecord } from '../../domain/catalog'

export const DEMO_LIST_ID = 'demo-lista-pacote-3-pizzas-mucarela'
export const DEMO_LIST_NAME = 'Pacote com 3 pizzas de muçarela'
export const DEMO_LIST_PRODUCT_CODE = 'pacote-3-pizzas-mucarela'
export const DEMO_LIST_QUANTITY = 1

export const DEMO_PRODUCT_CODES = [
  'farinha-de-trigo',
  'agua-morna',
  'fermento-biologico-seco',
  'acucar',
  'sal',
  'azeite',
  'tomate',
  'mucarela',
  'oregano',
  'massa-de-pizza',
  'molho-de-tomate',
  'pizza-de-mucarela',
  'caixa-para-3-pizzas',
  'pacote-3-pizzas-mucarela',
] as const

export function createDemoProducts(now: string): ProductRecord[] {
  return [
    {
      id: 'farinha-de-trigo', productCode: 'farinha-de-trigo', name: 'Farinha de trigo',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 5.8, saleValue: null, notes: 'Base da massa de pizza.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'agua-morna', productCode: 'agua-morna', name: 'Água morna',
      category: 'm', unit: 'L', weight: 1, purchaseQuoteValue: 0.01, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'fermento-biologico-seco', productCode: 'fermento-biologico-seco', name: 'Fermento biológico seco',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 45, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'acucar', productCode: 'acucar', name: 'Açúcar',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 4.5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'sal', productCode: 'sal', name: 'Sal',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 3.2, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'azeite', productCode: 'azeite', name: 'Azeite',
      category: 'm', unit: 'L', weight: 0.92, purchaseQuoteValue: 35, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'tomate', productCode: 'tomate', name: 'Tomate',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 7.5, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'mucarela', productCode: 'mucarela', name: 'Muçarela',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 42, saleValue: null, notes: 'Queijo ralado ou fatiado.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'oregano', productCode: 'oregano', name: 'Orégano',
      category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: 160, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'massa-de-pizza', productCode: 'massa-de-pizza', name: 'Massa de pizza',
      category: 's', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: 'Fórmula por kg de massa; uma pizza usa 0,508 kg.', preparation: 'Misture farinha, sal, açúcar e fermento. Junte azeite e água morna aos poucos, sove até ficar lisa e deixe descansar por 30 a 45 minutos.',
      recipe: [{ id: 'farinha-de-trigo', quantity: 0.472 }, { id: 'agua-morna', quantity: 0.393 }, { id: 'fermento-biologico-seco', quantity: 0.02 }, { id: 'acucar', quantity: 0.024 }, { id: 'sal', quantity: 0.01 }, { id: 'azeite', quantity: 0.089 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'molho-de-tomate', productCode: 'molho-de-tomate', name: 'Molho de tomate',
      category: 's', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: 'Molho de tomate temperado.', preparation: 'Cozinhe o tomate com azeite, sal e orégano até obter um molho homogêneo. Reserve para a montagem.',
      recipe: [{ id: 'tomate', quantity: 0.93 }, { id: 'azeite', quantity: 0.03 }, { id: 'sal', quantity: 0.02 }, { id: 'oregano', quantity: 0.002 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'pizza-de-mucarela', productCode: 'pizza-de-mucarela', name: 'Pizza de muçarela',
      category: 'u', unit: 'UN', weight: 1.035, purchaseQuoteValue: null, saleValue: 28, notes: 'Pizza individual pronta para assar. Ingredientes medidos em kg ou L.', preparation: '1. Misture os secos: em uma tigela, misture farinha, sal, açúcar e fermento biológico.\n2. Adicione os líquidos: acrescente azeite e água morna aos poucos, até a massa soltar das mãos.\n3. Sove e descanse: sove até ficar lisa, cubra e deixe crescer por 30 a 45 minutos.\n4. Abra a massa: abra em uma assadeira untada com azeite.\n5. Monte a pizza: espalhe o molho, cubra com muçarela, tomate e orégano.\n6. Asse: leve ao forno preaquecido a 200 °C por 20 a 30 minutos, até dourar e o queijo derreter.',
      recipe: [{ id: 'massa-de-pizza', quantity: 0.508 }, { id: 'molho-de-tomate', quantity: 0.125 }, { id: 'mucarela', quantity: 0.3 }, { id: 'tomate', quantity: 0.1 }, { id: 'oregano', quantity: 0.002 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'caixa-para-3-pizzas', productCode: 'caixa-para-3-pizzas', name: 'Caixa para 3 pizzas',
      category: 'e', unit: 'BX', weight: 0.2, purchaseQuoteValue: 3.5, saleValue: null, notes: 'Embalagem para o pacote.', preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'pacote-3-pizzas-mucarela', productCode: 'pacote-3-pizzas-mucarela', name: 'Pacote com 3 pizzas de muçarela',
      category: 'p', unit: 'PC', weight: 3.305, purchaseQuoteValue: null, saleValue: 75, notes: 'Produto final: três pizzas de muçarela em uma caixa.', preparation: 'Asse ou congele as três pizzas conforme a operação. Depois de resfriadas, acomode-as na caixa e feche o pacote.',
      recipe: [{ id: 'pizza-de-mucarela', quantity: 3 }, { id: 'caixa-para-3-pizzas', quantity: 1 }], imageUrl: null, createdAt: now, updatedAt: now,
    },
  ]
}
