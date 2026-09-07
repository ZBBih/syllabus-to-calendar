const SEASON_YEAR = /\b(fall|spring|summer|winter|autumn|[fswu]a?)\s?'?(19|20)?\d{2}\b/gi
const NOISE =
  /\b(syllabus|syllabi|course|outline|schedule|fall|spring|summer|winter|autumn|semester|term|final|draft|copy|v\d+)\b/gi
const YEAR = /\b(19|20)\d{2}(-(19|20)?\d{2})?\b/g
const COPY = /\(\d+\)/g

// A department code is written in capitals everywhere else a student sees it, so a file called
// biol-210-syllabus.docx should not seed a class called "biol 210".
const COURSE_CODE = /^([A-Za-z]{2,6})\s?(\d{2,4}[A-Za-z]?)$/

function tidyCode(s: string): string {
  const m = COURSE_CODE.exec(s)
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : s
}

/**
 * What a camera, a scanner or a screenshot calls a file.
 *
 * "IMG 4821" is the same shape as "CHEM 120" and no regex can tell them apart, so the handful
 * of prefixes that are never a department are named outright.
 */
const NOT_A_DEPARTMENT = /^(img|dsc|dscn|pxl|pic|photo|image|scan|shot|doc|file|new)$/i

/** Whether a name is a department code and number, the shape a student would recognise. */
export function looksLikeCode(name: string): boolean {
  const m = COURSE_CODE.exec(name.trim())
  return m !== null && !NOT_A_DEPARTMENT.test(m[1])
}

/** Best-effort class name from a syllabus file name. Returns '' when nothing useful remains. */
export function nameFromFileName(fileName: string): string {
  let s = fileName.replace(/\.[a-z0-9]+$/i, '')
  s = s.replace(COPY, ' ')
  s = s.replace(/[_\-.]+/g, ' ')
  s = s.replace(SEASON_YEAR, ' ')
  s = s.replace(NOISE, ' ')
  s = s.replace(YEAR, ' ')
  return tidyCode(s.replace(/\s+/g, ' ').trim())
}

/** Words that start a line but never start a course code. */
const NOT_A_CODE = /^(fall|autumn|spring|summer|winter|week|wk|unit|day|room|page|class|term|part|sect)$/i

const LINE_CODE = /^([A-Za-z]{2,6})\s?-?\s?(\d{2,4}[A-Za-z]?)\b/

/** How far into the document to look for a name. A syllabus heads with one or it has none. */
const HEAD_LINES = 12

/**
 * Best-effort class name from the syllabus text itself.
 *
 * The file-name guess comes back empty for pasted text and for anything called Syllabus.pdf,
 * and a class with dates cannot leave the first screen without a name, so that empty guess is
 * a typing gate on a phone keyboard once per class. The opening lines of a syllabus carry the
 * course code far more often than the file name does.
 */
export function nameFromText(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, HEAD_LINES)

  for (const line of lines) {
    const m = LINE_CODE.exec(line)
    if (m && !NOT_A_CODE.test(m[1])) return tidyCode(`${m[1]} ${m[2]}`)
  }

  for (const line of lines) {
    // A bare "Syllabus" or "Course Outline" heading is not a class name.
    if (!line.replace(NOISE, ' ').replace(/[^a-z]/gi, '')) continue
    const cleaned = line.replace(/\s+/g, ' ').replace(/^[\s\-–—:|•*]+|[\s\-–—:|•*]+$/g, '')
    if (cleaned.length >= 3 && cleaned.length <= 60) return cleaned
  }
  return ''
}
