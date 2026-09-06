/**
 * The three commissioned hero renders, kept side by side so they can be compared in place.
 *
 * All three share a composition: the syllabus on the left, dates in flight across the middle,
 * the calendar on the right. That is what lets one asset serve three different spots on the
 * site, by cropping to the left or right half rather than commissioning more art.
 */

export type ArtStyle = 'paper' | 'clay' | 'flat'

export type ArtVariant = {
  id: ArtStyle
  label: string
  note: string
  src: string
  /** Where the document and the calendar sit horizontally, for cropping to one or the other. */
  documentX: string
  calendarX: string
}

export const ART: Record<ArtStyle, ArtVariant> = {
  paper: {
    id: 'paper',
    label: 'Cut paper',
    note: 'Torn edges and real shadows. The most distinctive and the least likely to read as generated.',
    src: '/art/paper.png',
    documentX: '22%',
    calendarX: '82%',
  },
  clay: {
    id: 'clay',
    label: 'Soft 3D',
    note: 'Matte clay and studio light. The most produced of the three, and the closest to a current app landing page.',
    src: '/art/clay.png',
    documentX: '20%',
    calendarX: '84%',
  },
  flat: {
    id: 'flat',
    label: 'Flat vector',
    note: 'Plain shapes, no texture. Sits closest to the rest of the page and will date the slowest.',
    src: '/art/flat.png',
    documentX: '14%',
    calendarX: '86%',
  },
}

export const ART_ORDER: ArtStyle[] = ['paper', 'clay', 'flat']

/** The style the site uses until one is chosen for good. */
export const DEFAULT_ART: ArtStyle = 'paper'

export const ART_WIDTH = 1200
export const ART_HEIGHT = 896
export const ART_KEY = 'stc:art'

export function isArtStyle(v: unknown): v is ArtStyle {
  return v === 'paper' || v === 'clay' || v === 'flat'
}
