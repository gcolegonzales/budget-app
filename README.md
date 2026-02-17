# BudgetBoi

A personal budget app: track balance, payroll, expenses, and income by month. Create multiple budgets, import/export JSON, and navigate by calendar with a configurable start date. See how much money you should have on any given day.

## Tech

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS**, **Framer Motion**, **Recharts**, **react-calendar**
- **React Router** for `/`, `/new`, and `/budget/:id`
- Budget data is stored in the browser (localStorage); no backend.

## Scripts

- **`npm run dev`** — Start dev server (default: http://localhost:5173)
- **`npm run build`** — TypeScript check + production build
- **`npm run preview`** — Serve the production build locally

## Data

Budget data (settings, expenses, incomes, saved budgets) lives only in your browser’s localStorage for the app’s origin. It is not in source control. Use **Import budget** / **Export** in the app to back up or move data.

## Routes

- **`/`** — Dashboard: list budgets, import, or create a new one
- **`/new`** — New budget flow: balance + start date, then payroll
- **`/budget/:id`** — Calendar view for that budget (e.g. `/budget/1`)
