import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname),
      // The app bundles mammoth's browser build, whose unzip takes an arrayBuffer; the node
      // build takes a path or a buffer instead. Tests read the file the browser reads.
      mammoth: path.resolve(import.meta.dirname, 'node_modules/mammoth/mammoth.browser.js'),
    },
  },
  // The root error page imports the stylesheet so it can wear the app's own classes. Nothing a
  // test checks is a colour, and loading Tailwind's PostCSS plugin for it is what breaks.
  css: { postcss: {} },
  test: {
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx', 'app/**/*.test.tsx'],
    environment: 'node',
  },
})
