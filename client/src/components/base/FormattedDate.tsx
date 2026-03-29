import { formatDate, toValidDate } from "#/lib/date"

type FormattedDateProps = {
  value: string | Date
  fallback?: string
  locale?: string
}

export default function FormattedDate({
  value,
  fallback = "-",
  locale,
}: FormattedDateProps) {
  const date = toValidDate(value)

  if (date === null) {
    return <span>{fallback}</span>
  }

  const formatted = formatDate(date, locale)

  if (formatted === null) {
    return <span>{fallback}</span>
  }

  return <time dateTime={date.toISOString()}>{formatted}</time>
}
