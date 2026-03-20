import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen.js'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  })
}

let _router: ReturnType<typeof createRouter> | undefined

export function getRouter() {
  if (!_router) {
    _router = createRouter()
  }
  return _router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
