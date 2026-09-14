import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { getInitialProfileId } from './db/database'
import { MaterialListDetailPage, MaterialListEditorPage, MaterialListsPage } from './features/material-lists/MaterialListPages'
import { ProductDetailPage, ProductEditorPage, ProductsPage } from './features/products/ProductPages'
import { ProductPrintPage } from './features/products/ProductPrintPage'
import { GuidePage } from './routes/GuidePage'
import { HomePage } from './routes/HomePage'
import { AppHomepagePage } from './routes/AppHomepagePage'
import { PrivacyPolicyPage } from './routes/PrivacyPolicyPage'
import { TermsOfServicePage } from './routes/TermsOfServicePage'

const rootRoute = createRootRoute({ component: AppShell })
const redirectToProfile = async (to: string, params: Record<string, string> = {}, hash?: string) => { throw redirect({ to: to as never, params: { ...(params as object), profileId: await getInitialProfileId() } as never, ...(hash ? { hash } : {}) } as never) }

const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', beforeLoad: () => redirectToProfile('/perfis/$profileId/produtos') })
const appHomepageRoute = createRoute({ getParentRoute: () => rootRoute, path: 'sobre-o-aplicativo', component: AppHomepagePage })
const guideRoute = createRoute({ getParentRoute: () => rootRoute, path: 'como-usar', component: GuidePage })
const productsAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos', beforeLoad: () => redirectToProfile('/perfis/$profileId/produtos') })
const newProductAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/novo', beforeLoad: () => redirectToProfile('/perfis/$profileId/produtos/novo') })
const productPrintAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/imprimir', beforeLoad: ({ params }) => redirectToProfile('/perfis/$profileId/produtos/$productCode/imprimir', { productCode: params.productCode }) })
const editProductAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode/editar', beforeLoad: ({ params }) => redirectToProfile('/perfis/$profileId/produtos/$productCode/editar', { productCode: params.productCode }) })
const productAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'produtos/$productCode', beforeLoad: ({ params }) => redirectToProfile('/perfis/$profileId/produtos/$productCode', { productCode: params.productCode }) })
const settingsAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'configuracoes', beforeLoad: ({ location }) => redirectToProfile('/perfis/$profileId/configuracoes', {}, location.hash) })
const listsAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas', beforeLoad: () => redirectToProfile('/perfis/$profileId/listas') })
const newListAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/nova', beforeLoad: () => redirectToProfile('/perfis/$profileId/listas/nova') })
const editListAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId/editar', beforeLoad: ({ params }) => redirectToProfile('/perfis/$profileId/listas/$listId/editar', { listId: params.listId }) })
const listAliasRoute = createRoute({ getParentRoute: () => rootRoute, path: 'listas/$listId', beforeLoad: ({ params }) => redirectToProfile('/perfis/$profileId/listas/$listId', { listId: params.listId }) })
const privacyPolicyRoute = createRoute({ getParentRoute: () => rootRoute, path: 'politica-de-privacidade', component: PrivacyPolicyPage })
const termsOfServiceRoute = createRoute({ getParentRoute: () => rootRoute, path: 'termos-de-servico', component: TermsOfServicePage })

const profileProductsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/produtos', component: ProductsPage })
const profileNewProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/produtos/novo', component: ProductEditorPage })
const profileProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/produtos/$productCode', component: ProductDetailPage })
const profileProductPrintRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/produtos/$productCode/imprimir', component: ProductPrintPage })
const profileEditProductRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/produtos/$productCode/editar', component: ProductEditorPage })
const profileListsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/listas', component: MaterialListsPage })
const profileNewListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/listas/nova', component: MaterialListEditorPage })
const profileListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/listas/$listId', component: MaterialListDetailPage })
const profileEditListRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/listas/$listId/editar', component: MaterialListEditorPage })
const profileSettingsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'perfis/$profileId/configuracoes', component: HomePage })

const routeTree = rootRoute.addChildren([
  catalogRoute, appHomepageRoute, guideRoute, productsAliasRoute, newProductAliasRoute, productPrintAliasRoute, editProductAliasRoute, productAliasRoute, settingsAliasRoute, listsAliasRoute, newListAliasRoute, editListAliasRoute, listAliasRoute, privacyPolicyRoute, termsOfServiceRoute,
  profileProductsRoute, profileNewProductRoute, profileProductPrintRoute, profileProductRoute, profileEditProductRoute, profileListsRoute, profileNewListRoute, profileListRoute, profileEditListRoute, profileSettingsRoute,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
