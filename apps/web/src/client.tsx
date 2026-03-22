import '@fontsource-variable/syne'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource/opendyslexic/400.css'
import './index.css'

import { StartClient } from '@tanstack/react-start/client'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
)
