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
  //
  // 'unsafe-inline' is deliberate, and it is here in production rather than only in development.
  // Two inline scripts are unavoidable: the App Router writes its own hydration payload inline
  // on every response, and `app/layout.tsx` runs a small script in the head to set the theme
  // before the first paint, which is the only way to avoid a flash of the wrong one. The way to
  // drop the directive is a per-request nonce, and a nonce needs middleware — which makes every
  // response dynamic and costs the fully static build and the offline shell that depends on it.
  // That is a worse trade for a page with no server, no accounts and no third-party script: the
  // stored-content sinks are all React text nodes, `connect-src 'self'` blocks exfiltration, and
  // nothing on this origin is fetched from anywhere else. Revisit if a nonce ever becomes free.
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
