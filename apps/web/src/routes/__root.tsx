import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { PageMessage } from '../components/PageMessage.js'

const DESCRIPTION =
  'A free, ad-free daily news digest. Every morning, Tidel curates the most significant stories across world news, technology, science, business, and sport.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Tidel' },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:site_name', content: 'Tidel' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Tidel — Daily News Digest' },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Tidel — Daily News Digest' },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
  }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
  errorComponent: () => <PageMessage message="Something went wrong." color="var(--colors-world)" />,
  notFoundComponent: () => <PageMessage message="Page not found." />,
})
