import styles from './App.module.css'
import { useTheme } from '../shared/hooks/useTheme.ts'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>odd-todo-app</h1>
      <button
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      </button>
    </div>
  )
}
