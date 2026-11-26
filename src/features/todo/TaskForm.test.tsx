import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskForm } from './TaskForm.tsx'

function setup() {
  const onAdd = vi.fn()
  render(<TaskForm onAdd={onAdd} />)
  const input = screen.getByRole('textbox', { name: 'New task' })
  return { onAdd, input }
}

const pressEnter = () => {
  // jsdom does not translate an Enter keydown into implicit form submission;
  // requestSubmit() dispatches the same submit event the browser fires.
  const form = screen.getByRole('textbox', { name: 'New task' }).closest('form')
  expect(form).toBeTruthy()
  ;(form as HTMLFormElement).requestSubmit()
}

beforeEach(() => window.localStorage.clear())
afterEach(cleanup)

describe('TaskForm (S1)', () => {
  it('renders a labeled input and an Add button', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })

  it('adds trimmed text on click, clears the input and keeps focus', () => {
    const { onAdd, input } = setup()
    fireEvent.change(input, { target: { value: '  Buy milk  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('Buy milk')
    expect((input as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(input)
  })

  it('adds on Enter in the input', () => {
    const { onAdd, input } = setup()
    fireEvent.change(input, { target: { value: 'Pay rent' } })
    pressEnter()
    expect(onAdd).toHaveBeenCalledWith('Pay rent')
  })

  it('shows "Write a task first." for empty or whitespace-only input', () => {
    const { onAdd, input } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('Write a task first.')

    fireEvent.change(input, { target: { value: '   \t ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('Write a task first.')
  })

  it('rejects 121 characters after trimming with the limit message', () => {
    const { onAdd, input } = setup()
    fireEvent.change(input, { target: { value: ` ${'x'.repeat(121)} ` } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      'Keep it to 120 characters or fewer.',
    )
  })

  it('accepts exactly 120 characters', () => {
    const { onAdd, input } = setup()
    fireEvent.change(input, { target: { value: 'x'.repeat(120) } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith('x'.repeat(120))
  })

  it('clears a visible error after a successful add', () => {
    const { input } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert').textContent).toBe('Write a task first.')
    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('allows duplicate texts', () => {
    const { onAdd, input } = setup()
    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledTimes(2)
  })
})
