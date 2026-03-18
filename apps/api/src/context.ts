import type { Env } from './env.js'

export type Context = {
  isAdmin: boolean
  env: Env
}

export async function createContext(req: Request, env: Env): Promise<Context> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, env }
  }

  const token = authHeader.slice(7)
  return { isAdmin: token === env.ADMIN_SECRET, env }
}
