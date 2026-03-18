import '@fontsource-variable/syne'
import '@fontsource/instrument-serif'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Component, StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen.js'
import { createTrpcClient, trpc } from './trpc.js'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: unknown): { hasError: boolean } {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0f0f0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#e85a3c', fontFamily: "'Syne Variable', 'Syne', sans-serif" }}>
            Something went wrong. Please refresh the page.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
