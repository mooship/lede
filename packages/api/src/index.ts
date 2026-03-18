export type Category = 'World / Politics' | 'Technology' | 'Science' | 'Business / Economy'

export type Story = {
  id: string
  title: string
  description: string | null
  summary: string
  category: Category
  link: string
  pubDate: string | null
  source: string
  position: number
}
