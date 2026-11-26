import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('placeholder screen', () => {
  it('shows a single heading with the text "odd-todo-app"', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('odd-todo-app')
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })
})
