import React from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import SplineScene from './SplineScene'
import './styles.css'

function mount() {
  // Create a container at document root for the overlay
  let container = document.getElementById('spline-widget-root')
  if (!container) {
    container = document.createElement('div')
    container.id = 'spline-widget-root'
    document.body.appendChild(container)
  }

  const root = createRoot(container)
  root.render(
    <>
      <SplineScene />
      {!['localhost', '127.0.0.1'].includes(window.location.hostname) && <Analytics />}
    </>
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
