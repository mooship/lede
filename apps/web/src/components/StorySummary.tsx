import type { Story } from '@lede/api'

async function shareStory(title: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, url })
  } else {
    await navigator.clipboard.writeText(url)
  }
}

type Props = { story: Story }

export function StorySummary({ story }: Props) {
  return (
    <div
      style={{
        borderTop: '1px solid #2e2e2e',
        marginTop: '0.75rem',
        paddingTop: '1rem',
      }}
    >
      <p
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: '0.95rem',
          color: '#d0d0d0',
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {story.summary}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          alignItems: 'center',
        }}
      >
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#555555',
            textDecoration: 'none',
          }}
        >
          {story.source} →
        </a>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void shareStory(story.title, story.link)
          }}
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#555555',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ↗ Share
        </button>
      </div>
    </div>
  )
}
