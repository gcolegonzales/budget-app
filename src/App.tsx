import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getSettings, clearAllData, loadBudgetFromStorage, saveBudgetToStorage } from './lib/state'
import BalanceScreen from './components/BalanceScreen'
import PayrollSetup from './components/PayrollSetup'
import CalendarView from './components/CalendarView'
import Dashboard from './components/Dashboard'
import BudgetBoiBranding from './components/BudgetBoiBranding'
import { ToastProvider } from './contexts/ToastContext'

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

function NewBudgetFlow() {
  const [step, setStep] = useState<'balance' | 'payroll'>('balance')
  const navigate = useNavigate()

  useEffect(() => {
    const settings = getSettings()
    if (!settings) {
      setStep('balance')
      return
    }
    const hasPayroll =
      settings.payroll?.firstDate && settings.payroll.amountPerPaycheck > 0
    setStep(hasPayroll ? 'payroll' : 'balance')
  }, [])

  const handleBalanceDone = () => setStep('payroll')
  const handlePayrollDone = () => {
    const name = `New budget ${new Date().toISOString().slice(0, 10)}`
    const id = saveBudgetToStorage(name)
    navigate(`/budget/${id}`, { replace: true })
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'balance' && (
        <motion.div
          key="balance"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          <BalanceScreen onDone={handleBalanceDone} />
        </motion.div>
      )}
      {step === 'payroll' && (
        <motion.div
          key="payroll"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          <PayrollSetup onDone={handlePayrollDone} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BudgetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id) {
      setFailed(true)
      return
    }
    try {
      loadBudgetFromStorage(id)
      setReady(true)
    } catch {
      setFailed(true)
    }
  }, [id])

  useEffect(() => {
    if (failed) navigate('/', { replace: true })
  }, [failed, navigate])

  if (!ready || !id) return null

  return (
    <motion.div
      key="calendar"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="w-full min-w-0"
    >
      <CalendarView
        onStartOver={() => {
          clearAllData()
          navigate('/new', { replace: true })
        }}
        onGoToDashboard={() => navigate('/')}
        onNewBudget={() => {
          clearAllData()
          navigate('/new', { replace: true })
        }}
      />
    </motion.div>
  )
}

function DashboardRoute() {
  const navigate = useNavigate()
  return (
    <motion.div
      key="dashboard"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="w-full min-w-0"
    >
      <Dashboard
        onNewBudget={() => {
          clearAllData()
          navigate('/new')
        }}
        onOpenBudget={(budgetId) => navigate(`/budget/${budgetId}`)}
        onImportSuccess={(budgetId) => navigate(`/budget/${budgetId}`)}
      />
    </motion.div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/budget-app' : '/'}>
      <ToastProvider>
        <div className="min-h-screen min-h-dvh w-full max-w-full bg-gradient-to-b from-slate-100 to-slate-50 text-slate-900 flex flex-col md:justify-center md:items-center app-edge-padding overflow-x-hidden">
          <main className="w-full max-w-[90rem] mx-auto flex-1 min-w-0 pb-safe pt-4 pb-14 sm:pt-5 sm:pb-20 md:pt-6 md:pb-[5.5rem] lg:pt-8 lg:pb-[180px] overflow-x-hidden">
            <Routes>
              <Route path="/" element={<DashboardRoute />} />
              <Route path="/new" element={<NewBudgetFlow />} />
              <Route path="/budget/:id" element={<BudgetPage />} />
            </Routes>
          </main>
          <footer className="w-full flex-shrink-0 border-t border-slate-200 bg-slate-100/80">
            <div className="w-full max-w-[90rem] mx-auto py-8 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-slate-600 text-sm">
              <Link to="/" className="inline-flex items-center [&>svg]:h-6 hover:text-slate-800 transition-colors" aria-label="BudgetBoi home">
                <BudgetBoiBranding variant="compact" />
              </Link>
              <span className="hidden sm:inline" aria-hidden>·</span>
              <span>© {new Date().getFullYear()} BudgetBoi</span>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
