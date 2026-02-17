import { useState, useCallback, useRef, useEffect } from "react";
import Calendar from "react-calendar";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  endOfYear,
  startOfYear,
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from "date-fns";
import {
  getAmountSpentInMonth,
  getMonthlyIncome,
  getIncomeInMonth,
  getLowestBalanceInMonth,
  getExportRowsForRange,
  getMonthsTrackedCount,
  getTotalIncomeFromStart,
  getTotalSpentFromStart,
  listSavedBudgets,
  saveBudgetToStorage,
  loadBudgetFromStorage,
  deleteBudgetFromStorage,
  isPayrollDate,
  getExpenseCountOnDate,
  getIncomeCountOnDate,
  getSpendingByNameForMonth,
  getBalanceSeriesForMonth,
  getBudgetStartDate,
} from "../lib/state";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../lib/currency";
import DateModal from "./DateModal";
import ArrowNavigation from "./ArrowNavigation";
import ModularCalendarCard from "./ModularCalendarCard";
import BudgetBoiBranding from "./BudgetBoiBranding";

function LoadBudgetModal({
  onClose,
  onLoad,
  onDeleteRequest,
  error,
}: {
  onClose: () => void;
  onLoad: (id: string) => void;
  onDeleteRequest: (id: string, name: string) => void;
  error: string | null;
}) {
  const saved = listSavedBudgets();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">
            Saved budgets
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <p className="text-sm text-red-600 mb-3" role="alert">
              {error}
            </p>
          )}
          {saved.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No saved budgets. Save the current budget to see it here.
            </p>
          ) : (
            <ul className="space-y-2">
              {saved.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">
                      {b.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(b.savedAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onLoad(b.id)}
                      className="btn-interactive px-3 py-1.5 text-sm font-medium rounded-xl bg-sky-400 text-white hover:bg-sky-500"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(b.id, b.name)}
                      className="btn-interactive px-3 py-1.5 text-sm font-medium rounded-xl border border-slate-200 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${b.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveBudgetModal({
  onClose,
  onSave,
  error,
  defaultName,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
  error: string | null;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Save budget</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <label className="text-sm font-medium text-slate-700">
            Name this budget
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Budget 2026-02-16"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            autoFocus
          />
        </div>
        <div className="p-4 pt-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(name.trim() || defaultName)}
            className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl bg-sky-400 text-white hover:bg-sky-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({
  label,
  tooltip,
  children,
  className = "",
  valueClassName = "",
}: {
  label: string;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={`flex-1 min-w-0 flex flex-col rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-5 shadow-lg shadow-slate-200/50 ${className}`}
    >
      <div className="flex items-start justify-between gap-1 mb-0.5 flex-shrink-0">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 min-w-0">
          {label}
        </p>
        <span
          className="relative flex-shrink-0 group/tt inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-600"
          aria-label={tooltip}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full right-0 mb-1 w-48 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover/tt:opacity-100 z-10 text-left font-normal normal-case"
          >
            {tooltip}
          </span>
        </span>
      </div>
      <div className={`flex-1 flex flex-col justify-end min-h-0 ${valueClassName}`}>
        {children}
      </div>
    </div>
  );
}

const CHART_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ef4444",
  "#84cc16",
];

function SpendingPieChart({ month }: { month: Date }) {
  const data = getSpendingByNameForMonth(month);
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No spending in this month
      </p>
    );
  }
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.amount,
  }));
  const legendFormatter = (value: string) => {
    const item = chartData.find((d) => d.name === value);
    const total = chartData.reduce((s, d) => s + d.value, 0);
    const pct =
      item && total > 0 ? ((item.value / total) * 100).toFixed(0) : "";
    return (
      <span style={{ padding: "5px" }} className="text-slate-700 text-sm">
        {value}
        {pct && <span className="text-slate-500 ml-1">({pct}%)</span>}
      </span>
    );
  };
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            animationDuration={250}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value: number | undefined) =>
              formatCurrency(value ?? 0)
            }
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="top"
            align="center"
            formatter={legendFormatter}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BalanceLineChart({ month }: { month: Date }) {
  const data = getBalanceSeriesForMonth(month);
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No balance data for this month
      </p>
    );
  }
  return (
    <div className="h-[220px] sm:h-[260px] md:h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
          />
          <RechartsTooltip
            formatter={(value: number | undefined) =>
              formatCurrency(value ?? 0)
            }
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            animationDuration={250}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CalendarViewProps {
  onStartOver?: () => void;
  onGoToDashboard?: () => void;
  onNewBudget?: () => void;
}

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth();
const YEARS_PER_PAGE = 12;

function getInitialViewDate(): Date {
  const min = startOfMonth(getBudgetStartDate());
  const thisMonth = startOfMonth(TODAY);
  return thisMonth >= min ? thisMonth : min;
}
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2000, i, 1), "MMMM"),
);

function blurActiveElement() {
  if (
    typeof document !== "undefined" &&
    document.activeElement instanceof HTMLElement
  ) {
    document.activeElement.blur();
  }
}

export default function CalendarView({
  onStartOver,
  onGoToDashboard,
  onNewBudget,
}: CalendarViewProps) {
  const minDate = startOfMonth(getBudgetStartDate());
  const [viewDate, setViewDate] = useState(getInitialViewDate);
  const budgetStartYear = getBudgetStartDate().getFullYear();
  const [viewMode, setViewMode] = useState<
    "month" | "month-picker" | "year-picker"
  >("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string | null>(null);
  const [savedListKey, setSavedListKey] = useState(0);
  const [pendingDeleteBudget, setPendingDeleteBudget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);
  const exportPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportPopoverRef.current &&
        !exportPopoverRef.current.contains(e.target as Node)
      ) {
        setExportPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportPopoverOpen]);

  const minViewMonth = minDate;
  const onActiveStartDateChange = useCallback(
    (args: { activeStartDate: Date | null; view: string }) => {
      if (!args.activeStartDate || args.view !== "month") return;
      if (args.activeStartDate >= minViewMonth) {
        setViewDate(args.activeStartDate);
      }
      if (
        typeof document !== "undefined" &&
        document.activeElement?.matches?.("button")
      ) {
        (document.activeElement as HTMLElement).blur();
      }
    },
    [minViewMonth],
  );

  const monthlyIncome = getMonthlyIncome();
  const amountSpentThisMonth = getAmountSpentInMonth(viewDate);
  const averageSavingsMonthly = monthlyIncome - amountSpentThisMonth;
  const incomeThisMonth = getIncomeInMonth(viewDate);
  const netThisMonth = incomeThisMonth - amountSpentThisMonth;
  const lowestBalanceThisMonth = getLowestBalanceInMonth(viewDate);
  const monthsTracked = getMonthsTrackedCount(viewDate);
  const totalIncomeAllTime = getTotalIncomeFromStart(viewDate);
  const totalSpentAllTime = getTotalSpentFromStart(viewDate);
  const averageNetPerMonth =
    monthsTracked > 0
      ? (totalIncomeAllTime - totalSpentAllTime) / monthsTracked
      : 0;
  const savingsRateThisMonth =
    incomeThisMonth > 0 ? (netThisMonth / incomeThisMonth) * 100 : null;

  const tileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const isPay = isPayrollDate(date);
      const expenseCount = getExpenseCountOnDate(date);
      const incomeCount = getIncomeCountOnDate(date);
      if (!isPay && expenseCount === 0 && incomeCount === 0) return null;
      return (
        <span className="calendar-tile-badges">
          {isPay && (
            <span className="calendar-tile-badge calendar-tile-payday">
              PAY DAY
            </span>
          )}
          {expenseCount > 0 && (
            <span className="calendar-tile-badge calendar-tile-expense">
              EXPENSE {expenseCount}
            </span>
          )}
          {incomeCount > 0 && (
            <span className="calendar-tile-badge calendar-tile-income">
              INCOME {incomeCount}
            </span>
          )}
        </span>
      );
    },
    [],
  );

  const handleExportMonth = useCallback(() => {
    const from = startOfMonth(viewDate);
    const to = endOfMonth(viewDate);
    const rows = getExportRowsForRange(from, to);
    const header = "Date,Name,Type,Amount";
    const lines = [
      header,
      ...rows.map(
        (r) => `${r.date},${escapeCsv(r.name)},${r.type},${r.amount}`,
      ),
    ];
    const csv = lines.join("\n");
    downloadCsv(csv, `budget-${format(viewDate, "yyyy-MM")}.csv`);
  }, [viewDate]);

  const handleExportYear = useCallback(() => {
    const from = startOfYear(viewDate);
    const to = endOfYear(viewDate);
    const rows = getExportRowsForRange(from, to);
    const header = "Date,Name,Type,Amount";
    const lines = [
      header,
      ...rows.map(
        (r) => `${r.date},${escapeCsv(r.name)},${r.type},${r.amount}`,
      ),
    ];
    const csv = lines.join("\n");
    downloadCsv(csv, `budget-${format(viewDate, "yyyy")}.csv`);
  }, [viewDate]);

  const handleOpenSaveModal = useCallback(() => {
    setSaveLoadError(null);
    setShowSaveModal(true);
  }, []);

  const handleSaveBudget = useCallback((name: string) => {
    try {
      saveBudgetToStorage(name);
      setSavedListKey((k) => k + 1);
      setShowSaveModal(false);
    } catch (err) {
      setSaveLoadError(err instanceof Error ? err.message : "Failed to save");
    }
  }, []);

  const handleOpenLoadModal = useCallback(() => {
    setSaveLoadError(null);
    setShowLoadModal(true);
  }, []);

  const handleLoadBudget = useCallback((id: string) => {
    try {
      loadBudgetFromStorage(id);
      window.location.reload();
    } catch (err) {
      setSaveLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  const handleDeleteSavedBudget = useCallback((id: string) => {
    try {
      deleteBudgetFromStorage(id);
      setSavedListKey((k) => k + 1);
    } catch (err) {
      setSaveLoadError(err instanceof Error ? err.message : "Failed to delete");
    }
  }, []);

  const handleDeleteBudgetRequest = useCallback((id: string, name: string) => {
    setPendingDeleteBudget({ id, name });
  }, []);

  const handleDeleteBudgetConfirm = useCallback(() => {
    if (!pendingDeleteBudget) return;
    handleDeleteSavedBudget(pendingDeleteBudget.id);
    setPendingDeleteBudget(null);
  }, [pendingDeleteBudget, handleDeleteSavedBudget]);

  return (
    <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 order-1">
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="btn-interactive text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border border-slate-200 hover:bg-slate-50"
              aria-label="Back to dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-[18px] sm:h-[18px]"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 order-2">
          <BudgetBoiBranding
            variant="compact"
            className="mr-0.5 sm:mr-1 [&>svg]:h-6 sm:[&>svg]:h-[32px]"
          />
          {onNewBudget && (
            <button
              type="button"
              onClick={onNewBudget}
              className="btn-interactive text-xs sm:text-sm font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-violet-500 text-white hover:bg-violet-600"
            >
              New Budget
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="btn-interactive text-xs sm:text-sm font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-sky-400 text-white hover:bg-sky-500"
          >
            Save budget
          </button>
          <button
            type="button"
            onClick={handleOpenLoadModal}
            className="btn-interactive text-xs sm:text-sm font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-emerald-400 text-white hover:bg-emerald-500"
          >
            Load budget
          </button>
          <div className="relative" ref={exportPopoverRef}>
            <button
              type="button"
              onClick={() => setExportPopoverOpen((o) => !o)}
              className="btn-interactive text-xs sm:text-sm font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-violet-400 text-white hover:bg-violet-500 inline-flex items-center gap-1 sm:gap-1.5"
              aria-expanded={exportPopoverOpen}
              aria-haspopup="true"
            >
              Export
              <svg
                className={`w-4 h-4 transition-transform ${exportPopoverOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {exportPopoverOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    handleExportMonth();
                    setExportPopoverOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-800 rounded-xl"
                >
                  Export This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportYear();
                    setExportPopoverOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-800 rounded-xl"
                >
                  Export This Year
                </button>
              </div>
            )}
          </div>
          {onStartOver && (
            <button
              type="button"
              onClick={onStartOver}
              className="btn-interactive text-xs sm:text-sm text-slate-500 hover:text-slate-700 font-medium underline underline-offset-2 transition-colors py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl"
            >
              Start Over
            </button>
          )}
        </div>
      </div>
      {saveLoadError && (
        <p className="text-sm text-red-600 text-right" role="alert">
          {saveLoadError}
        </p>
      )}
      {showLoadModal && (
        <LoadBudgetModal
          key={savedListKey}
          onClose={() => {
            setShowLoadModal(false);
            setSaveLoadError(null);
          }}
          onLoad={handleLoadBudget}
          onDeleteRequest={handleDeleteBudgetRequest}
          error={saveLoadError}
        />
      )}
      {pendingDeleteBudget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setPendingDeleteBudget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Delete budget?
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Are you sure you want to delete &quot;{pendingDeleteBudget.name}&quot;?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteBudget(null)}
                className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBudgetConfirm}
                className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showSaveModal && (
        <SaveBudgetModal
          onClose={() => {
            setShowSaveModal(false);
            setSaveLoadError(null);
          }}
          onSave={handleSaveBudget}
          error={saveLoadError}
          defaultName={`Budget ${format(new Date(), "yyyy-MM-dd")}`}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Income this month"
            tooltip="Total paychecks and any one-off income in the selected month."
            valueClassName="text-xl sm:text-2xl font-bold text-green-600 tabular-nums"
          >
            {formatCurrency(incomeThisMonth)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Spent this month"
            tooltip="Total expenses in the selected month."
            valueClassName="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums"
          >
            {formatCurrency(amountSpentThisMonth)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Net this month"
            tooltip="Income minus expenses for this month. Positive = surplus, negative = shortfall."
            valueClassName={`text-xl sm:text-2xl font-bold tabular-nums ${
              netThisMonth > 0
                ? "text-green-600"
                : netThisMonth < 0
                  ? "text-red-600"
                  : "text-slate-600"
            }`}
          >
            {formatCurrency(netThisMonth)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Lowest balance this month"
            tooltip="The lowest your balance reached during this month. Helps you avoid overdrafts."
            valueClassName={`text-xl sm:text-2xl font-bold tabular-nums ${
              lowestBalanceThisMonth < 0 ? "text-amber-600" : "text-slate-800"
            }`}
          >
            {formatCurrency(lowestBalanceThisMonth)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Income per month (budgeted)"
            tooltip="Your expected monthly income from payroll, as set in setup. Used for planning."
            valueClassName="text-xl sm:text-2xl font-bold text-green-600 tabular-nums"
          >
            {formatCurrency(monthlyIncome)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Expected savings this month"
            tooltip="If you earn your budgeted income and spend what you did this month, this would be your savings."
            valueClassName="text-xl sm:text-2xl font-bold text-green-600 tabular-nums"
          >
            {formatCurrency(Math.max(0, averageSavingsMonthly))}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Average net per month"
            tooltip="Your average monthly surplus or shortfall since budget start (total income minus total expenses, divided by months tracked)."
            valueClassName={`text-xl sm:text-2xl font-bold tabular-nums ${
              averageNetPerMonth > 0
                ? "text-green-600"
                : averageNetPerMonth < 0
                  ? "text-red-600"
                  : "text-slate-600"
            }`}
          >
            {formatCurrency(averageNetPerMonth)}
          </StatCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="min-h-0 flex"
        >
          <StatCard
            label="Savings rate this month"
            tooltip="Percent of this month's income that you didn't spend (saved or surplus). Only meaningful when you had income."
            valueClassName={`text-xl sm:text-2xl font-bold tabular-nums ${
              savingsRateThisMonth === null
                ? "text-slate-500"
                : savingsRateThisMonth >= 0
                  ? "text-green-600"
                  : "text-red-600"
            }`}
          >
            {savingsRateThisMonth === null
              ? "—"
              : `${savingsRateThisMonth.toFixed(1)}%`}
          </StatCard>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full"
      >
        <div className="flex justify-center mb-1 min-h-[1.25rem]">
          <button
            type="button"
            onClick={() => {
              const thisMonth = startOfMonth(new Date());
              setViewDate(thisMonth >= minDate ? thisMonth : minDate);
              setViewMode("month");
            }}
            className="text-[11px] uppercase tracking-wider text-slate-400 hover:text-slate-600 font-medium transition-colors"
            aria-label="Go to today’s month"
          >
            TODAY
          </button>
        </div>
        {viewMode === "month" ? (
          <ModularCalendarCard
            className="rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl shadow-slate-200/50 calendar-card relative"
            header={
              <ArrowNavigation
                onPrev={() => setViewDate((d) => startOfMonth(subMonths(d, 1)))}
                onNext={() => setViewDate((d) => startOfMonth(addMonths(d, 1)))}
                onCenterClick={() => {
                  setViewMode("month-picker");
                  blurActiveElement();
                }}
                prevDisabled={viewDate.getTime() <= minDate.getTime()}
                prevAriaLabel="Previous month"
                nextAriaLabel="Next month"
                centerAriaLabel="Choose month"
              >
                {format(viewDate, "MMMM yyyy")}
              </ArrowNavigation>
            }
            body={
              <Calendar
                key={selectedDate === null ? "no-selection" : "has-selection"}
                calendarType="gregory"
                value={selectedDate ?? undefined}
                onActiveStartDateChange={onActiveStartDateChange}
                activeStartDate={viewDate}
                minDate={minDate}
                maxDetail="month"
                minDetail="month"
                showNeighboringMonth={true}
                next2Label={null}
                prev2Label={null}
                onClickDay={(date) => setSelectedDate(date)}
                tileContent={tileContent}
                navigationLabel={({ date }) => format(date, "MMMM yyyy")}
                className="react-calendar-custom w-full"
              />
            }
          />
        ) : viewMode === "month-picker" ? (
          <ModularCalendarCard
            className="rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl shadow-slate-200/50 calendar-card relative"
            header={
              <ArrowNavigation
                onPrev={() => setViewDate((d) => startOfYear(subYears(d, 1)))}
                onNext={() => setViewDate((d) => startOfYear(addYears(d, 1)))}
                onCenterClick={() => {
                  setViewMode("year-picker");
                  blurActiveElement();
                }}
                prevDisabled={viewDate.getFullYear() <= budgetStartYear}
                prevAriaLabel="Previous year"
                nextAriaLabel="Next year"
                centerAriaLabel="Choose year"
              >
                {String(viewDate.getFullYear())}
              </ArrowNavigation>
            }
            body={
              <div className="month-grid">
                {MONTH_NAMES.map((name, i) => {
                  const isCurrentMonth =
                    viewDate.getFullYear() === CURRENT_YEAR &&
                    i === CURRENT_MONTH;
                  const monthStart = startOfMonth(new Date(viewDate.getFullYear(), i, 1));
                  const isBeforeBudgetStart = monthStart < minDate;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={isBeforeBudgetStart}
                      onClick={() => {
                        setViewDate(monthStart);
                        setViewMode("month");
                      }}
                      className={`month-grid__tile ${isCurrentMonth ? "month-grid__tile--current" : ""} ${isBeforeBudgetStart ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            }
          />
        ) : (
          <ModularCalendarCard
            className="rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xl shadow-slate-200/50 calendar-card relative"
            header={
              <ArrowNavigation
                onPrev={() => setViewDate((d) => startOfYear(subYears(d, 1)))}
                onNext={() => setViewDate((d) => startOfYear(addYears(d, 1)))}
                prevDisabled={viewDate.getFullYear() <= budgetStartYear}
                prevAriaLabel="Previous year"
                nextAriaLabel="Next year"
              >
                {String(viewDate.getFullYear())}
              </ArrowNavigation>
            }
            body={
              <div className="year-grid">
                {Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
                  const year = viewDate.getFullYear() + i;
                  const isCurrentYear = year === CURRENT_YEAR;
                  const isBeforeBudgetStart = year < budgetStartYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={isBeforeBudgetStart}
                      onClick={() => {
                        setViewDate(startOfYear(new Date(year, 0, 1)));
                        setViewMode("month-picker");
                      }}
                      className={`year-grid__tile ${isCurrentYear ? "year-grid__tile--current" : ""} ${isBeforeBudgetStart ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            }
          />
        )}
      </motion.div>

      {viewMode === "month" && (
        <section className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col items-center min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 text-center w-full">
              Spending By Purchase ({format(viewDate, "MMMM yyyy")})
            </h3>
            <div className="w-full flex justify-center max-w-xl mx-auto min-w-0">
              <SpendingPieChart month={viewDate} />
            </div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col items-center min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 text-center w-full">
              Balance Over Time ({format(viewDate, "MMMM yyyy")})
            </h3>
            <div className="w-full flex justify-center max-w-full mx-auto pr-4 sm:pr-10 md:pr-12 min-w-0">
              <BalanceLineChart month={viewDate} />
            </div>
          </div>
        </section>
      )}

      {selectedDate && (
        <DateModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onExpenseAdded={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
