import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackupControls } from './BackupControls.tsx'
import { BACKUP_FORMAT } from './backupFormat.ts'
import type { Task } from '../todo/useTasks.ts'

const tasks: Task[] = [
  { id: 'b', text: 'Pay rent', completed: true },
  { id: 'a', text: 'Buy milk', completed: false },
]

function validFile(tasksJson: unknown): File {
  return new File(
    [
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: '2026-11-26T12:00:00.000Z',
        tasks: tasksJson,
      }),
    ],
    'backup.json',
    { type: 'application/json' },
  )
}

function setup() {
  const onReplace = vi.fn()
  const { container } = render(
    <BackupControls tasks={tasks} onReplace={onReplace} />,
  )
  const fileInput = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement
  return { onReplace, fileInput }
}

async function pickFile(input: HTMLInputElement, file: File) {
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } })
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('BackupControls export (S1)', () => {
  it('renders both controls with their exact names', () => {
    const { fileInput } = setup()
    expect(fileInput.accept).toContain('.json')
    expect(screen.getByRole('button', { name: 'Export tasks' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Import tasks' }),
    ).toBeTruthy()
    expect(
      document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement,
    ).toBeTruthy()
  })

  it('downloads a dated file containing the contract payload (order + completed)', async () => {
    setup()
    const blobs: Blob[] = []
    const anchors: HTMLAnchorElement[] = []
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:stub'
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function click(this: HTMLAnchorElement) {
        anchors.push(this)
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Export tasks' }))
    expect(blobs).toHaveLength(1)
    const payload = JSON.parse(await (blobs[0] as Blob).text())
    expect(payload.format).toBe(BACKUP_FORMAT)
    expect(payload.version).toBe(1)
    expect(payload.tasks).toEqual(tasks)
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    expect(anchors[0]?.download).toBe(
      `odd-todo-backup-${today.getFullYear()}-${pad(
        today.getMonth() + 1,
      )}-${pad(today.getDate())}.json`,
    )
  })

  it('exports an empty list too', async () => {
    const onReplace = vi.fn()
    render(<BackupControls tasks={[]} onReplace={onReplace} />)
    const blobs: Blob[] = []
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:stub'
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Export tasks' }))
    const payload = JSON.parse(await (blobs[0] as Blob).text())
    expect(payload.tasks).toEqual([])
  })
})

describe('BackupControls import (S2, S3)', () => {
  it('valid file shows the exact confirmation with counts', async () => {
    const { fileInput } = setup()
    await pickFile(fileInput, validFile([{ id: 'z', text: 'New', completed: false }]))
    expect(
      screen.getByText('Replace current tasks (2) with imported tasks (1)?'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Replace' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('Replace passes the parsed list (ids regenerated) and closes', async () => {
    const { onReplace, fileInput } = setup()
    await pickFile(fileInput, validFile([{ id: 'z', text: 'New', completed: false }]))
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
    expect(onReplace).toHaveBeenCalledTimes(1)
    const received = onReplace.mock.calls[0]?.[0] as Task[]
    expect(received).toHaveLength(1)
    expect(received[0]?.text).toBe('New')
    expect(received[0]?.id).not.toBe('z')
    expect(screen.queryByText(/^Replace current tasks/)).toBeNull()
  })

  it('Cancel changes nothing', async () => {
    const { onReplace, fileInput } = setup()
    await pickFile(fileInput, validFile([{ id: 'z', text: 'New', completed: false }]))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onReplace).not.toHaveBeenCalled()
    expect(screen.queryByText(/^Replace current tasks/)).toBeNull()
  })

  it('invalid file is rejected with the exact message, no confirmation', async () => {
    const { onReplace, fileInput } = setup()
    await pickFile(fileInput, new File(['{not json'], 'x.json'))
    expect(onReplace).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      "This file can't be imported.",
    )
    expect(screen.queryByText(/^Replace current tasks/)).toBeNull()
  })

  it('unknown version and oversized files are rejected identically', async () => {
    const { fileInput } = setup()
    await pickFile(
      fileInput,
      new File(
        [
          JSON.stringify({
            format: BACKUP_FORMAT,
            version: 99,
            exportedAt: '2026-11-26T12:00:00.000Z',
            tasks: [],
          }),
        ],
        'v99.json',
      ),
    )
    expect(screen.getByRole('alert').textContent).toBe(
      "This file can't be imported.",
    )
    const big = new File([' '.repeat(1024 * 1024 + 1)], 'big.json')
    await pickFile(fileInput, big)
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/^Replace current tasks/)).toBeNull()
  })

  it('a valid file clears a previous error', async () => {
    const { fileInput } = setup()
    await pickFile(fileInput, new File(['{bad'], 'x.json'))
    expect(screen.getByRole('alert')).toBeTruthy()
    await pickFile(fileInput, validFile([{ id: 'z', text: 'New', completed: false }]))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/^Replace current tasks/)).toBeTruthy()
  })
})
