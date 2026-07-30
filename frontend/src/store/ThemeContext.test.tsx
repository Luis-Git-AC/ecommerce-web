import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './ThemeContext'

type MediaListener = (event: MediaQueryListEvent) => void

let systemPrefersDark = false
let listeners: MediaListener[] = []

const mockMatchMedia = () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-color-scheme: dark') ? systemPrefersDark : false,
      media: query,
      addEventListener: (_event: string, listener: MediaListener) => listeners.push(listener),
      removeEventListener: (_event: string, listener: MediaListener) => {
        listeners = listeners.filter((item) => item !== listener)
      },
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    })),
  )
}

function Probe() {
  const { theme, preference, toggleTheme, setPreference } = useTheme()

  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <p data-testid="preference">{preference}</p>
      <button type="button" onClick={toggleTheme}>
        Alternar
      </button>
      <button type="button" onClick={() => setPreference('system')}>
        Seguir al sistema
      </button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )

describe('ThemeContext', () => {
  beforeEach(() => {
    listeners = []
    systemPrefersDark = false
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockMatchMedia()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sigue la preferencia del sistema cuando no hay eleccion guardada', () => {
    systemPrefersDark = true
    renderProbe()

    expect(screen.getByTestId('preference')).toHaveTextContent('system')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('respeta la eleccion manual por encima del sistema', () => {
    systemPrefersDark = true
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderProbe()

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('alterna el tema y lo persiste', async () => {
    const user = userEvent.setup()
    renderProbe()

    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    await user.click(screen.getByRole('button', { name: 'Alternar' }))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('reacciona a los cambios del sistema cuando la preferencia es "system"', () => {
    renderProbe()
    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    act(() => {
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('ignora un valor corrupto en localStorage', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'arcoiris')
    renderProbe()

    expect(screen.getByTestId('preference')).toHaveTextContent('system')
  })
})
