import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FilterStatus } from './FilterStatus.tsx'

afterEach(cleanup)

describe('FilterStatus (S3)', () => {
  // S3: "When there are tasks but none match, show \"No tasks match.\"."
  it('renders exactly "No tasks match."', () => {
    render(<FilterStatus />)
    expect(screen.getByText('No tasks match.')).toBeTruthy()
    expect(screen.getByText('No tasks match.').textContent).toBe('No tasks match.')
  })
})
