import React, { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

export default function SplineScene(){
  return (
    <div style={{position:'fixed', inset:0, zIndex:9999, pointerEvents:'none'}}>
      <Suspense fallback={null}>
        <Spline
          scene="https://prod.spline.design/lwKTkqImR7gq5XBz/scene.splinecode"
          style={{width:'100%', height:'100%', pointerEvents:'auto'}}
          width={1920}
          height={1080}
        />
      </Suspense>
    </div>
  )
}
