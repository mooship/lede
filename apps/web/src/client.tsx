import '@fontsource-variable/syne'
import '@fontsource/instrument-serif'
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
