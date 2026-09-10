import type { NextConfig } from 'next'
import { buildStamp } from './lib/site'

// Resolved once, when the build runs, so the footer can say which build is on screen. Set on the
// environment rather than through the `env` config key: that key is marked legacy, and the docs
// are explicit that the NEXT_PUBLIC_ prefix only takes effect for variables that arrive this way.
process.env.NEXT_PUBLIC_BUILD_STAMP ??= buildStamp(process.env.VERCEL_GIT_COMMIT_SHA)

const csp = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' is what lets the on-device text recogniser instantiate its WebAssembly
  // core. It permits WebAssembly compilation only, not eval of JavaScript, so the page still
  // cannot run injected script.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
