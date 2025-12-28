# Spline Vite App

Minimal Vite + React app demonstrating `@splinetool/react-spline` overlay.

Install and run:

```bash
cd spline-vite
npm install
npm run dev
```

Open http://localhost:5173

Notes:
- The component uses `pointerEvents: 'none'` on the wrapper so it doesn't block page interactions; the Spline itself allows interactions.
- Adjust `zIndex` or styling in `src/components/SplineScene.jsx` as needed.
