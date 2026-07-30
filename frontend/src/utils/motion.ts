export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const getScrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')
