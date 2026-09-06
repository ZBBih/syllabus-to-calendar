// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { FileDrop } from './file-drop'

afterEach(cleanup)

function drop(el: Element, files: File[]) {
  fireEvent.drop(el, { dataTransfer: { files } })
}

describe('FileDrop', () => {
  it('converts text files and reports each unsupported file without blocking the rest', async () => {
    const onFiles = vi.fn()
    render(<FileDrop multiple onFiles={onFiles} />)
    const zone = screen.getByRole('button')
    drop(zone, [new File(['Sept 14: Quiz'], 'econ.txt', { type: 'text/plain' }), new File(['x'], 'photo.jpg', { type: 'image/jpeg' })])
    await waitFor(() => expect(onFiles).toHaveBeenCalled())
    expect(onFiles.mock.calls[0][0]).toEqual([{ fileName: 'econ.txt', text: 'Sept 14: Quiz' }])
    expect(screen.getByText(/photo\.jpg: unsupported file type/i)).toBeTruthy()
  })
  it('takes only the first file when not multiple', async () => {
    const onFiles = vi.fn()
    render(<FileDrop onFiles={onFiles} />)
    drop(screen.getByRole('button'), [new File(['a'], 'a.txt', { type: 'text/plain' }), new File(['b'], 'b.txt', { type: 'text/plain' })])
    await waitFor(() => expect(onFiles).toHaveBeenCalled())
    expect(onFiles.mock.calls[0][0]).toHaveLength(1)
  })
})
