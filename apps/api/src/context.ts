import type { ExecutionContext } from '@cloudflare/workers-types'
import { createDb } from '@tidel/db'
import type { Env } from './env.js'

export type Context = {
  isAdmin: boolean
  env: Env
  executionCtx: ExecutionContext
  db: ReturnType<typeof createDb>
}

const enc = new TextEncoder()

/**
 * Extracts the Bearer token and compares it to `ADMIN_SECRET` using a
 * timing-safe equality check to prevent timing-based secret enumeration.
 * Length mismatch short-circuits before the comparison.
 */
export async function createContext(
  req: Request,
  env: Env,
  executionCtx: ExecutionContext,
): Promise<Context> {
  const authHeader = req.headers.get('Authorization')
  const db = createDb(env.DATABASE_URL)

  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, env, executionCtx, db }
  }

  const token = authHeader.slice(7)
  const a = enc.encode(token)
  const b = enc.encode(env.ADMIN_SECRET)
  const isAdmin =
    a.length === b.length &&
    (
      crypto.subtle as typeof crypto.subtle & {
        timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean
      }
    ).timingSafeEqual(a, b)
  return { isAdmin, env, executionCtx, db }
}
