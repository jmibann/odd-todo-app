import { useRef, useState, type FormEvent } from 'react'
import styles from './TaskForm.module.css'
import { isTaskTextEmpty, isTaskTextTooLong } from '../../shared/taskText.ts'

/**
 * Add-task form (odd/tasks/todo-core.md S1). All user-facing strings are
 * the user's own words, verbatim.
 */
export function TaskForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isTaskTextEmpty(value)) {
      setError('Write a task first.')
      return
    }
    if (isTaskTextTooLong(value)) {
      setError('Keep it to 120 characters or fewer.')
      return
    }
    const text = value.trim()
    onAdd(text)
    setValue('')
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label} htmlFor="new-task">
        New task
      </label>
      <div className={styles.row}>
        <input
          ref={inputRef}
          id="new-task"
          className={styles.input}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" className={styles.add}>
          Add
        </button>
      </div>
      {error !== null && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  )
}
