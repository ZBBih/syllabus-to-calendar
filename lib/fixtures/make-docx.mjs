/**
 * Rebuilds lib/fixtures/syllabus.docx, the Word document the conversion test reads.
 *
 * Kept as a script rather than a checked-in binary nobody can inspect: run
 * `node lib/fixtures/make-docx.mjs` to regenerate it after changing the text below.
 */
import { writeFileSync } from 'node:fs'
import { deflateRawSync, crc32 } from 'node:zlib'

const PARAGRAPHS = [
  'BIOL 210: Genetics',
  'Spring 2027',
  'MWF 9:00-9:50 in Hume 12',
  'Grading',
  'Problem sets 30%',
  'Midterm 30%',
  'Final 40%',
  'Schedule',
  'Jan 20 / Jan 22 Lab safety quiz',
  'Feb 11 Problem set 1 due at 11:59pm',
  'Mar 8-12 Spring break, no class',
  'Apr 30 Final paper due',
]

const files = {
  '[Content_Types].xml':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>',
  '_rels/.rels':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>',
  'word/document.xml':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    PARAGRAPHS.map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`).join('') +
    '</w:body></w:document>',
}

const local = []
const central = []
let offset = 0
for (const [name, text] of Object.entries(files)) {
  const raw = Buffer.from(text, 'utf8')
  const data = deflateRawSync(raw)
  const sum = crc32(raw) >>> 0
  const nameBytes = Buffer.from(name, 'utf8')

  const head = Buffer.alloc(30)
  head.writeUInt32LE(0x04034b50, 0)
  head.writeUInt16LE(20, 4)
  head.writeUInt16LE(8, 8) // deflate
  head.writeUInt32LE(sum, 14)
  head.writeUInt32LE(data.length, 18)
  head.writeUInt32LE(raw.length, 22)
  head.writeUInt16LE(nameBytes.length, 26)
  local.push(head, nameBytes, data)

  const entry = Buffer.alloc(46)
  entry.writeUInt32LE(0x02014b50, 0)
  entry.writeUInt16LE(20, 4)
  entry.writeUInt16LE(20, 6)
  entry.writeUInt16LE(8, 10)
  entry.writeUInt32LE(sum, 16)
  entry.writeUInt32LE(data.length, 20)
  entry.writeUInt32LE(raw.length, 24)
  entry.writeUInt16LE(nameBytes.length, 28)
  entry.writeUInt32LE(offset, 42)
  central.push(entry, nameBytes)

  offset += head.length + nameBytes.length + data.length
}

const centralBuf = Buffer.concat(central)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(Object.keys(files).length, 8)
end.writeUInt16LE(Object.keys(files).length, 10)
end.writeUInt32LE(centralBuf.length, 12)
end.writeUInt32LE(offset, 16)

writeFileSync(new URL('./syllabus.docx', import.meta.url), Buffer.concat([...local, centralBuf, end]))
console.log('wrote lib/fixtures/syllabus.docx')
