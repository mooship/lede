import type { Story } from '@elar/api'
import { Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { storyCard } from '../../styled-system/recipes'
import { CATEGORY_CSS_VAR, CATEGORY_LABEL } from '../categories.js'

type Props = { story: Story; position: number }

const linkClass = css({ textDecoration: 'none', display: 'block', height: '100%' })

const headerClass = css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })

const badgeClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '2px 8px',
  lineHeight: '1.6',
  border: '1px solid',
})

const positionClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  color: 'textMuted',
})

const titleClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
  color: 'textPrimary',
  lineHeight: '1.35',
  margin: '0',
})

const sourceClass = css({
  fontFamily: 'body',
  fontSize: '0.8rem',
  color: 'textMuted',
  fontStyle: 'italic',
  marginTop: 'auto',
})

export function StoryCard({ story, position }: Props) {
  const accentVar = CATEGORY_CSS_VAR[story.category] ?? 'var(--colors-text-primary)'

  return (
    <Link to="/story/$id" params={{ id: story.id }} className={linkClass}>
      <article className={storyCard({ category: story.category })}>
        <div className={headerClass}>
          <span
            className={badgeClass}
            role="img"
            aria-label={`Category: ${CATEGORY_LABEL[story.category]}`}
            style={{
              color: accentVar,
              backgroundColor: `color-mix(in srgb, ${accentVar} 10%, transparent)`,
              borderColor: `color-mix(in srgb, ${accentVar} 30%, transparent)`,
            }}
          >
            {CATEGORY_LABEL[story.category]}
          </span>
          <span className={positionClass}>{String(position).padStart(2, '0')}</span>
        </div>

        <h2 className={titleClass}>{story.title}</h2>

        <p className={sourceClass}>{story.source}</p>
      </article>
    </Link>
  )
}
