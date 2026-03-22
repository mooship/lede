import '@fontsource/opendyslexic/400.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from '../../styled-system/css'
import { BottomNav } from '../components/BottomNav.js'
import { PageMessage } from '../components/PageMessage.js'
import { SettingsProvider } from '../context/settings.js'
import { createTrpcClient, trpc } from '../trpc.js'

const DESCRIPTION =
  'A free, ad-free daily news digest. Every morning, Tidel curates the most significant stories across world news, technology, science, business, and sport.'

const APP_URL = import.meta.env.VITE_APP_URL ?? ''

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

const pageWrapClass = css({
  paddingBottom: { base: 'calc(49px + env(safe-area-inset-bottom))', md: '0' },
})

const FOUC_SCRIPT =
  `(function(){var t=localStorage.getItem('tidel-theme'),f=localStorage.getItem('tidel-font'),d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');if(f==='opendyslexic')document.documentElement.setAttribute('data-font','opendyslexic');})()` as const

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Tidel' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Tidel' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#fafafa', media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: '#0f0f0f', media: '(prefers-color-scheme: dark)' },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:site_name', content: 'Tidel' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Tidel — Daily News Digest' },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Tidel — Daily News Digest' },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [
      {
        rel: 'alternate',
        type: 'application/atom+xml',
        title: 'Tidel',
        href: `${API_URL}/atom.xml`,
      },
      {
        rel: 'alternate',
        type: 'application/atom+xml',
        title: 'Tidel — Morning Edition',
        href: `${API_URL}/atom.xml?slot=morning`,
      },
      {
        rel: 'alternate',
        type: 'application/atom+xml',
        title: 'Tidel — Afternoon Edition',
        href: `${API_URL}/atom.xml?slot=afternoon`,
      },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'Tidel',
        href: `${API_URL}/rss.xml`,
      },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'Tidel — Morning Edition',
        href: `${API_URL}/rss.xml?slot=morning`,
      },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'Tidel — Afternoon Edition',
        href: `${API_URL}/rss.xml?slot=afternoon`,
      },
    ],
    scripts: [
      { children: FOUC_SCRIPT },
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
    <html lang="en" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <SettingsProvider>
              <div className={pageWrapClass}>
                <Outlet />
              </div>
              <BottomNav />
            </SettingsProvider>
          </QueryClientProvider>
        </trpc.Provider>
        <Scripts />
      </body>
    </html>
  )
}
