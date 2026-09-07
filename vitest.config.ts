import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      // The app bundles mammoth's browser build, whose unzip takes an arrayBuffer; the node
      // build takes a path or a buffer instead. Tests read the file the browser reads.
      mammoth: path.resolve(__dirname, 'node_modules/mammoth/mammoth.browser.js'),
    },
  },
  test: {
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx', 'app/**/*.test.tsx'],
    environment: 'node',
  },
})
