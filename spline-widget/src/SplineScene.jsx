import React from 'react'
import Spline from '@splinetool/react-spline'

export default function SplineScene() {
  return (
    <div className="spline-widget-overlay cube">
      <Spline
        scene="https://prod.spline.design/NHQad1vutWXl0SsM/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

