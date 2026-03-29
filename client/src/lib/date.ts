const DEFAULT_LOCALE = "de-DE"

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}

export function toValidDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatDate(
  value: string | Date,
  locale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string | null {
  const date = toValidDate(value)

  if (date === null) {
    return null
  }

  return date.toLocaleDateString(locale, options)
}
