import React from 'react'
import { createRoot } from 'react-dom/client'
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
  root.render(<SplineScene />)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
