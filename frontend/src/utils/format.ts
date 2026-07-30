const LOCALE = 'es-ES'

export const formatMoney = (value: number, currency: string, fractionDigits = 0) => {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  } catch {
    return `${value} ${currency || 'EUR'}`
  }
}

export const formatDate = (value: string | Date) => {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export const formatDateShort = (value: string | Date) => {
  try {
    return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return String(value)
  }
}
