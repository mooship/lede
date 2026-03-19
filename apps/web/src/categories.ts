import type { Category } from '@lede/api'

export const CATEGORY_CSS_VAR: Record<Category, string> = {
  World: 'var(--colors-world)',
  Technology: 'var(--colors-tech)',
  Science: 'var(--colors-science)',
  'Business / Economy': 'var(--colors-business)',
  Sport: 'var(--colors-sport)',
}

export const CATEGORY_LABEL: Record<Category, string> = {
  World: 'World',
  Technology: 'Tech',
  Science: 'Science',
  'Business / Economy': 'Business',
  Sport: 'Sport',
}
