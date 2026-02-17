import { useState } from 'react'
import { motion } from 'framer-motion'
import CurrencyInput from 'react-currency-input-field'
import { getSettings, saveSettings, getBudgetStartDate } from '../lib/state'
import { parseCurrencyInput } from '../lib/currency'
import Radio from './Radio'
import { format } from 'date-fns'

interface PayrollSetupProps {
  onDone: () => void
}

export default function PayrollSetup({ onDone }: PayrollSetupProps) {
  const settings = getSettings()
  const minPayDate = format(getBudgetStartDate(), 'yyyy-MM-dd')
  const defaultFirst = settings?.payroll?.firstDate ?? minPayDate
  const [firstDate, setFirstDate] = useState(defaultFirst)
  const [frequency, setFrequency] = useState<'monthly' | 'every2weeks'>(
    settings?.payroll?.frequency ?? 'every2weeks'
  )
  const [amountValue, setAmountValue] = useState(
    settings?.payroll?.amountPerPaycheck
      ? String(settings.payroll.amountPerPaycheck)
      : ''
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(amountValue)
    if (amount <= 0) {
      setError('Please enter a valid paycheck amount.')
      return
    }
    if (!settings) {
      setError('Please set your balance first.')
      return
    }
    saveSettings({
      ...settings,
      payroll: {
        firstDate,
        frequency,
        amountPerPaycheck: amount,
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
          Set Payroll
        </h1>
        <p className="text-slate-600 mb-5 text-sm">
          We’ll add this amount to your balance on each payday and use it to estimate monthly income and savings.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              First payday
            </label>
            <input
              id="firstDate"
              type="date"
              value={firstDate}
              onChange={(e) => setFirstDate(e.target.value)}
              min={minPayDate}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Frequency
            </span>
            <div className="flex gap-3 flex-wrap">
              <Radio
                name="frequency"
                value="every2weeks"
                checked={frequency === 'every2weeks'}
                onChange={() => setFrequency('every2weeks')}
              >
                Every 2 weeks
              </Radio>
              <Radio
                name="frequency"
                value="monthly"
                checked={frequency === 'monthly'}
                onChange={() => setFrequency('monthly')}
              >
                Monthly
              </Radio>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount per paycheck
            </label>
            <CurrencyInput
              id="amount"
              value={amountValue}
              onValueChange={(v) => {
                setAmountValue(v ?? '')
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
            Continue to Calendar
          </button>
        </form>
      </div>
    </motion.div>
  )
}
