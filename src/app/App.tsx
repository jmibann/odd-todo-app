import styles from './App.module.css'
import { useTheme } from '../shared/hooks/useTheme.ts'
import { TaskForm } from '../features/todo/TaskForm.tsx'
import { useTasks } from '../features/todo/useTasks.ts'
import { BackupControls } from '../features/backup/BackupControls.tsx'
import { TaskFilter } from '../features/filter/TaskFilter.tsx'
import { captureDeleted } from '../features/undo/deletedTask.ts'
import { useUndoDelete } from '../features/undo/useUndoDelete.ts'
import { UndoDelete } from '../features/undo/UndoDelete.tsx'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { tasks, addTask, toggleTask, removeTask, replaceTasks, restoreTask } =
    useTasks()
  const { pending, reportDeleted, undo } = useUndoDelete(restoreTask)

  // Undo for delete (undo-delete.md S6–S9): capture the removed task's
  // original index BEFORE deleting; the deletion persists immediately and
  // the undo state lives only in memory.
  const handleRemove = (id: string) => {
    const deleted = captureDeleted(tasks, id)
    removeTask(id)
    if (deleted !== null) {
      reportDeleted(deleted)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>odd-todo-app</h1>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        </button>
      </header>
      <TaskForm onAdd={addTask} />
      <TaskFilter tasks={tasks} onToggle={toggleTask} onRemove={handleRemove} />
      <BackupControls tasks={tasks} onReplace={replaceTasks} />
      <UndoDelete pending={pending} onUndo={undo} />
    </div>
  )
}
