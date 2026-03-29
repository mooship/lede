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

let _serverCaller: ReturnType<typeof createTRPCClient<AppRouter>> | null = null

export function createServerTrpcCaller() {
  if (!_serverCaller) {
    const url = `${process.env.API_URL ?? 'http://localhost:8787'}/trpc`
    _serverCaller = createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url })],
    })
  }
  return _serverCaller
}
