import { createRootRoute, Outlet } from '@tanstack/react-router'
import { PageMessage } from '../components/PageMessage.js'

export const Route = createRootRoute({
  component: () => <Outlet />,
  errorComponent: () => <PageMessage message="Something went wrong." color="var(--colors-world)" />,
  notFoundComponent: () => <PageMessage message="Page not found." />,
})
