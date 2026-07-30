import { useTheme } from '@/store/ThemeContext'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-pressed={isDark}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
        {isDark ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </g>
        ) : (
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
            fill="currentColor"
            stroke="none"
          />
        )}
      </svg>
    </button>
  )
}
