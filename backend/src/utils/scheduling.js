export function isWithinHours(date, startHour = 9, endHour = 18) {
  const d = new Date(date)
  const h = d.getHours()
  return h >= startHour && h < endHour
}

export function slotKey(date, slotMinutes = 15) {
  const d = new Date(date)
  d.setSeconds(0, 0)
  const minutes = d.getMinutes()
  const floored = minutes - (minutes % slotMinutes)
  d.setMinutes(floored)
  return d.toISOString()
}
