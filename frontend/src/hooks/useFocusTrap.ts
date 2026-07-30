import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type UseFocusTrapOptions = {
  isOpen: boolean
  containerRef: RefObject<HTMLElement | null>
  triggerRef?: RefObject<HTMLElement | null>
  onClose: () => void
  lockScroll?: boolean
}

export function useFocusTrap({
  isOpen,
  containerRef,
  triggerRef,
  onClose,
  lockScroll = true,
}: UseFocusTrapOptions) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const container = containerRef.current
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const restoreTarget = triggerRef?.current ?? previouslyFocused

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    if (lockScroll) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    const getFocusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )

    const frame = window.requestAnimationFrame(() => {
      getFocusables()[0]?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusables = getFocusables()
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)

      if (lockScroll) {
        document.body.style.overflow = previousBodyOverflow
        document.documentElement.style.overflow = previousHtmlOverflow
      }

      if (restoreTarget && restoreTarget !== document.body) {
        restoreTarget.focus()
      }
    }
  }, [containerRef, isOpen, lockScroll, onClose, triggerRef])
}
