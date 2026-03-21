import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { useState } from 'react'
import { PageMessage } from '../components/PageMessage.js'
import { createTrpcClient, trpc } from '../trpc.js'

const DESCRIPTION =
  'A free, ad-free daily news digest. Every morning, Tidel curates the most significant stories across world news, technology, science, business, and sport.'

const APP_URL = import.meta.env.VITE_APP_URL ?? ''

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Tidel' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:site_name', content: 'Tidel' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Tidel — Daily News Digest' },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Tidel — Daily News Digest' },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Tidel',
          url: APP_URL,
          description: DESCRIPTION,
        }),
      },
    ],
  }),
  component: Root,
  errorComponent: () => <PageMessage message="Something went wrong." color="var(--colors-world)" />,
  notFoundComponent: () => <PageMessage message="Page not found." />,
})

function Root() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </trpc.Provider>
        <Scripts />
      </body>
    </html>
  )
}
