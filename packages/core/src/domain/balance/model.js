export function normalizeBalance(rawBalance) {
  return {
    ...rawBalance,
    today: rawBalance.today ?? 0,
    week: rawBalance.week ?? 0,
    month: rawBalance.month ?? 0,
    balance: rawBalance.balance ?? 0,
    currency: rawBalance.currency ?? 'KZT',
    park: rawBalance.park ?? '',
    commission: rawBalance.commission ?? 0,
    nextPayout: rawBalance.nextPayout ?? '',
    weekDays: Array.isArray(rawBalance.weekDays) ? rawBalance.weekDays : [],
    history: Array.isArray(rawBalance.history) ? rawBalance.history : [],
  }
}

export function getBalanceAmountByPeriod(balance, period) {
  if (period === 'today') return balance.today
  if (period === 'month') return balance.month
  return balance.week
}

export function getMaxWeekDayEarnings(weekDays) {
  return Math.max(...weekDays.map(day => day.earnings ?? 0), 1)
}
