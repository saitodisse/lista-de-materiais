import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { MaterialListDetailPage, MaterialListEditorPage, MaterialListsPage } from './features/material-lists/MaterialListPages'
import { ProductDetailPage, ProductEditorPage, ProductsPage } from './features/products/ProductPages'
import { ProductPrintPage } from './features/products/ProductPrintPage'
import { HomePage } from './routes/HomePage'

const rootRoute = createRootRoute({ component: AppShell })
const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ProductsPage })
const productsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos', beforeLoad: () => { throw redirect({ to: '/' }) } })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'configuracoes', component: HomePage })
const newProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/novo', component: ProductEditorPage })
const productRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode', component: ProductDetailPage })
const productPrintRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/imprimir', component: ProductPrintPage })
const editProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/editar', component: ProductEditorPage })
const listsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas', component: MaterialListsPage })
const newListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/nova', component: MaterialListEditorPage })
const listRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId', component: MaterialListDetailPage })
const editListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId/editar', component: MaterialListEditorPage })

const routeTree = rootRoute.addChildren([catalogRoute, productsRoute, settingsRoute, newProductRoute, productPrintRoute, productRoute, editProductRoute, listsRoute, newListRoute, listRoute, editListRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
