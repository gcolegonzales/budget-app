import {
  addWeeks,
  addMonths,
  addDays,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  isSameDay,
  parseISO,
  format,
} from 'date-fns'
import type { Settings, Expense, ExpenseInstance, Income, IncomeInstance } from '../types'

const SETTINGS_KEY = 'budget-app-settings'
const EXPENSES_KEY = 'budget-app-expenses'
const INCOME_KEY = 'budget-app-income'
const SAVED_BUDGETS_KEY = 'budget-app-saved-budgets'

export interface SavedBudgetMeta {
  id: string
  name: string
  savedAt: string
}

interface SavedBudgetEntry extends SavedBudgetMeta {
  data: string
}

export function getSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Settings
  } catch {
    return null
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** Default budget start when none set (e.g. legacy data). */
const DEFAULT_BUDGET_START = '2025-02-16'

/** Earliest date the user can navigate to for this budget. */
export function getBudgetStartDate(): Date {
  const settings = getSettings()
  const start = settings?.startDate
  if (!start) return parseISO(DEFAULT_BUDGET_START)
  try {
    return parseISO(start)
  } catch {
    return parseISO(DEFAULT_BUDGET_START)
  }
}

/** Clears all app data (settings, expenses, income). Use for "Start Over". */
export function clearAllData(): void {
  localStorage.removeItem(SETTINGS_KEY)
  localStorage.removeItem(EXPENSES_KEY)
  localStorage.removeItem(INCOME_KEY)
}

export function getExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Expense[]
  } catch {
    return []
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
}

export function addExpense(expense: Omit<Expense, 'id'>): Expense {
  const expenses = getExpenses()
  const id = crypto.randomUUID()
  const newExpense: Expense = { ...expense, id }
  saveExpenses([...expenses, newExpense])
  return newExpense
}

export function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id'>>
): Expense | null {
  const expenses = getExpenses()
  const idx = expenses.findIndex((e) => e.id === id)
  if (idx === -1) return null
  const updated = { ...expenses[idx], ...updates }
  const next = [...expenses]
  next[idx] = updated
  saveExpenses(next)
  return updated
}

export function getExpenseById(id: string): Expense | null {
  return getExpenses().find((e) => e.id === id) ?? null
}

export function deleteExpense(id: string): boolean {
  const expenses = getExpenses()
  const filtered = expenses.filter((e) => e.id !== id)
  if (filtered.length === expenses.length) return false
  saveExpenses(filtered)
  return true
}

export function hasExpenseOnDate(date: Date): boolean {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  const instances = getExpenseInstancesInRange(start, end)
  return instances.length > 0
}

function getExpenseInstancesForOne(
  expense: Expense,
  from: Date,
  to: Date
): ExpenseInstance[] {
  const start = parseISO(expense.startDate)
  if (isAfter(start, to)) return []
  const instances: ExpenseInstance[] = []
  if (expense.recurring === 'none') {
    if (isWithinInterval(start, { start: from, end: to })) {
      instances.push({
        date: expense.startDate,
        amount: expense.amount,
        expenseId: expense.id,
        name: expense.name,
      })
    }
    return instances
  }
  // Recurring: only generate instances on or after the expense start date (never backward).
  const endDate = expense.endDate ? parseISO(expense.endDate) : null
  let cursor = new Date(start)
  while (!isAfter(cursor, to)) {
    if (endDate && isAfter(cursor, endDate)) break
    const inRange = !isBefore(cursor, from)
    const onOrAfterExpenseStart = !isBefore(cursor, start)
    if (inRange && onOrAfterExpenseStart) {
      instances.push({
        date: format(cursor, 'yyyy-MM-dd'),
        amount: expense.amount,
        expenseId: expense.id,
        name: expense.name,
      })
    }
    if (expense.recurring === 'weekly') {
      cursor = addWeeks(cursor, 1)
    } else {
      cursor = addMonths(cursor, 1)
    }
  }
  return instances
}

export function getExpenseInstancesInRange(
  from: Date,
  to: Date
): ExpenseInstance[] {
  const expenses = getExpenses()
  const instances: ExpenseInstance[] = []
  for (const e of expenses) {
    instances.push(...getExpenseInstancesForOne(e, from, to))
  }
  return instances.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export function getPayrollDatesInRange(from: Date, to: Date): Date[] {
  const settings = getSettings()
  if (!settings?.payroll) return []
  const { firstDate, frequency } = settings.payroll
  const start = parseISO(firstDate)
  if (isAfter(start, to)) return []
  const dates: Date[] = []
  let cursor = new Date(start)
  while (!isAfter(cursor, to)) {
    if (!isBefore(cursor, from)) {
      dates.push(new Date(cursor))
    }
    if (frequency === 'monthly') {
      cursor = addMonths(cursor, 1)
    } else {
      cursor = addWeeks(cursor, 2)
    }
  }
  return dates
}

export function getBalanceOnDate(date: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  if (isBefore(date, start)) return 0
  let balance = settings.initialBalance
  const payrollDates = getPayrollDatesInRange(start, date)
  balance += payrollDates.length * settings.payroll.amountPerPaycheck
  const expenseInstances = getExpenseInstancesInRange(start, date)
  balance -= expenseInstances.reduce((sum, i) => sum + i.amount, 0)
  const incomeInstances = getIncomeInstancesInRange(start, date)
  balance += incomeInstances.reduce((sum, i) => sum + i.amount, 0)
  return balance
}

export function getMonthlyIncome(): number {
  const settings = getSettings()
  if (!settings?.payroll) return 0
  const { frequency, amountPerPaycheck } = settings.payroll
  if (frequency === 'monthly') return amountPerPaycheck
  return amountPerPaycheck * (26 / 12)
}

export function getAmountSpentInMonth(month: Date): number {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const instances = getExpenseInstancesInRange(start, end)
  return instances.reduce((sum, i) => sum + i.amount, 0)
}

/** Spending by category for the given month. */
export function getSpendingByCategoryForMonth(
  month: Date
): { category: string; amount: number }[] {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const instances = getExpenseInstancesInRange(start, end)
  const byCategory = new Map<string, number>()
  for (const inst of instances) {
    const expense = getExpenseById(inst.expenseId)
    const cat = expense?.category?.trim() || 'Uncategorized'
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + inst.amount)
  }
  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** Spending by expense name (individual purchase names) for the given month. */
export function getSpendingByNameForMonth(
  month: Date
): { name: string; amount: number }[] {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const instances = getExpenseInstancesInRange(start, end)
  const byName = new Map<string, number>()
  for (const inst of instances) {
    const expense = getExpenseById(inst.expenseId)
    const label = expense?.name?.trim() || 'Unnamed'
    byName.set(label, (byName.get(label) ?? 0) + inst.amount)
  }
  return Array.from(byName.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** Balance at end of each day in the given month (for charts). */
export function getBalanceSeriesForMonth(
  month: Date
): { date: string; balance: number }[] {
  const settings = getSettings()
  if (!settings) return []
  const start = parseISO(settings.startDate)
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const rangeStart = isBefore(monthStart, start) ? start : monthStart
  if (isAfter(rangeStart, monthEnd)) return []
  const points: { date: string; balance: number }[] = []
  let cursor = new Date(rangeStart)
  while (!isAfter(cursor, monthEnd)) {
    points.push({
      date: format(cursor, 'MMM d'),
      balance: getBalanceOnDate(cursor),
    })
    cursor = addDays(cursor, 1)
  }
  return points
}

/** Total income in a month: payroll in that month + income instances in range */
export function getIncomeInMonth(month: Date): number {
  const settings = getSettings()
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  let total = 0
  if (settings?.payroll) {
    const payrollDates = getPayrollDatesInRange(start, end)
    total += payrollDates.length * settings.payroll.amountPerPaycheck
  }
  const incomeInstances = getIncomeInstancesInRange(start, end)
  total += incomeInstances.reduce((sum, i) => sum + i.amount, 0)
  return total
}

/** Minimum balance on any day in the given month (or 0 if month is before budget start) */
export function getLowestBalanceInMonth(month: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  if (isAfter(monthStart, monthEnd)) return 0
  const rangeStart = isBefore(monthStart, start) ? start : monthStart
  if (isAfter(rangeStart, monthEnd)) return 0
  let min = getBalanceOnDate(rangeStart)
  let cursor = new Date(rangeStart)
  while (!isAfter(cursor, monthEnd)) {
    const bal = getBalanceOnDate(cursor)
    if (bal < min) min = bal
    cursor = addDays(cursor, 1)
  }
  return min
}

/** Average amount spent per month from budget start through the given month (inclusive). */
export function getAverageSpentPerMonth(throughMonth: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  const startMonth = startOfMonth(start)
  const endMonth = endOfMonth(throughMonth)
  if (isBefore(endMonth, startMonth)) return 0
  let months = 0
  let total = 0
  let cursor = startMonth
  while (!isAfter(cursor, endMonth)) {
    total += getAmountSpentInMonth(cursor)
    months += 1
    cursor = addMonths(cursor, 1)
  }
  return months === 0 ? 0 : total / months
}

/** Total spent from budget start through the end of the given month. */
export function getTotalSpentFromStart(throughMonth: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  const startMonth = startOfMonth(start)
  const endMonth = endOfMonth(throughMonth)
  if (isBefore(endMonth, startMonth)) return 0
  let total = 0
  let cursor = startMonth
  while (!isAfter(cursor, endMonth)) {
    total += getAmountSpentInMonth(cursor)
    cursor = addMonths(cursor, 1)
  }
  return total
}

/** Total income (payroll + one-off) from budget start through the end of the given month. */
export function getTotalIncomeFromStart(throughMonth: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  const startMonth = startOfMonth(start)
  const endMonth = endOfMonth(throughMonth)
  if (isBefore(endMonth, startMonth)) return 0
  let total = 0
  let cursor = startMonth
  while (!isAfter(cursor, endMonth)) {
    total += getIncomeInMonth(cursor)
    cursor = addMonths(cursor, 1)
  }
  return total
}

/** Number of months from budget start through the given month (inclusive). */
export function getMonthsTrackedCount(throughMonth: Date): number {
  const settings = getSettings()
  if (!settings) return 0
  const start = parseISO(settings.startDate)
  const startMonth = startOfMonth(start)
  const endMonth = endOfMonth(throughMonth)
  if (isBefore(endMonth, startMonth)) return 0
  let months = 0
  let cursor = startMonth
  while (!isAfter(cursor, endMonth)) {
    months += 1
    cursor = addMonths(cursor, 1)
  }
  return months
}

export type ExportRow = {
  date: string
  name: string
  type: 'Expense' | 'Income' | 'Payroll'
  amount: number
}

/** All transactions in range for CSV export: expenses, income, payroll */
export function getExportRowsForRange(from: Date, to: Date): ExportRow[] {
  const rows: ExportRow[] = []
  const expenseInstances = getExpenseInstancesInRange(from, to)
  for (const i of expenseInstances) {
    rows.push({ date: i.date, name: i.name, type: 'Expense', amount: i.amount })
  }
  const incomeInstances = getIncomeInstancesInRange(from, to)
  for (const i of incomeInstances) {
    rows.push({ date: i.date, name: i.name, type: 'Income', amount: i.amount })
  }
  const settings = getSettings()
  if (settings?.payroll) {
    const payrollDates = getPayrollDatesInRange(from, to)
    for (const d of payrollDates) {
      rows.push({
        date: format(d, 'yyyy-MM-dd'),
        name: 'Payroll',
        type: 'Payroll',
        amount: settings.payroll.amountPerPaycheck,
      })
    }
  }
  return rows.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

const BUDGET_EXPORT_VERSION = 1

export function exportBudgetToJson(): string {
  const data = {
    version: BUDGET_EXPORT_VERSION,
    settings: getSettings(),
    expenses: getExpenses(),
    incomes: getIncomes(),
  }
  return JSON.stringify(data)
}

export function importBudgetFromJson(json: string): void {
  const data = JSON.parse(json) as {
    version?: number
    settings?: Settings | null
    expenses?: Expense[]
    incomes?: Income[]
  }
  if (data.version !== BUDGET_EXPORT_VERSION || data.settings == null) {
    throw new Error('Invalid budget file')
  }
  const expenses = Array.isArray(data.expenses) ? data.expenses : []
  const incomes = Array.isArray(data.incomes) ? data.incomes : []
  saveSettings(data.settings)
  saveExpenses(expenses)
  saveIncomes(incomes)
}

// ---------- Saved budgets (in-app file system) ----------
function isUuid(id: string): boolean {
  return id.length > 20 && id.includes('-')
}

function getSavedBudgetsRaw(): SavedBudgetEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_BUDGETS_KEY)
    if (!raw) return []
    let entries = JSON.parse(raw) as SavedBudgetEntry[]
    const hasUuids = entries.some((e) => isUuid(e.id))
    if (hasUuids && entries.length > 0) {
      entries = entries
        .slice()
        .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime())
      entries = entries.map((e, i) => ({ ...e, id: String(i + 1) }))
      saveSavedBudgetsRaw(entries)
    }
    return entries
  } catch {
    return []
  }
}

function saveSavedBudgetsRaw(entries: SavedBudgetEntry[]): void {
  localStorage.setItem(SAVED_BUDGETS_KEY, JSON.stringify(entries))
}

export function listSavedBudgets(): SavedBudgetMeta[] {
  return getSavedBudgetsRaw().map(({ id, name, savedAt }) => ({ id, name, savedAt }))
}

export function saveBudgetToStorage(name: string): string {
  const json = exportBudgetToJson()
  const entries = getSavedBudgetsRaw()
  const numericIds = entries
    .map((e) => parseInt(e.id, 10))
    .filter((n) => !Number.isNaN(n))
  const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1
  const id = String(nextNum)
  const savedAt = new Date().toISOString()
  entries.push({ id, name: name.trim() || `Budget ${savedAt.slice(0, 10)}`, savedAt, data: json })
  saveSavedBudgetsRaw(entries)
  return id
}

export function loadBudgetFromStorage(id: string): void {
  const entries = getSavedBudgetsRaw()
  const entry = entries.find((e) => e.id === id)
  if (!entry) throw new Error('Saved budget not found')
  importBudgetFromJson(entry.data)
}

export function deleteBudgetFromStorage(id: string): void {
  const entries = getSavedBudgetsRaw().filter((e) => e.id !== id)
  saveSavedBudgetsRaw(entries)
}

/** Update a saved budget's name and/or data (e.g. after editing settings). */
export function updateBudgetInStorage(
  id: string,
  updates: { name?: string; data?: string }
): void {
  const entries = getSavedBudgetsRaw()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return
  const entry = entries[idx]
  const updated: SavedBudgetEntry = {
    ...entry,
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.data !== undefined && { data: updates.data }),
    savedAt: new Date().toISOString(),
  }
  const next = [...entries]
  next[idx] = updated
  saveSavedBudgetsRaw(next)
}

/** Group instances by expense for display: name, count, total */
export function groupInstancesByExpense(
  instances: ExpenseInstance[]
): { name: string; expenseId: string; count: number; total: number }[] {
  const byId = new Map<
    string,
    { name: string; count: number; total: number }
  >()
  for (const i of instances) {
    const cur = byId.get(i.expenseId) ?? {
      name: i.name,
      count: 0,
      total: 0,
    }
    cur.count += 1
    cur.total += i.amount
    byId.set(i.expenseId, cur)
  }
  return Array.from(byId.entries()).map(([expenseId, { name, count, total }]) => ({
    expenseId,
    name,
    count,
    total,
  }))
}

// ---------- Income ----------
export function getIncomes(): Income[] {
  try {
    const raw = localStorage.getItem(INCOME_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Income[]
  } catch {
    return []
  }
}

export function saveIncomes(incomes: Income[]): void {
  localStorage.setItem(INCOME_KEY, JSON.stringify(incomes))
}

export function addIncome(income: Omit<Income, 'id'>): Income {
  const incomes = getIncomes()
  const id = crypto.randomUUID()
  const newIncome: Income = { ...income, id }
  saveIncomes([...incomes, newIncome])
  return newIncome
}

export function updateIncome(
  id: string,
  updates: Partial<Omit<Income, 'id'>>
): Income | null {
  const incomes = getIncomes()
  const idx = incomes.findIndex((i) => i.id === id)
  if (idx === -1) return null
  const updated = { ...incomes[idx], ...updates }
  const next = [...incomes]
  next[idx] = updated
  saveIncomes(next)
  return updated
}

export function getIncomeById(id: string): Income | null {
  return getIncomes().find((i) => i.id === id) ?? null
}

export function deleteIncome(id: string): boolean {
  const incomes = getIncomes()
  const filtered = incomes.filter((i) => i.id !== id)
  if (filtered.length === incomes.length) return false
  saveIncomes(filtered)
  return true
}

function getIncomeInstancesForOne(
  income: Income,
  from: Date,
  to: Date
): IncomeInstance[] {
  const start = parseISO(income.startDate)
  if (isAfter(start, to)) return []
  const instances: IncomeInstance[] = []
  if (income.recurring === 'none') {
    if (isWithinInterval(start, { start: from, end: to })) {
      instances.push({
        date: income.startDate,
        amount: income.amount,
        incomeId: income.id,
        name: income.name,
      })
    }
    return instances
  }
  const endDate = income.endDate ? parseISO(income.endDate) : null
  let cursor = new Date(start)
  while (!isAfter(cursor, to)) {
    if (endDate && isAfter(cursor, endDate)) break
    const inRange = !isBefore(cursor, from)
    const onOrAfterStart = !isBefore(cursor, start)
    if (inRange && onOrAfterStart) {
      instances.push({
        date: format(cursor, 'yyyy-MM-dd'),
        amount: income.amount,
        incomeId: income.id,
        name: income.name,
      })
    }
    if (income.recurring === 'weekly') {
      cursor = addWeeks(cursor, 1)
    } else {
      cursor = addMonths(cursor, 1)
    }
  }
  return instances
}

export function getIncomeInstancesInRange(
  from: Date,
  to: Date
): IncomeInstance[] {
  const incomes = getIncomes()
  const instances: IncomeInstance[] = []
  for (const i of incomes) {
    instances.push(...getIncomeInstancesForOne(i, from, to))
  }
  return instances.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export function hasIncomeOnDate(date: Date): boolean {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  const instances = getIncomeInstancesInRange(start, end)
  return instances.length > 0
}

function dayStartEnd(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getExpenseCountOnDate(date: Date): number {
  const { start, end } = dayStartEnd(date)
  return getExpenseInstancesInRange(start, end).length
}

export function getIncomeCountOnDate(date: Date): number {
  const { start, end } = dayStartEnd(date)
  return getIncomeInstancesInRange(start, end).length
}

/** Group income instances by income for display */
export function groupInstancesByIncome(
  instances: IncomeInstance[]
): { name: string; incomeId: string; count: number; total: number }[] {
  const byId = new Map<
    string,
    { name: string; count: number; total: number }
  >()
  for (const i of instances) {
    const cur = byId.get(i.incomeId) ?? {
      name: i.name,
      count: 0,
      total: 0,
    }
    cur.count += 1
    cur.total += i.amount
    byId.set(i.incomeId, cur)
  }
  return Array.from(byId.entries()).map(([incomeId, { name, count, total }]) => ({
    incomeId,
    name,
    count,
    total,
  }))
}

export function isPayrollDate(date: Date): boolean {
  const payrollDates = getPayrollDatesInRange(date, date)
  return payrollDates.some((d) => isSameDay(d, date))
}
