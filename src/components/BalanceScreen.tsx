import { useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import CurrencyInput from 'react-currency-input-field'
import { getSettings, saveSettings } from '../lib/state'
import { parseCurrencyInput } from '../lib/currency'

interface BalanceScreenProps {
  onDone: () => void
}

const DEFAULT_START_DATE = format(new Date(), 'yyyy-MM-dd')

export default function BalanceScreen({ onDone }: BalanceScreenProps) {
  const [value, setValue] = useState('')
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(value)
    if (amount <= 0) {
      setError('Please enter a valid balance.')
      return
    }
    const existing = getSettings()
    saveSettings({
      initialBalance: amount,
      startDate,
      payroll: existing?.payroll ?? {
        firstDate: startDate,
        frequency: 'every2weeks',
        amountPerPaycheck: 0,
      },
    })
    setError('')
    onDone()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-2xl bg-white/95 border border-slate-200/80 shadow-lg shadow-slate-200/40 p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Enter Current Balance
        </h1>
        <p className="text-slate-600 mb-5 text-sm">
          Amount in the bank as of your budget start date. We’ll use it to project balance with expenses and paydays.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <p className="mt-1 text-xs text-slate-500">
              Earliest date you can navigate to in this budget.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Balance as of that date
            </label>
            <CurrencyInput
              id="balance"
              name="balance"
              value={value}
              onValueChange={(v) => {
                setValue(v ?? '')
                setError('')
              }}
              placeholder="0.00"
              prefix="$"
              decimalsLimit={2}
              allowNegativeValue={false}
              className="w-full text-2xl font-medium rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              aria-invalid={!!error}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn-interactive btn-primary w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </motion.div>
  )
}
