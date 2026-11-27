import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TaskFilters } from './TaskFilters.tsx'
import type { StatusFilter } from './filterTasks.ts'

type Props = {
  q: string
  status: StatusFilter
  onQChange: (q: string) => void
  onStatusChange: (status: StatusFilter) => void
}

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    q: '',
    status: 'all',
    onQChange: vi.fn(),
    onStatusChange: vi.fn(),
    ...overrides,
  }
  render(<TaskFilters {...props} />)
  return props
}

afterEach(cleanup)

describe('TaskFilters', () => {
  // S1 (odd/tasks/filter-search.md): "A search input labeled \"Search tasks\"."
  it('renders a search input labeled "Search tasks" and reports its edits verbatim', () => {
    const { onQChange } = setup()
    const input = screen.getByRole('textbox', { name: 'Search tasks' })
    fireEvent.change(input, { target: { value: '  Buy milk  ' } })
    expect(onQChange).toHaveBeenCalledWith('  Buy milk  ')
  })

  // S2: "A status choice labeled \"Show\" with the options \"All\", \"Active\"
  // and \"Completed\". \"All\" is the default."
  it('renders a "Show" select with All/Active/Completed and reports the choice', () => {
    const { onStatusChange } = setup()
    const select = screen.getByRole('combobox', { name: 'Show' })
    expect(
      screen
        .getAllByRole('option')
        .map((option) => [option.textContent, (option as HTMLOptionElement).value]),
    ).toEqual([
      ['All', 'all'],
      ['Active', 'active'],
      ['Completed', 'completed'],
    ])
    fireEvent.change(select, { target: { value: 'completed' } })
    expect(onStatusChange).toHaveBeenCalledWith('completed')
  })

  it('keeps the input as a textbox without a form (search-as-you-type)', () => {
    setup({ q: 'milk', status: 'active' })
    expect(
      (screen.getByRole('textbox', { name: 'Search tasks' }) as HTMLInputElement)
        .value,
    ).toBe('milk')
    expect(
      (screen.getByRole('combobox', { name: 'Show' }) as HTMLSelectElement).value,
    ).toBe('active')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
