export type Category =
  | 'World'
  | 'Technology'
  | 'Science'
  | 'Business / Economy'
  | 'Sport'
  | 'Culture'

export type Slot = 'morning' | 'afternoon'

export type Story = {
  id: string
  editionDate: string
  editionSlot: string
  title: string
  description: string | null
  summary: string
  category: Category
  link: string
  pubDate: string | null
  source: string
  position: number
}
