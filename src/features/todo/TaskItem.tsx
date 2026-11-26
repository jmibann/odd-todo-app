import styles from './TaskList.module.css'
import type { Task } from './useTasks.ts'

type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const checkboxId = `task-${task.id}`
  const className = task.completed
    ? `${styles.item} ${styles.completed}`
    : styles.item
  return (
    <li className={className}>
      <input
        id={checkboxId}
        className={styles.checkbox}
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <label htmlFor={checkboxId} className={styles.text}>
        {task.text}
      </label>
      <button
        type="button"
        className={styles.delete}
        aria-label={`Delete ${task.text}`}
        onClick={() => onRemove(task.id)}
      >
        Delete
      </button>
    </li>
  )
}
