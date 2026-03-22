import type { AppRouter } from '@tidel/api-worker/types'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL ?? 'http://localhost:8787'}/trpc`,
      }),
    ],
  })
}

export function createServerTrpcCaller() {
  const url = `${process.env.API_URL ?? 'http://localhost:8787'}/trpc`
  return createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url })],
  })
}
