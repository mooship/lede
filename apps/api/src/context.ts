import { verifyToken } from '@clerk/backend'
import type { Env } from './env.js'

export type Context = {
  userId: string | null
  env: Env
}

export async function createContext(req: Request, env: Env): Promise<Context> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, env }
  }

  const token = authHeader.slice(7)

  try {
    const verified = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })
    return { userId: verified.sub, env }
  } catch {
    return { userId: null, env }
  }
}
