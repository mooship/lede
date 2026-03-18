export interface Env {
  DATABASE_URL: string
  ANTHROPIC_API_KEY: string | undefined
  ADMIN_SECRET: string
  WEB_ORIGIN: string
  BUILD_CRON_ENABLED: string
}
