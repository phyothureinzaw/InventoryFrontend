export type UtcDateRange = { fromUtc: string; toUtc: string }

function localDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function localCalendarRange(fromDate: string, toDate: string): UtcDateRange | null {
  const from = localDateParts(fromDate); const to = localDateParts(toDate)
  if (!from || !to || from > to) return null
  const exclusiveEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1)
  return { fromUtc: from.toISOString(), toUtc: exclusiveEnd.toISOString() }
}

export function utcCalendarRange(fromDate: string, toDate: string): UtcDateRange | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate) || fromDate > toDate) return null
  const end = new Date(`${toDate}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  return { fromUtc: `${fromDate}T00:00:00.000Z`, toUtc: end.toISOString() }
}

export function utcToday() {
  return new Date().toISOString().slice(0, 10)
}

export function subtractUtcDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() - days)
  return value.toISOString().slice(0, 10)
}

export function utcChartLabel(date: string) { return date }

export function validUtcRange(fromDate: string, toDate: string, maxDays = 366) {
  const range = utcCalendarRange(fromDate, toDate)
  if (!range) return false
  return (Date.parse(range.toUtc) - Date.parse(range.fromUtc)) / 86_400_000 <= maxDays
}
