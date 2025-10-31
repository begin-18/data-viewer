import React from 'react'
import { createRoot } from 'react-dom/client'
import SheetViewerMultiPaginated from './SheetViewerMultiPaginated'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SheetViewerMultiPaginated />
  </React.StrictMode>
)
