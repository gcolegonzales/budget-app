import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import CurrencyInput from 'react-currency-input-field'
import {
  getBalanceOnDate,
  getExpenseInstancesInRange,
  groupInstancesByExpense,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseById,
  getIncomeInstancesInRange,
  groupInstancesByIncome,
  addIncome,
  updateIncome,
  deleteIncome,
  getIncomeById,
  getSettings,
  isPayrollDate,
} from '../lib/state'
import { formatCurrency, parseCurrencyInput } from '../lib/currency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, UNCATEGORIZED } from '../lib/categories'
import ConfirmModal from './ConfirmModal'
import Dropdown from './Dropdown'
import Checkbox from './Checkbox'
import Radio from './Radio'
import type { Expense, Income } from '../types'
interface DateModalProps {
  date: Date
  onClose: () => void
  onExpenseAdded?: () => void
}

export default function DateModal({
  date,
  onClose,
  onExpenseAdded,
}: DateModalProps) {
  const [_refreshKey, setRefreshKey] = useState(0)
  const settings = getSettings()
  const startDate = settings ? parseISO(settings.startDate) : date
  const balance = getBalanceOnDate(date)
  const instances = getExpenseInstancesInRange(startDate, date)
  const grouped = groupInstancesByExpense(instances)
  const expensesByCategory = (() => {
    const map = new Map<string, typeof grouped>()
    for (const g of grouped) {
      const category = getExpenseById(g.expenseId)?.category?.trim() || UNCATEGORIZED
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(g)
    }
    const categories = Array.from(map.keys()).sort((a, b) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b)
    })
    return categories.map((cat) => ({ category: cat, items: map.get(cat)! }))
  })()
  const incomeInstances = getIncomeInstancesInRange(startDate, date)
  const incomeGrouped = groupInstancesByIncome(incomeInstances)
  const incomeByCategory = (() => {
    const map = new Map<string, typeof incomeGrouped>()
    for (const g of incomeGrouped) {
      const category = getIncomeById(g.incomeId)?.category?.trim() || UNCATEGORIZED
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(g)
    }
    const categories = Array.from(map.keys()).sort((a, b) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b)
    })
    return categories.map((cat) => ({ category: cat, items: map.get(cat)! }))
  })()

  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addRecurring, setAddRecurring] = useState<'none' | 'weekly' | 'monthly'>('none')
  const [addEndsOn, setAddEndsOn] = useState(false)
  const [addEndDate, setAddEndDate] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addError, setAddError] = useState('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editRecurring, setEditRecurring] = useState<'none' | 'weekly' | 'monthly'>('none')
  const [editEndsOn, setEditEndsOn] = useState(false)
  const [editEndDate, setEditEndDate] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editError, setEditError] = useState('')

  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false)
  const [addIncomeName, setAddIncomeName] = useState('')
  const [addIncomeAmount, setAddIncomeAmount] = useState('')
  const [addIncomeRecurring, setAddIncomeRecurring] = useState<'none' | 'weekly' | 'monthly'>('none')
  const [addIncomeEndsOn, setAddIncomeEndsOn] = useState(false)
  const [addIncomeEndDate, setAddIncomeEndDate] = useState('')
  const [addIncomeCategory, setAddIncomeCategory] = useState('')
  const [addIncomeNotes, setAddIncomeNotes] = useState('')
  const [addIncomeError, setAddIncomeError] = useState('')
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editIncomeName, setEditIncomeName] = useState('')
  const [editIncomeAmount, setEditIncomeAmount] = useState('')
  const [editIncomeRecurring, setEditIncomeRecurring] = useState<'none' | 'weekly' | 'monthly'>('none')
  const [editIncomeEndsOn, setEditIncomeEndsOn] = useState(false)
  const [editIncomeEndDate, setEditIncomeEndDate] = useState('')
  const [editIncomeCategory, setEditIncomeCategory] = useState('')
  const [editIncomeNotes, setEditIncomeNotes] = useState('')
  const [editIncomeError, setEditIncomeError] = useState('')

  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null)
  const [expandedIncomeId, setExpandedIncomeId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(addAmount)
    const name = addName.trim()
    if (!name) {
      setAddError('Enter a name.')
      return
    }
    if (amount <= 0) {
      setAddError('Enter a valid amount.')
      return
    }
    addExpense({
      name,
      amount,
      recurring: addRecurring,
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: addRecurring !== 'none' && addEndsOn && addEndDate ? addEndDate : undefined,
      category: addCategory.trim() || undefined,
      notes: addNotes.trim() || undefined,
    })
    setAddName('')
    setAddAmount('')
    setAddRecurring('none')
    setAddEndsOn(false)
    setAddEndDate('')
    setAddCategory('')
    setAddNotes('')
    setShowAddForm(false)
    setAddError('')
    setRefreshKey((k) => k + 1)
    onExpenseAdded?.()
  }

  const handleStartEdit = (expenseId: string) => {
    const expense = getExpenseById(expenseId)
    if (!expense) return
    setShowAddForm(false)
    setEditingIncome(null)
    setShowAddIncomeForm(false)
    setEditingExpense(expense)
    setEditName(expense.name)
    setEditAmount(String(expense.amount))
    setEditRecurring(expense.recurring)
    setEditEndsOn(!!expense.endDate)
    setEditEndDate(expense.endDate ?? '')
    setEditCategory(expense.category ?? '')
    setEditNotes(expense.notes ?? '')
    setEditError('')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return
    const amount = parseCurrencyInput(editAmount)
    const name = editName.trim()
    if (!name) {
      setEditError('Enter a name.')
      return
    }
    if (amount <= 0) {
      setEditError('Enter a valid amount.')
      return
    }
    updateExpense(editingExpense.id, {
      name,
      amount,
      recurring: editRecurring,
      endDate: editRecurring !== 'none' && editEndsOn && editEndDate ? editEndDate : undefined,
      category: editCategory.trim() || undefined,
      notes: editNotes.trim() || undefined,
    })
    setEditingExpense(null)
    setEditError('')
    setRefreshKey((k) => k + 1)
    onExpenseAdded?.()
  }

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(addIncomeAmount)
    const name = addIncomeName.trim()
    if (!name) {
      setAddIncomeError('Enter a name.')
      return
    }
    if (amount <= 0) {
      setAddIncomeError('Enter a valid amount.')
      return
    }
    addIncome({
      name,
      amount,
      recurring: addIncomeRecurring,
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: addIncomeRecurring !== 'none' && addIncomeEndsOn && addIncomeEndDate ? addIncomeEndDate : undefined,
      category: addIncomeCategory.trim() || undefined,
      notes: addIncomeNotes.trim() || undefined,
    })
    setAddIncomeName('')
    setAddIncomeAmount('')
    setAddIncomeRecurring('none')
    setAddIncomeEndsOn(false)
    setAddIncomeEndDate('')
    setAddIncomeCategory('')
    setAddIncomeNotes('')
    setShowAddIncomeForm(false)
    setAddIncomeError('')
    setRefreshKey((k) => k + 1)
    onExpenseAdded?.()
  }

  const handleStartEditIncome = (incomeId: string) => {
    const income = getIncomeById(incomeId)
    if (!income) return
    setShowAddForm(false)
    setEditingExpense(null)
    setShowAddIncomeForm(false)
    setEditingIncome(income)
    setEditIncomeName(income.name)
    setEditIncomeAmount(String(income.amount))
    setEditIncomeRecurring(income.recurring)
    setEditIncomeEndsOn(!!income.endDate)
    setEditIncomeEndDate(income.endDate ?? '')
    setEditIncomeCategory(income.category ?? '')
    setEditIncomeNotes(income.notes ?? '')
    setEditIncomeError('')
  }

  const handleSaveEditIncome = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIncome) return
    const amount = parseCurrencyInput(editIncomeAmount)
    const name = editIncomeName.trim()
    if (!name) {
      setEditIncomeError('Enter a name.')
      return
    }
    if (amount <= 0) {
      setEditIncomeError('Enter a valid amount.')
      return
    }
    updateIncome(editingIncome.id, {
      name,
      amount,
      recurring: editIncomeRecurring,
      endDate: editIncomeRecurring !== 'none' && editIncomeEndsOn && editIncomeEndDate ? editIncomeEndDate : undefined,
      category: editIncomeCategory.trim() || undefined,
      notes: editIncomeNotes.trim() || undefined,
    })
    setEditingIncome(null)
    setEditIncomeError('')
    setRefreshKey((k) => k + 1)
    onExpenseAdded?.()
  }

  const isPayDay = isPayrollDate(date)

  const editModalOpen = !!editingExpense || !!editingIncome

  return (
    <>
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] sm:max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col overflow-hidden mx-4 my-4 sm:mx-0 sm:my-0"
          >
            <div className="p-4 sm:p-6 border-b border-slate-100 flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold text-slate-800">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </Dialog.Title>
              {isPayDay && (
                <span className="inline-block mt-2 text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-1 rounded">
                  Pay Day
                </span>
              )}
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                You will have <span className="text-blue-600">{formatCurrency(balance)}</span> on this date
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4 sm:px-4 sm:pt-6 sm:pb-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">
                  Expenses From Start Through This Date
                </h3>
                {grouped.length === 0 ? (
                  <p className="text-slate-500 text-sm">No expenses yet.</p>
                ) : (
                  <div className="space-y-4">
                    {expensesByCategory.map(({ category, items }) => (
                      <div key={category}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          {category}
                        </p>
                        <ul className="space-y-1">
                          <AnimatePresence>
                            {items.map((g, i) => {
                              const isExpanded = expandedExpenseId === g.expenseId
                              const groupInstances = instances
                                .filter((inst) => inst.expenseId === g.expenseId)
                                .sort((a, b) => a.date.localeCompare(b.date))
                              const expense = getExpenseById(g.expenseId)
                              return (
                                <motion.li
                                  key={g.expenseId}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="rounded-lg border-b border-slate-200 last:border-0 overflow-visible"
                                >
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('button[data-edit]')) return
                                      setExpandedExpenseId((id) => (id === g.expenseId ? null : g.expenseId))
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button[data-edit]')) {
                                        setExpandedExpenseId((id) => (id === g.expenseId ? null : g.expenseId))
                                      }
                                    }}
                                    className="group relative flex justify-between items-center gap-2 py-2 pl-1 pr-2 -mx-2 text-sm sm:text-base cursor-pointer hover:bg-slate-50 transition-colors min-h-[2.5rem]"
                                  >
                                    {expense?.notes?.trim() && (
                                      <span
                                        className="pointer-events-none absolute bottom-full left-10 mb-1 z-10 max-w-xs rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                                        role="tooltip"
                                      >
                                        {expense.notes}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-2 min-w-0 flex-1 min-h-[2.25rem] items-center">
                                      <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                        <button
                                          type="button"
                                          data-edit
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEdit(g.expenseId)
                                          }}
                                          className="btn-edit-icon cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700"
                                          aria-label="Edit expense"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                        </button>
                                      </span>
                                      <span className="text-slate-700 truncate">
                                        {g.name} ({g.count})
                                      </span>
                                    </span>
                                    <span className="font-medium text-blue-600 flex-shrink-0">
                                      {formatCurrency(g.total)}
                                    </span>
                                  </div>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.12, ease: 'easeOut' }}
                                        className="pl-3 pr-2 pb-2 border-l-2 border-slate-200 ml-2 mt-0 space-y-0"
                                      >
                                        {groupInstances.map((inst) => (
                                          <div
                                            key={`${inst.date}-${inst.amount}`}
                                            className="flex justify-between items-baseline text-xs sm:text-sm text-slate-600 py-2 border-b border-slate-200 last:border-b-0"
                                          >
                                            <span>{format(parseISO(inst.date), 'MMM d, yyyy')}</span>
                                            <span className="font-medium text-blue-600">
                                              {formatCurrency(inst.amount)}
                                            </span>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              )
                            })}
                          </AnimatePresence>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showAddForm && !editingExpense ? (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddExpense}
                    className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200"
                  >
                    <input
                      type="text"
                      placeholder="Expense name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <CurrencyInput
                      value={addAmount}
                      onValueChange={(v) => setAddAmount(v ?? '')}
                      placeholder="Amount"
                      prefix="$"
                      decimalsLimit={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Category (optional)</label>
                      <Dropdown
                        value={addCategory}
                        onChange={setAddCategory}
                        options={EXPENSE_CATEGORIES}
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        placeholder="Notes"
                        value={addNotes}
                        onChange={(e) => setAddNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-sm text-slate-600">Recurring:</span>
                      <Radio
                        name="recurring"
                        value="none"
                        checked={addRecurring === 'none'}
                        onChange={() => setAddRecurring('none')}
                      >
                        None
                      </Radio>
                      <Radio
                        name="recurring"
                        value="weekly"
                        checked={addRecurring === 'weekly'}
                        onChange={() => setAddRecurring('weekly')}
                      >
                        Weekly
                      </Radio>
                      <Radio
                        name="recurring"
                        value="monthly"
                        checked={addRecurring === 'monthly'}
                        onChange={() => setAddRecurring('monthly')}
                      >
                        Monthly
                      </Radio>
                    </div>
                    {addRecurring !== 'none' && (
                      <div className="flex flex-wrap gap-3 items-center">
                        <Checkbox
                          checked={addEndsOn}
                          onChange={setAddEndsOn}
                        >
                          Ends On
                        </Checkbox>
                        {addEndsOn && (
                          <input
                            type="date"
                            value={addEndDate}
                            onChange={(e) => setAddEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        )}
                      </div>
                    )}
                    {addError && (
                      <p className="text-sm text-red-600">{addError}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setAddError('')
                        }}
                        className="btn-interactive btn-secondary w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-interactive btn-primary w-full px-3 py-2 rounded-xl bg-sky-400 text-white text-sm font-medium hover:bg-sky-500"
                      >
                        Add Expense
                      </button>
                    </div>
                  </motion.form>
                ) : !editingExpense ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpense(null)
                        setEditingIncome(null)
                        setShowAddIncomeForm(false)
                        setShowAddForm(true)
                      }}
                      className="btn-interactive btn-secondary w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                    >
                      + Add Expense
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">
                  Income From Start Through This Date
                </h3>
                {incomeGrouped.length === 0 ? (
                  <p className="text-slate-500 text-sm">No income yet.</p>
                ) : (
                  <div className="space-y-4">
                    {incomeByCategory.map(({ category, items }) => (
                      <div key={category}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          {category}
                        </p>
                        <ul className="space-y-1">
                          <AnimatePresence>
                            {items.map((g, i) => {
                              const isExpanded = expandedIncomeId === g.incomeId
                              const groupInstances = incomeInstances
                                .filter((inst) => inst.incomeId === g.incomeId)
                                .sort((a, b) => a.date.localeCompare(b.date))
                              const income = getIncomeById(g.incomeId)
                              return (
                                <motion.li
                                  key={g.incomeId}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="rounded-lg border-b border-slate-200 last:border-0 overflow-visible"
                                >
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('button[data-edit]')) return
                                      setExpandedIncomeId((id) => (id === g.incomeId ? null : g.incomeId))
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button[data-edit]')) {
                                        setExpandedIncomeId((id) => (id === g.incomeId ? null : g.incomeId))
                                      }
                                    }}
                                    className="group relative flex justify-between items-center gap-2 py-2 pl-1 pr-2 -mx-2 text-sm sm:text-base cursor-pointer hover:bg-slate-50 transition-colors min-h-[2.5rem]"
                                  >
                                    {income?.notes?.trim() && (
                                      <span
                                        className="pointer-events-none absolute bottom-full left-10 mb-1 z-10 max-w-xs rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                                        role="tooltip"
                                      >
                                        {income.notes}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-2 min-w-0 flex-1 min-h-[2.25rem] items-center">
                                      <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                        <button
                                          type="button"
                                          data-edit
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEditIncome(g.incomeId)
                                          }}
                                          className="btn-edit-icon cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700"
                                          aria-label="Edit income"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                        </button>
                                      </span>
                                      <span className="text-slate-700 truncate">
                                        {g.name} ({g.count})
                                      </span>
                                    </span>
                                    <span className="font-medium text-green-600 flex-shrink-0">
                                      +{formatCurrency(g.total)}
                                    </span>
                                  </div>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.12, ease: 'easeOut' }}
                                        className="pl-3 pr-2 pb-2 border-l-2 border-slate-200 ml-2 mt-0 space-y-0"
                                      >
                                        {groupInstances.map((inst) => (
                                          <div
                                            key={`${inst.date}-${inst.amount}`}
                                            className="flex justify-between items-baseline text-xs sm:text-sm text-slate-600 py-2 border-b border-slate-200 last:border-b-0"
                                          >
                                            <span>{format(parseISO(inst.date), 'MMM d, yyyy')}</span>
                                            <span className="font-medium text-green-600">
                                              +{formatCurrency(inst.amount)}
                                            </span>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              )
                            })}
                          </AnimatePresence>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showAddIncomeForm && !editingIncome ? (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddIncome}
                    className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200"
                  >
                    <h4 className="text-sm font-medium text-slate-700">Add Income</h4>
                    <input
                      type="text"
                      placeholder="Income name"
                      value={addIncomeName}
                      onChange={(e) => setAddIncomeName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <CurrencyInput
                      value={addIncomeAmount}
                      onValueChange={(v) => setAddIncomeAmount(v ?? '')}
                      placeholder="Amount"
                      prefix="$"
                      decimalsLimit={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Category (optional)</label>
                      <Dropdown
                        value={addIncomeCategory}
                        onChange={setAddIncomeCategory}
                        options={INCOME_CATEGORIES}
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        placeholder="Notes"
                        value={addIncomeNotes}
                        onChange={(e) => setAddIncomeNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-sm text-slate-600">Recurring:</span>
                      <Radio
                        name="income-recurring"
                        value="none"
                        checked={addIncomeRecurring === 'none'}
                        onChange={() => setAddIncomeRecurring('none')}
                      >
                        None
                      </Radio>
                      <Radio
                        name="income-recurring"
                        value="weekly"
                        checked={addIncomeRecurring === 'weekly'}
                        onChange={() => setAddIncomeRecurring('weekly')}
                      >
                        Weekly
                      </Radio>
                      <Radio
                        name="income-recurring"
                        value="monthly"
                        checked={addIncomeRecurring === 'monthly'}
                        onChange={() => setAddIncomeRecurring('monthly')}
                      >
                        Monthly
                      </Radio>
                    </div>
                    {addIncomeRecurring !== 'none' && (
                      <div className="flex flex-wrap gap-3 items-center">
                        <Checkbox
                          checked={addIncomeEndsOn}
                          onChange={setAddIncomeEndsOn}
                        >
                          Ends On
                        </Checkbox>
                        {addIncomeEndsOn && (
                          <input
                            type="date"
                            value={addIncomeEndDate}
                            onChange={(e) => setAddIncomeEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        )}
                      </div>
                    )}
                    {addIncomeError && (
                      <p className="text-sm text-red-600">{addIncomeError}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddIncomeForm(false)
                          setAddIncomeError('')
                        }}
                        className="btn-interactive btn-secondary w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-interactive btn-primary w-full px-3 py-2 rounded-xl bg-emerald-400 text-white text-sm font-medium hover:bg-emerald-500"
                      >
                        Add Income
                      </button>
                    </div>
                  </motion.form>
                ) : !editingIncome ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpense(null)
                        setShowAddForm(false)
                        setEditingIncome(null)
                        setShowAddIncomeForm(true)
                      }}
                      className="btn-interactive btn-secondary w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-medium hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-colors"
                    >
                      + Add Income
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex-shrink-0">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-interactive btn-secondary w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 outline-none transition-colors"
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <Dialog.Root open={editModalOpen} onOpenChange={(open) => {
      if (!open) {
        setEditingExpense(null)
        setEditingIncome(null)
        setEditError('')
        setEditIncomeError('')
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild onOpenAutoFocus={(e) => e.preventDefault()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-slate-200 p-6"
          >
            {editingExpense && (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <Dialog.Title className="text-lg font-semibold text-slate-800">Edit Expense</Dialog.Title>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    id="edit-expense-name"
                    type="text"
                    placeholder="e.g. Car Insurance"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <CurrencyInput
                    id="edit-expense-amount"
                    value={editAmount}
                    onValueChange={(v) => setEditAmount(v ?? '')}
                    placeholder="0.00"
                    prefix="$"
                    decimalsLimit={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category (optional)</label>
                  <Dropdown
                    id="edit-expense-category"
                    value={editCategory}
                    onChange={setEditCategory}
                    options={EXPENSE_CATEGORIES}
                    placeholder="—"
                    aria-label="Category (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea
                    id="edit-expense-notes"
                    rows={2}
                    placeholder="Notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm font-medium text-slate-700">Recurring:</span>
                  <Radio name="edit-recurring" value="none" checked={editRecurring === 'none'} onChange={() => setEditRecurring('none')}>None</Radio>
                  <Radio name="edit-recurring" value="weekly" checked={editRecurring === 'weekly'} onChange={() => setEditRecurring('weekly')}>Weekly</Radio>
                  <Radio name="edit-recurring" value="monthly" checked={editRecurring === 'monthly'} onChange={() => setEditRecurring('monthly')}>Monthly</Radio>
                </div>
                {editRecurring !== 'none' && (
                  <div className="flex flex-wrap gap-3 items-center">
                    <Checkbox checked={editEndsOn} onChange={setEditEndsOn}>Ends On</Checkbox>
                    {editEndsOn && (
                      <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    )}
                  </div>
                )}
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex flex-col gap-2 pt-5">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingExpense(null); setEditError('') }} className="btn-interactive flex-1 px-3 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="btn-interactive btn-primary flex-1 px-3 py-2 rounded-xl bg-sky-400 text-white text-sm font-medium hover:bg-sky-500">Save</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingExpense) {
                        setConfirmState({
                          message: 'Delete this expense? This cannot be undone.',
                          onConfirm: () => {
                            deleteExpense(editingExpense.id)
                            setEditingExpense(null)
                            setEditError('')
                            setRefreshKey((k) => k + 1)
                            onExpenseAdded?.()
                            setConfirmState(null)
                          },
                        })
                      }
                    }}
                    className="btn-interactive w-full px-3 py-2 rounded-xl bg-rose-400 text-white text-sm font-medium hover:bg-rose-500"
                  >
                    Delete expense
                  </button>
                </div>
              </form>
            )}
            {editingIncome && (
              <form onSubmit={handleSaveEditIncome} className="space-y-4">
                <Dialog.Title className="text-lg font-semibold text-slate-800">Edit Income</Dialog.Title>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    id="edit-income-name"
                    type="text"
                    placeholder="e.g. Side Gig"
                    value={editIncomeName}
                    onChange={(e) => setEditIncomeName(e.target.value)}
                    onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <CurrencyInput
                    id="edit-income-amount"
                    value={editIncomeAmount}
                    onValueChange={(v) => setEditIncomeAmount(v ?? '')}
                    placeholder="0.00"
                    prefix="$"
                    decimalsLimit={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category (optional)</label>
                  <Dropdown
                    id="edit-income-category"
                    value={editIncomeCategory}
                    onChange={setEditIncomeCategory}
                    options={INCOME_CATEGORIES}
                    placeholder="—"
                    aria-label="Category (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea
                    id="edit-income-notes"
                    rows={2}
                    placeholder="Notes"
                    value={editIncomeNotes}
                    onChange={(e) => setEditIncomeNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm font-medium text-slate-700">Recurring:</span>
                  <Radio name="edit-income-recurring" value="none" checked={editIncomeRecurring === 'none'} onChange={() => setEditIncomeRecurring('none')}>None</Radio>
                  <Radio name="edit-income-recurring" value="weekly" checked={editIncomeRecurring === 'weekly'} onChange={() => setEditIncomeRecurring('weekly')}>Weekly</Radio>
                  <Radio name="edit-income-recurring" value="monthly" checked={editIncomeRecurring === 'monthly'} onChange={() => setEditIncomeRecurring('monthly')}>Monthly</Radio>
                </div>
                {editIncomeRecurring !== 'none' && (
                  <div className="flex flex-wrap gap-3 items-center">
                    <Checkbox checked={editIncomeEndsOn} onChange={setEditIncomeEndsOn}>Ends On</Checkbox>
                    {editIncomeEndsOn && (
                      <input type="date" value={editIncomeEndDate} onChange={(e) => setEditIncomeEndDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    )}
                  </div>
                )}
                {editIncomeError && <p className="text-sm text-red-600">{editIncomeError}</p>}
                <div className="flex flex-col gap-2 pt-5">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingIncome(null); setEditIncomeError('') }} className="btn-interactive flex-1 px-3 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="btn-interactive btn-primary flex-1 px-3 py-2 rounded-xl bg-emerald-400 text-white text-sm font-medium hover:bg-emerald-500">Save</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingIncome) {
                        setConfirmState({
                          message: 'Delete this income? This cannot be undone.',
                          onConfirm: () => {
                            deleteIncome(editingIncome.id)
                            setEditingIncome(null)
                            setEditIncomeError('')
                            setRefreshKey((k) => k + 1)
                            onExpenseAdded?.()
                            setConfirmState(null)
                          },
                        })
                      }
                    }}
                    className="btn-interactive w-full px-3 py-2 rounded-xl bg-rose-400 text-white text-sm font-medium hover:bg-rose-500"
                  >
                    Delete income
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <ConfirmModal
      open={!!confirmState}
      title="Confirm"
      message={confirmState?.message ?? ''}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={() => {
        confirmState?.onConfirm()
      }}
      onCancel={() => setConfirmState(null)}
    />
    </>
  )
}
