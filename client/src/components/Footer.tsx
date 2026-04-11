export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-(--line) p-4 text-(--sea-ink-soft)">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Simon Hauck. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  )
}
