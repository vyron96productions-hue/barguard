// Seasonal / holiday pattern detection for smart reorder suggestions

export interface UpcomingHoliday {
  name: string
  date: string   // YYYY-MM-DD (this occurrence)
  lastYearStart: string  // ±7 days around same date last year
  lastYearEnd: string
  daysUntil: number
}

function getLastMonday(year: number, month: number): Date {
  // Last Monday of a given month (0-indexed month)
  const last = new Date(year, month + 1, 0) // last day of month
  const dow = last.getDay()
  last.setDate(last.getDate() - ((dow + 6) % 7))
  return last
}

function getNthWeekday(year: number, month: number, weekday: number, n: number): Date {
  // nth occurrence of weekday (0=Sun) in month
  const first = new Date(year, month, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  return new Date(year, month, 1 + diff + (n - 1) * 7)
}

function getLastFriday(year: number, month: number): Date {
  // Last Friday of a given month
  const last = new Date(year, month + 1, 0)
  const dow = last.getDay()
  last.setDate(last.getDate() - ((dow + 1) % 7 === 0 ? 0 : (dow + 1) % 7 + (dow >= 5 ? 0 : 0)))
  // simpler: walk back from end of month
  const end = new Date(year, month + 1, 0)
  while (end.getDay() !== 5) end.setDate(end.getDate() - 1)
  return end
}

export function getUpcomingHolidays(today: Date, daysAhead = 35): UpcomingHoliday[] {
  const todayStr = today.toLocaleDateString('en-CA')
  const y = today.getFullYear()
  const upcoming: UpcomingHoliday[] = []

  // Helper to add a candidate date
  function addHoliday(name: string, d: Date) {
    const dateStr = d.toLocaleDateString('en-CA')
    const diffMs = d.getTime() - today.getTime()
    const daysUntil = Math.ceil(diffMs / 86400000)
    if (daysUntil < 0 || daysUntil > daysAhead) return

    // Same date ±7 days last year
    const ly = new Date(d)
    ly.setFullYear(ly.getFullYear() - 1)
    const lyStart = new Date(ly); lyStart.setDate(lyStart.getDate() - 7)
    const lyEnd = new Date(ly); lyEnd.setDate(lyEnd.getDate() + 1)

    upcoming.push({
      name,
      date: dateStr,
      lastYearStart: lyStart.toLocaleDateString('en-CA'),
      lastYearEnd: lyEnd.toLocaleDateString('en-CA'),
      daysUntil,
    })
  }

  // Check both current year and next year for each holiday so we catch wrap-around
  for (const yr of [y, y + 1]) {
    // Fixed-date holidays (high bar traffic)
    addHoliday("New Year's Eve",        new Date(yr, 11, 31))
    addHoliday("New Year's Day",        new Date(yr,  0,  1))
    addHoliday("Valentine's Day",       new Date(yr,  1, 14))
    addHoliday("St. Patrick's Day",     new Date(yr,  2, 17))
    addHoliday("Cinco de Mayo",         new Date(yr,  4,  5))
    addHoliday("Independence Day",      new Date(yr,  6,  4))
    addHoliday("Halloween",             new Date(yr,  9, 31))
    addHoliday("Christmas Eve",         new Date(yr, 11, 24))
    addHoliday("Christmas Day",         new Date(yr, 11, 25))

    // "Blackout Wednesday" = night before Thanksgiving (Wed)
    const thanksgiving = getNthWeekday(yr, 10, 4, 4) // 4th Thursday of November
    const blackoutWed = new Date(thanksgiving); blackoutWed.setDate(blackoutWed.getDate() - 1)
    addHoliday('Thanksgiving Eve (Blackout Wednesday)', blackoutWed)
    addHoliday('Thanksgiving',          thanksgiving)

    // Memorial Day weekend (last Monday of May — flag the Saturday before)
    const memorialDay = getLastMonday(yr, 4)
    const memorialSat = new Date(memorialDay); memorialSat.setDate(memorialSat.getDate() - 2)
    addHoliday('Memorial Day Weekend',  memorialSat)

    // Labor Day weekend (first Monday of September — flag the Saturday before)
    const laborDay = getNthWeekday(yr, 8, 1, 1)
    const laborSat = new Date(laborDay); laborSat.setDate(laborSat.getDate() - 2)
    addHoliday('Labor Day Weekend',     laborSat)

    // Super Bowl Sunday (2nd Sunday of February)
    addHoliday('Super Bowl Sunday',     getNthWeekday(yr, 1, 0, 2))

    // St. Patrick's Day Eve (Sat before if St. Pat's is on a weekday)
    const stPats = new Date(yr, 2, 17)
    if (stPats.getDay() > 1 && stPats.getDay() < 6) {
      // it's Mon-Fri, find the preceding Saturday
      const eve = new Date(stPats)
      while (eve.getDay() !== 6) eve.setDate(eve.getDate() - 1)
      addHoliday("St. Patrick's Day Weekend", eve)
    }
  }

  // Deduplicate by date + name, sort by daysUntil
  const seen = new Set<string>()
  return upcoming
    .filter((h) => { const k = `${h.name}|${h.date}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => a.daysUntil - b.daysUntil)
}
