import React from 'react'
import SplineScene from './components/SplineScene'

export default function App(){
  return (
    <>
      <SplineScene />
      <div style={{padding:32}}>
        <h1>Test page</h1>
        <p>Scroll and interact with the page — Spline overlay will appear over the viewport.</p>
        <p>Close this window to return.</p>
        <div style={{height:2000}} />
      </div>
    </>
  )
}
