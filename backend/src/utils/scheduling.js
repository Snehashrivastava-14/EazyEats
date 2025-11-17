// timezone-aware check. Defaults can be overridden via env vars:
// CAFETERIA_OPEN_HOUR, CAFETERIA_CLOSE_HOUR, CAFETERIA_TIMEZONE (IANA name, e.g. 'Asia/Kolkata')
export function isWithinHours(date, startHour = Number(process.env.CAFETERIA_OPEN_HOUR || 9), endHour = Number(process.env.CAFETERIA_CLOSE_HOUR || 18), timeZone = process.env.CAFETERIA_TIMEZONE) {
  const d = new Date(date)
  let h
  if (timeZone) {
    try {
      // Use Intl to get the hour in the target timezone
      const hourStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(d)
      h = Number(hourStr)
    } catch (e) {
      // Fallback to server local hour
      h = d.getHours()
    }
  } else {
    h = d.getHours()
  }
  return h >= startHour && h < endHour
}

export function slotKey(date, slotMinutes = 15, timeZone = process.env.CAFETERIA_TIMEZONE) {
  const d = new Date(date)
  // produce a stable slot key in the cafeteria timezone (or server local if not set)
  if (timeZone) {
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone
      })
      const parts = fmt.formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc }, {})
      // parts: { year, month, day, hour, minute }
      const year = parts.year
      const month = parts.month
      const day = parts.day
      const hour = parts.hour
      const minute = parts.minute
      const m = Number(minute)
      const floored = String(m - (m % slotMinutes)).padStart(2, '0')
      return `${year}-${month}-${day}T${hour}:${floored}`
    } catch (e) {
      // fallback to UTC ISO if Intl fails
    }
  }

  // default fallback: floor minutes and return ISO string (UTC/local depending on input)
  d.setSeconds(0, 0)
  const minutes = d.getMinutes()
  const floored = minutes - (minutes % slotMinutes)
  d.setMinutes(floored)
  return d.toISOString()
}
