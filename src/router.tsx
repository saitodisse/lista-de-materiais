import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { MaterialListDetailPage, MaterialListEditorPage, MaterialListsPage } from './features/material-lists/MaterialListPages'
import { ProductDetailPage, ProductEditorPage, ProductsPage } from './features/products/ProductPages'
import { ProductPrintPage } from './features/products/ProductPrintPage'
import { GuidePage } from './routes/GuidePage'
import { HomePage } from './routes/HomePage'
import { PrivacyPolicyPage } from './routes/PrivacyPolicyPage'
import { TermsOfServicePage } from './routes/TermsOfServicePage'

const rootRoute = createRootRoute({ component: AppShell })
const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ProductsPage })
const guideRoute = createRoute({ getParentRoute: () => rootRoute, path: 'como-usar', component: GuidePage })
const productsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos', beforeLoad: () => { throw redirect({ to: '/' }) } })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'configuracoes', component: HomePage })
const privacyPolicyRoute = createRoute({ getParentRoute: () => rootRoute, path: 'politica-de-privacidade', component: PrivacyPolicyPage })
const termsOfServiceRoute = createRoute({ getParentRoute: () => rootRoute, path: 'termos-de-servico', component: TermsOfServicePage })
const newProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/novo', component: ProductEditorPage })
const productRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode', component: ProductDetailPage })
const productPrintRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/imprimir', component: ProductPrintPage })
const editProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/editar', component: ProductEditorPage })
const listsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas', component: MaterialListsPage })
const newListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/nova', component: MaterialListEditorPage })
const listRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId', component: MaterialListDetailPage })
const editListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId/editar', component: MaterialListEditorPage })

const routeTree = rootRoute.addChildren([catalogRoute, guideRoute, productsRoute, settingsRoute, privacyPolicyRoute, termsOfServiceRoute, newProductRoute, productPrintRoute, productRoute, editProductRoute, listsRoute, newListRoute, listRoute, editListRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
