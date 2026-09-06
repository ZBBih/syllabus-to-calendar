const SEASON_YEAR = /\b(fall|spring|summer|winter|autumn|[fswu]a?)\s?'?(19|20)?\d{2}\b/gi
const NOISE =
  /\b(syllabus|syllabi|course|outline|schedule|fall|spring|summer|winter|autumn|semester|term|final|draft|copy|v\d+)\b/gi
const YEAR = /\b(19|20)\d{2}(-(19|20)?\d{2})?\b/g
const COPY = /\(\d+\)/g

/** Best-effort class name from a syllabus file name. Returns '' when nothing useful remains. */
export function nameFromFileName(fileName: string): string {
  let s = fileName.replace(/\.[a-z0-9]+$/i, '')
  s = s.replace(COPY, ' ')
  s = s.replace(/[_\-.]+/g, ' ')
  s = s.replace(SEASON_YEAR, ' ')
  s = s.replace(NOISE, ' ')
  s = s.replace(YEAR, ' ')
  return s.replace(/\s+/g, ' ').trim()
}
