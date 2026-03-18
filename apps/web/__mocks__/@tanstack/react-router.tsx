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

export const createFileRoute = () => (config: { component: unknown }) => config
