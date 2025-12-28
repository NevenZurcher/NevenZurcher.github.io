import React, { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

export default function SplineScene() {
  return (
    <>
      <div className="spline-scroll-wrapper">
        <Suspense fallback={null}>
          <Spline
            scene="https://prod.spline.design/lwKTkqImR7gq5XBz/scene.splinecode"
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </div>
    </>
  )
}

