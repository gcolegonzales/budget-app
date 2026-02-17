export interface Settings {
  initialBalance: number
  startDate: string // ISO
  payroll: {
    firstDate: string
    frequency: 'monthly' | 'every2weeks'
    amountPerPaycheck: number
  }
}

export interface Expense {
  id: string
  name: string
  amount: number
  recurring: 'none' | 'weekly' | 'monthly'
  startDate: string // ISO
  endDate?: string // ISO; optional; only applies when recurring !== 'none'
  category?: string
  notes?: string
}

export interface ExpenseInstance {
  date: string
  amount: number
  expenseId: string
  name: string
}

export interface Income {
  id: string
  name: string
  amount: number
  recurring: 'none' | 'weekly' | 'monthly'
  startDate: string // ISO
  endDate?: string // ISO; optional; only applies when recurring !== 'none'
  category?: string
  notes?: string
}

export interface IncomeInstance {
  date: string
  amount: number
  incomeId: string
  name: string
}
