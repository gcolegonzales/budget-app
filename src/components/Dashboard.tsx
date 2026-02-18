import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  listSavedBudgets,
  loadBudgetFromStorage,
  deleteBudgetFromStorage,
  importBudgetFromJson,
  saveBudgetToStorage,
  updateBudgetInStorage,
  getSettings,
  saveSettings,
  exportBudgetToJson,
  getBudgetStartDate,
} from "../lib/state";
import { parseCurrencyInput } from "../lib/currency";
import BudgetBoiBranding from "./BudgetBoiBranding";
import Radio from "./Radio";
import { useToast } from "../contexts/ToastContext";
import CurrencyInput from "react-currency-input-field";

function ImportBudgetModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (budgetId: string) => void;
  onError: (message: string) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.name.toLowerCase().endsWith(".json")) {
      setFile(dropped);
      setModalError(null);
    } else if (dropped) {
      setModalError("Please select a .json budget file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setModalError(null);
    }
    e.target.value = "";
  };

  const handleImport = async () => {
    setModalError(null);
    const budgetName = name.trim() || "Imported budget";
    if (!file) {
      setModalError("Please select a budget file to import.");
      return;
    }
    try {
      const text = await file.text();
      importBudgetFromJson(text);
      const budgetId = saveBudgetToStorage(budgetName);
      onSuccess(budgetId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or corrupted budget file.";
      setModalError(message);
      onError(message);
      if (err instanceof SyntaxError) {
        showToast("Invalid JSON file.");
      }
    }
  };

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
          <h3 className="text-lg font-semibold text-slate-800">
            Import budget
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
        <div className="p-4 flex flex-col gap-4">
          {modalError && (
            <p className="text-sm text-red-600" role="alert">
              {modalError}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name this budget
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Imported budget"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-sky-400 bg-sky-50/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {file ? (
                <p className="text-sm font-medium text-slate-700">{file.name}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Drop a .json file here or click to browse
                </p>
              )}
            </div>
          </div>
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
            onClick={handleImport}
            className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl bg-sky-400 text-white hover:bg-sky-500"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function EditBudgetModal({
  budgetId,
  onClose,
  onSaved,
}: {
  budgetId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const settings = getSettings();
  const meta = listSavedBudgets().find((b) => b.id === budgetId);
  const minPayDate = settings?.startDate ?? format(getBudgetStartDate(), "yyyy-MM-dd");

  const [name, setName] = useState(meta?.name ?? "Budget");
  const [initialBalance, setInitialBalance] = useState(
    settings?.initialBalance != null ? String(settings.initialBalance) : ""
  );
  const [startDate, setStartDate] = useState(settings?.startDate ?? "2025-02-16");
  const [firstDate, setFirstDate] = useState(settings?.payroll?.firstDate ?? minPayDate);
  const [frequency, setFrequency] = useState<"monthly" | "every2weeks">(
    settings?.payroll?.frequency ?? "every2weeks"
  );
  const [amountValue, setAmountValue] = useState(
    settings?.payroll?.amountPerPaycheck != null
      ? String(settings.payroll.amountPerPaycheck)
      : ""
  );
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(amountValue);
    if (amount <= 0) {
      setError("Please enter a valid paycheck amount.");
      return
    }
    if (!settings) return;
    saveSettings({
      ...settings,
      initialBalance: parseCurrencyInput(initialBalance) || settings.initialBalance,
      startDate,
      payroll: {
        firstDate,
        frequency,
        amountPerPaycheck: amount,
      },
    });
    const json = exportBudgetToJson();
    updateBudgetInStorage(budgetId, { name: (name.trim() || meta?.name) ?? "Budget", data: json });
    setError("");
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Edit budget</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial balance</label>
            <CurrencyInput
              value={initialBalance}
              onValueChange={(v) => setInitialBalance(v ?? "")}
              placeholder="0.00"
              prefix="$"
              decimalsLimit={2}
              allowNegativeValue={false}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First payday</label>
            <input
              type="date"
              value={firstDate}
              onChange={(e) => setFirstDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Frequency</span>
            <div className="flex gap-3 flex-wrap">
              <Radio
                name="edit-frequency"
                value="every2weeks"
                checked={frequency === "every2weeks"}
                onChange={() => setFrequency("every2weeks")}
              >
                Every 2 weeks
              </Radio>
              <Radio
                name="edit-frequency"
                value="monthly"
                checked={frequency === "monthly"}
                onChange={() => setFrequency("monthly")}
              >
                Monthly
              </Radio>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount per paycheck</label>
            <CurrencyInput
              value={amountValue}
              onValueChange={(v) => setAmountValue(v ?? "")}
              placeholder="0.00"
              prefix="$"
              decimalsLimit={2}
              allowNegativeValue={false}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl bg-sky-400 text-white hover:bg-sky-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DashboardProps {
  onNewBudget: () => void;
  onOpenBudget: (budgetId: string) => void;
  onImportSuccess?: (budgetId: string) => void;
}

export default function Dashboard({
  onNewBudget,
  onOpenBudget,
  onImportSuccess,
}: DashboardProps) {
  const [savedListKey, setSavedListKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const saved = listSavedBudgets();

  const handleOpen = (id: string) => {
    setError(null);
    onOpenBudget(id);
  };

  const handleEdit = (id: string) => {
    setError(null);
    try {
      loadBudgetFromStorage(id);
      setEditingBudgetId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget");
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirming({ id, name });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirming) return;
    setError(null);
    try {
      deleteBudgetFromStorage(deleteConfirming.id);
      setSavedListKey((k) => k + 1);
      setDeleteConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirming(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center">
          <BudgetBoiBranding variant="full" />
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="btn-interactive text-sm font-medium py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Import budget
          </button>
          <button
            type="button"
            onClick={onNewBudget}
            className="btn-interactive text-sm font-medium py-2.5 px-4 rounded-xl bg-violet-500 text-white hover:bg-violet-600"
          >
            New Budget
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 p-6 shadow-xl shadow-slate-200/50">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Your budgets
        </h2>
        {error && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {error}
          </p>
        )}
        {saved.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No saved budgets yet. Open a budget from the calendar view and save
            it, or start a new budget.
          </p>
        ) : (
          <ul className="space-y-3" key={savedListKey}>
            {saved.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <p className="font-medium text-slate-800 truncate min-w-0 order-1">
                  {b.name}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 order-2 sm:flex-nowrap sm:flex-shrink-0 sm:justify-end">
                  <p className="text-xs text-slate-500">
                    {format(new Date(b.savedAt), "MMM d, yyyy HH:mm")}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpen(b.id)}
                      className="btn-interactive px-3 py-1.5 text-sm font-medium rounded-xl bg-sky-400 text-white hover:bg-sky-500"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(b.id)}
                      className="btn-interactive px-3 py-1.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                      aria-label={`Edit ${b.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(b.id, b.name)}
                      className="btn-interactive px-3 py-1.5 text-sm font-medium rounded-xl border border-slate-200 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${b.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showImportModal && (
        <ImportBudgetModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(budgetId) => {
            setShowImportModal(false);
            setSavedListKey((k) => k + 1);
            setError(null);
            onImportSuccess?.(budgetId);
          }}
          onError={(message) => setError(message)}
        />
      )}

      {editingBudgetId && (
        <EditBudgetModal
          budgetId={editingBudgetId}
          onClose={() => setEditingBudgetId(null)}
          onSaved={() => setSavedListKey((k) => k + 1)}
        />
      )}

      {deleteConfirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Delete budget?
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Are you sure you want to delete &quot;{deleteConfirming.name}&quot;?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn-interactive px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
