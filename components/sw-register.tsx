'use client'

import { useEffect } from 'react'

export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    // Another app's web view can expose the property and still hand back nothing; the guard is
    // shaped so the production minifier keeps it (see the offline effect in app/page.tsx).
    const sw = navigator.serviceWorker
    if (typeof sw !== 'object' || sw === null) return
    sw.register('/sw.js').catch(() => {})
  }, [])
  return null
}
