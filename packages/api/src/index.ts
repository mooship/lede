export type Category = 'World' | 'Technology' | 'Science' | 'Business / Economy' | 'Sport'

export type Story = {
  id: string
  editionDate: string
  title: string
  description: string | null
  summary: string
  category: Category
  link: string
  pubDate: string | null
  source: string
  position: number
}
