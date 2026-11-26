import styles from './App.module.css'
import { useTheme } from '../shared/hooks/useTheme.ts'
import { TaskForm } from '../features/todo/TaskForm.tsx'
import { TaskList } from '../features/todo/TaskList.tsx'
import { useTasks } from '../features/todo/useTasks.ts'
import { BackupControls } from '../features/backup/BackupControls.tsx'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { tasks, addTask, toggleTask, removeTask, replaceTasks } = useTasks()
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
      <TaskList tasks={tasks} onToggle={toggleTask} onRemove={removeTask} />
      <BackupControls tasks={tasks} onReplace={replaceTasks} />
    </div>
  )
}
