import { vi } from 'vitest'

export const Link = ({
  children,
  to,
  params,
}: {
  children: React.ReactNode
  to: string
  params?: Record<string, string>
}) => {
  const href = params ? to.replace('$id', params.id ?? '') : to
  return <a href={href}>{children}</a>
}

export const createFileRoute = () => (config: object) => ({
  useLoaderData: vi.fn(),
  useParams: vi.fn(),
  useSearch: vi.fn(),
  ...config,
})

export const useNavigate = () => vi.fn()
export const useSearch = () => ({ category: 'All' })
