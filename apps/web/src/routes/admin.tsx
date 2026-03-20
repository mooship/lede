import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { Category } from '@tidel/api'
import { useState } from 'react'
import { css } from '../../styled-system/css'
import { CATEGORY_CSS_VAR, CATEGORY_LABEL } from '../categories.js'
import { Footer } from '../components/Footer.js'
import { Modal } from '../components/Modal.js'
import { PageHeader } from '../components/PageHeader.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
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
})

type FeedStatus = 'ok' | 'timeout' | 'error'

type AdminStatusData = {
  date: string
  builtAt: string
  storyCount: number
  feedStats: Record<string, FeedStatus> | null
  categoryBreakdown: Record<string, number>
} | null

const CATEGORY_ORDER: Category[] = ['World', 'Technology', 'Science', 'Business / Economy', 'Sport']

async function fetchAdminStatus(secret: string): Promise<AdminStatusData> {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
  const res = await fetch(`${apiUrl}/trpc/edition.adminStatus`, {
    headers: { Authorization: `Bearer ${secret}` },
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
}

async function fetchEditionList(): Promise<Array<{ date: string; storyCount: number }>> {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
  const res = await fetch(`${apiUrl}/trpc/edition.list`)
  const json = (await res.json()) as {
    result?: { data?: Array<{ date: string; storyCount: number }> }
  }
  return json.result?.data ?? []
}

async function triggerBuild(secret: string, force = false): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
  const res = await fetch(`${apiUrl}/trpc/edition.build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ force }),
  })
  const json = (await res.json()) as {
    result?: { data?: { ok: boolean } }
    error?: { message: string }
  }
  if (json.error) {
    throw new Error(json.error.message)
  }
}

function formatBuiltAt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
    timeZoneName: 'short',
  })
}

function StatusBadge({ status }: { status: FeedStatus }) {
  if (status === 'ok') return <span className={statusOkClass}>OK</span>
  if (status === 'timeout') return <span className={statusTimeoutClass}>Timeout</span>
  return <span className={statusErrClass}>Error</span>
}

function AdminStatus({ secret }: { secret: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminStatus', secret],
    queryFn: () => fetchAdminStatus(secret),
    retry: false,
  })

  const { data: editions } = useQuery({
    queryKey: ['editionList'],
    queryFn: fetchEditionList,
  })

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const buildMutation = useMutation<void, Error, boolean>({
    mutationFn: (force: boolean) => triggerBuild(secret, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStatus', secret] })
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

  if (!data) {
    return <p className={css({ fontFamily: 'body', color: 'textMuted' })}>No editions built yet.</p>
  }

  const feedEntries = data.feedStats ? Object.entries(data.feedStats) : []
  const okCount = feedEntries.filter(([, s]) => s === 'ok').length
  const failCount = feedEntries.length - okCount

  return (
    <div>
      <h2 className={sectionHeadingClass}>Last Build</h2>
      <div className={metaGridClass}>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Date</div>
          <div className={metaValueClass}>{data.date}</div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Built at (SAST)</div>
          <div className={metaValueClass} style={{ fontSize: '0.9rem' }}>
            {formatBuiltAt(data.builtAt)}
          </div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Stories</div>
          <div className={metaValueClass}>{data.storyCount}</div>
        </div>
        <div className={metaCardClass}>
          <div className={metaLabelClass}>Feeds OK / Total</div>
          <div
            className={metaValueClass}
            style={{ color: failCount > 0 ? 'var(--colors-business)' : undefined }}
          >
            {data.feedStats ? `${okCount} / ${feedEntries.length}` : '—'}
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
            <div className={metaValueClass}>{data.categoryBreakdown[cat] ?? 0}</div>
          </div>
        ))}
      </div>

      {showConfirmModal && (
        <Modal
          title="Replace today's edition?"
          message="This will delete all current articles and rebuild from scratch."
          confirmLabel="Rebuild"
          onConfirm={() => {
            setShowConfirmModal(false)
            buildMutation.mutate(true)
          }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

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
          onClick={() => {
            if (data) {
              setShowConfirmModal(true)
            } else {
              buildMutation.mutate(false)
            }
          }}
          disabled={buildMutation.isPending}
        >
          {buildMutation.isPending ? 'Building…' : "Build Today's Edition"}
        </button>
        {data && !buildMutation.isPending && !buildMutation.isSuccess && (
          <span className={css({ fontFamily: 'display', fontSize: '0.8rem', color: 'business' })}>
            Warning: today&apos;s edition exists — clicking will replace all articles.
          </span>
        )}
        {buildMutation.isSuccess && (
          <span className={css({ fontFamily: 'display', fontSize: '0.8rem', color: 'science' })}>
            Build complete.
          </span>
        )}
        {buildMutation.isError && (
          <span className={css({ fontFamily: 'display', fontSize: '0.8rem', color: 'world' })}>
            Build failed: {(buildMutation.error as Error).message}
          </span>
        )}
      </div>

      {feedEntries.length > 0 && (
        <>
          <h2 className={sectionHeadingClass} style={{ marginTop: '8px' }}>
            Feed Status
          </h2>
          <table className={tableClass} style={{ marginBottom: '10px' }}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>
                  Feed URL
                </th>
                <th scope="col" className={thClass} style={{ width: '100px' }}>
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

      {editions && editions.length > 0 && (
        <>
          <h2 className={sectionHeadingClass} style={{ marginTop: '8px' }}>
            Edition History
          </h2>
          <table className={tableClass}>
            <thead>
              <tr>
                <th scope="col" className={thClass}>
                  Date
                </th>
                <th scope="col" className={thClass} style={{ width: '120px' }}>
                  Stories
                </th>
                <th
                  scope="col"
                  className={thClass}
                  style={{ width: '80px' }}
                  aria-label="Actions"
                />
              </tr>
            </thead>
            <tbody>
              {editions.map((ed) => (
                <tr key={ed.date}>
                  <td className={tdClass}>{ed.date}</td>
                  <td className={tdClass}>{ed.storyCount}</td>
                  <td className={tdClass}>
                    <a
                      href={`/edition/${ed.date}`}
                      className={linkClass}
                      aria-label={`View edition for ${ed.date}`}
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
  component: AdminPage,
})
