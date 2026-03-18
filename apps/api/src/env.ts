export interface Env {
  DATABASE_URL: string
  ANTHROPIC_API_KEY: string | undefined
  CLERK_SECRET_KEY: string
  CLERK_ADMIN_USER_ID: string
  WEB_ORIGIN: string
  BUILD_CRON_ENABLED: string
}
