import { useRef, useState, type ChangeEvent } from 'react'
import styles from './BackupControls.module.css'
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  parseBackup,
  serializeBackup,
} from './backupFormat.ts'
import type { Task } from '../todo/useTasks.ts'

type BackupControlsProps = {
  tasks: Task[]
  onReplace: (next: Task[]) => void
}

/**
 * Export/import UI (odd/tasks/backup.md S1–S3). The imported list replaces
 * the current one only after the user confirms; anything invalid is
 * rejected entirely and changes nothing. File content is rendered nowhere.
 */
export function BackupControls({ tasks, onReplace }: BackupControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportTasks = () => {
    const blob = new Blob([serializeBackup(tasks, new Date())], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = backupFileName(new Date())
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) {
      setPending(null)
      setError("This file can't be imported.")
      return
    }
    const parsed = parseBackup(await file.text())
    if (parsed === null) {
      setPending(null)
      setError("This file can't be imported.")
      return
    }
    setError(null)
    setPending(parsed)
  }

  const confirmReplace = () => {
    if (pending !== null) {
      onReplace(pending)
    }
    setPending(null)
  }

  return (
    <div className={styles.controls}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={exportTasks}
        >
          Export tasks
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => fileInputRef.current?.click()}
        >
          Import tasks
        </button>
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept=".json,application/json"
          aria-hidden="true"
          tabIndex={-1}
          onChange={onFileChange}
        />
      </div>
      {error !== null && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {pending !== null && (
        <div
          className={styles.confirm}
          role="alertdialog"
          aria-label="Import confirmation"
        >
          <p className={styles.confirmText}>
            {`Replace current tasks (${tasks.length}) with imported tasks (${pending.length})?`}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              onClick={confirmReplace}
            >
              Replace
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
