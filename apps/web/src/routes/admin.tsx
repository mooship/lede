import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { Category, Slot } from '@tidel/api'
import { useState } from 'react'
import { z } from 'zod'
import { css, cx } from '../../styled-system/css'
import { CATEGORY_CSS_VAR, CATEGORY_LABEL } from '../categories.js'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })

const metaValueSmClass = css({ fontSize: '0.9rem' })
const metaValueWarnClass = css({ color: 'business' })
const sectionMtClass = css({ marginTop: '2' })
const tableMbClass = css({ marginBottom: '10px' })
const thNarrowClass = css({ width: '120px' })
const thMediumClass = css({ width: '80px' })
const thTinyClass = css({ width: '80px' })
const mainClass = css({ maxWidth: '900px', mx: 'auto', px: '8', pt: '12', pb: '20' })

const pageTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: 'textPrimary',
  letterSpacing: '-0.03em',
  lineHeight: '1.1',
  margin: '0 0 8 0',
})

const formClass = css({ display: 'flex', gap: '4', alignItems: 'center', marginBottom: '10' })

const inputClass = css({
  fontFamily: 'display',
  fontSize: '0.85rem',
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  color: 'textPrimary',
  px: '4',
  py: '2',
  flex: '1',
  maxWidth: '400px',
  outline: 'none',
  '&:focus': { borderColor: 'textMuted' },
})

const buttonClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'textPrimary',
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  cursor: 'pointer',
  px: '5',
  py: '2',
})

const sectionHeadingClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  margin: '0 0 4 0',
})

const slotHeadingClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'textSecondary',
  margin: '6 0 3 0',
  paddingBottom: '2',
  borderBottom: '1px solid',
  borderColor: 'border',
})

const metaGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '4',
  marginBottom: '6',
})

const metaCardClass = css({
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  p: '5',
})

const metaLabelClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  marginBottom: '2',
})

const metaValueClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '1.25rem',
  color: 'textPrimary',
})

const categoryGridClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  marginBottom: '10',
})

const categoryCardClass = css({
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  px: '4',
  py: '3',
  flex: '1',
  minWidth: '120px',
})

const actionRowClass = css({
  display: 'flex',
  gap: '3',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: '10',
})

const slotSelectorClass = css({
  display: 'flex',
  gap: '2',
  alignItems: 'center',
  marginBottom: '4',
})

const slotPillBase = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'none',
  border: '1px solid',
  borderColor: 'border',
  cursor: 'pointer',
  px: '4',
  py: '1.5',
  transition: 'color 0.15s, border-color 0.15s',
})

const slotPillActiveClass = css({
  color: 'textPrimary',
  borderColor: 'textMuted',
})

const slotPillInactiveClass = css({
  color: 'textMuted',
  '&:hover': { color: 'textLight' },
})

const tableClass = css({ width: '100%', borderCollapse: 'collapse' })

const thClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textAlign: 'left',
  py: '3',
  px: '4',
  borderBottom: '1px solid',
  borderColor: 'border',
})

const tdClass = css({
  fontFamily: 'display',
  fontSize: '0.8rem',
  color: 'textSecondary',
  py: '3',
  px: '4',
  borderBottom: '1px solid',
  borderColor: 'border',
  wordBreak: 'break-all',
})

const statusOkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'science',
  border: '1px solid',
  borderColor: 'science',
  px: '2',
  py: '0.5',
})

const statusErrClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'world',
  border: '1px solid',
  borderColor: 'world',
  px: '2',
  py: '0.5',
})

const statusTimeoutClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'business',
  border: '1px solid',
  borderColor: 'business',
  px: '2',
  py: '0.5',
})

const errorClass = css({
  fontFamily: 'display',
  fontSize: '0.85rem',
  color: 'world',
  marginTop: '4',
})

const linkClass = css({
  fontFamily: 'display',
  fontSize: '0.8rem',
  color: 'textMuted',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  whiteSpace: 'nowrap',
})

const slotBadgeMorningClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  color: 'tech',
  border: '1px solid',
  borderColor: 'tech',
  px: '3',
  py: '0.5',
})

const slotBadgeAfternoonClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  color: 'business',
  border: '1px solid',
  borderColor: 'business',
  px: '3',
  py: '0.5',
})

type FeedStatus = 'ok' | 'timeout' | 'error'

type SlotStatusData = {
  date: string
  slot: string
  builtAt: string
  storyCount: number
  feedStats: Record<string, FeedStatus> | null
  categoryBreakdown: Record<string, number>
}

type AdminStatusData = SlotStatusData[] | null

function hashSecret(secret: string): string {
  let h = 0
  for (let i = 0; i < secret.length; i++) {
    h = (Math.imul(31, h) + secret.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

const CATEGORY_ORDER: Category[] = [
  'World',
  'Technology',
  'Science',
  'Business / Economy',
  'Sport',
  'Culture',
]

const API_URL = process.env.API_URL ?? 'http://localhost:8787'

const adminStatusServerFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ password: z.string() }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/trpc/edition.adminStatus`, {
      headers: { Authorization: `Bearer ${data.password}` },
    })
    const json = (await res.json()) as {
      result?: { data?: AdminStatusData }
      error?: { message: string; data?: { code?: string } }
    }
    if (json.error) {
      const code = json.error.data?.code
      throw Object.assign(new Error(json.error.message), { code })
    }
    return json.result?.data ?? null
  })

const editionListServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const res = await fetch(`${API_URL}/trpc/edition.list`)
  const json = (await res.json()) as {
    result?: { data?: Array<{ date: string; slot: string; storyCount: number }> }
  }
  return json.result?.data ?? []
})

const triggerBuildServerFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ password: z.string(), slot: z.enum(['morning', 'afternoon']) }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/trpc/edition.build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.password}` },
      body: JSON.stringify({ slot: data.slot }),
    })
    const json = (await res.json()) as {
      result?: { data?: { ok: boolean } }
      error?: { message: string }
    }
    if (json.error) {
      throw new Error(json.error.message)
    }
  })

function formatBuiltAt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function StatusBadge({ status }: { status: FeedStatus }) {
  if (status === 'ok') {
    return <span className={statusOkClass}>OK</span>
  }
  if (status === 'timeout') {
    return <span className={statusTimeoutClass}>Timeout</span>
  }
  return <span className={statusErrClass}>Error</span>
}

function SlotBadge({ slot }: { slot: string }) {
  return (
    <span className={slot === 'morning' ? slotBadgeMorningClass : slotBadgeAfternoonClass}>
      {slot === 'morning' ? 'Morning' : 'Afternoon'}
    </span>
  )
}

function SlotStatusCard({ slotData }: { slotData: SlotStatusData }) {
  const feedEntries = slotData.feedStats ? Object.entries(slotData.feedStats) : []
  const okCount = feedEntries.filter(([, s]) => s === 'ok').length
  const failCount = feedEntries.length - okCount

  return (
    <div>
      <div className={metaGridClass}>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Date</div>
          <div className={metaValueClass}>{slotData.date}</div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Built at (UTC)</div>
          <div className={cx(metaValueClass, metaValueSmClass)}>
            {formatBuiltAt(slotData.builtAt)}
          </div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Stories</div>
          <div className={metaValueClass}>{slotData.storyCount}</div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Feeds OK / Total</div>
          <div className={cx(metaValueClass, failCount > 0 ? metaValueWarnClass : undefined)}>
            {slotData.feedStats ? `${okCount} / ${feedEntries.length}` : '—'}
          </div>
        </div>
      </div>

      <h2 className={sectionHeadingClass}>Categories</h2>
      <div className={categoryGridClass}>
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className={categoryCardClass}>
            <div className={metaLabelClass} style={{ color: CATEGORY_CSS_VAR[cat] }}>
              {CATEGORY_LABEL[cat]}
            </div>
            <div className={metaValueClass}>{slotData.categoryBreakdown[cat] ?? 0}</div>
          </div>
        ))}
      </div>

      {feedEntries.length > 0 && (
        <>
          <h2 className={cx(sectionHeadingClass, sectionMtClass)}>Feed Status</h2>
          <table className={cx(tableClass, tableMbClass)}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>
                  Feed URL
                </th>
                <th scope="col" className={cx(thClass, thNarrowClass)}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {feedEntries.map(([url, status]) => (
                <tr key={url}>
                  <td className={tdClass}>{url}</td>
                  <td className={tdClass}>
                    <StatusBadge status={status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function AdminStatus({ secret }: { secret: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminStatus', hashSecret(secret)],
    queryFn: () => adminStatusServerFn({ data: { password: secret } }),
    retry: false,
  })

  const { data: editions } = useQuery({
    queryKey: ['editionList'],
    queryFn: editionListServerFn,
  })

  const [buildSlot, setBuildSlot] = useState<Slot>('morning')

  const buildMutation = useMutation<void, Error, { slot: Slot }>({
    mutationFn: ({ slot }) => triggerBuildServerFn({ data: { password: secret, slot } }),
    onSuccess: () => {
      void refetch()
      queryClient.invalidateQueries({ queryKey: ['editionList'] })
    },
  })

  if (isLoading) {
    return (
      <p className={css({ fontFamily: 'body', color: 'textMuted', fontStyle: 'italic' })}>
        Loading…
      </p>
    )
  }

  if (error) {
    const err = error as Error & { code?: string }
    return (
      <p className={errorClass}>
        {err.code === 'UNAUTHORIZED' ? 'Incorrect admin secret.' : `Error: ${error.message}`}
      </p>
    )
  }

  return (
    <div>
      {!data || data.length === 0 ? (
        <p className={css({ fontFamily: 'body', color: 'textMuted', marginBottom: '10' })}>
          No editions built yet.
        </p>
      ) : (
        <>
          <h2 className={sectionHeadingClass}>Last Build</h2>
          {data.map((slotData) => (
            <div key={slotData.slot}>
              <p className={slotHeadingClass}>
                {slotData.slot === 'morning' ? 'Morning Edition' : 'Afternoon Edition'}
              </p>
              <SlotStatusCard slotData={slotData} />
            </div>
          ))}
        </>
      )}

      <h2 className={cx(sectionHeadingClass, sectionMtClass)}>Build Edition</h2>
      <div className={slotSelectorClass}>
        {(['morning', 'afternoon'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`${slotPillBase} ${buildSlot === s ? slotPillActiveClass : slotPillInactiveClass}`}
            onClick={() => setBuildSlot(s)}
            aria-pressed={buildSlot === s}
          >
            {s === 'morning' ? 'Morning' : 'Afternoon'}
          </button>
        ))}
      </div>
      <div className={actionRowClass}>
        <button
          type="button"
          className={buttonClass}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => buildMutation.mutate({ slot: buildSlot })}
          disabled={buildMutation.isPending}
        >
          {buildMutation.isPending
            ? 'Building…'
            : `Build ${buildSlot === 'morning' ? 'Morning' : 'Afternoon'} Edition`}
        </button>
        {buildMutation.isSuccess && (
          <span className={css({ fontFamily: 'display', fontSize: '0.8rem', color: 'science' })}>
            Build triggered.
          </span>
        )}
        {buildMutation.isError && (
          <span className={css({ fontFamily: 'display', fontSize: '0.8rem', color: 'world' })}>
            Build failed: {(buildMutation.error as Error).message}
          </span>
        )}
      </div>

      {editions && editions.length > 0 && (
        <>
          <h2 className={cx(sectionHeadingClass, sectionMtClass)}>Edition History</h2>
          <table className={tableClass}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>
                  Date
                </th>
                <th scope="col" className={cx(thClass, thNarrowClass)}>
                  Slot
                </th>
                <th scope="col" className={cx(thClass, thMediumClass)}>
                  Stories
                </th>
                <th scope="col" className={cx(thClass, thTinyClass)} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {editions.map((ed) => (
                <tr key={`${ed.date}-${ed.slot}`}>
                  <td className={tdClass}>{ed.date}</td>
                  <td className={tdClass}>
                    <SlotBadge slot={ed.slot} />
                  </td>
                  <td className={tdClass}>{ed.storyCount}</td>
                  <td className={tdClass}>
                    <a
                      href={`/edition/${ed.date}?slot=${ed.slot}`}
                      className={linkClass}
                      aria-label={`View ${ed.slot} edition for ${ed.date}`}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function AdminPage() {
  const [inputSecret, setInputSecret] = useState('')
  const [submittedSecret, setSubmittedSecret] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inputSecret.trim()) {
      setSubmittedSecret(inputSecret.trim())
    }
  }

  return (
    <div className={pageClass}>
      <PageHeader />
      <main className={mainClass}>
        <h1 className={pageTitleClass}>Admin</h1>

        <form onSubmit={handleSubmit} className={formClass}>
          <input
            type="password"
            placeholder="Admin secret"
            aria-label="Admin secret"
            value={inputSecret}
            onChange={(e) => setInputSecret(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
          <button type="submit" className={buttonClass}>
            View Status
          </button>
        </form>

        {submittedSecret && <AdminStatus key={submittedSecret} secret={submittedSecret} />}
      </main>
      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
  component: AdminPage,
})
