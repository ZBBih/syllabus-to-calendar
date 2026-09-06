import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Syllabify',
    short_name: 'Syllabify',
    description: 'Drop your syllabi, get every deadline on your calendar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f4ef',
    theme_color: '#f59e0b',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
