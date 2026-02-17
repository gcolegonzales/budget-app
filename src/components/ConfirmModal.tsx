import { useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

const CONFIRM_MODAL_CONTAINER_ID = 'confirm-modal-root'

function getOrCreateContainer(): HTMLDivElement {
  let el = document.getElementById(CONFIRM_MODAL_CONTAINER_ID) as HTMLDivElement | null
  if (!el) {
    el = document.createElement('div')
    el.id = CONFIRM_MODAL_CONTAINER_ID
    el.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;pointer-events:auto;display:none;align-items:center;justify-content:center;'
    document.body.appendChild(el)
  }
  return el
}

export interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useLayoutEffect(() => {
    if (!open) return
    const container = getOrCreateContainer()
    const previousBodyPointerEvents = document.body.style.pointerEvents
    document.body.style.pointerEvents = 'none'
    container.style.pointerEvents = 'auto'
    container.style.display = 'flex'
    return () => {
      document.body.style.pointerEvents = previousBodyPointerEvents
      container.style.pointerEvents = 'none'
      container.style.display = 'none'
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const container = getOrCreateContainer()

  const confirmClass =
    variant === 'danger'
      ? 'btn-interactive px-4 py-2 rounded-xl bg-rose-400 text-white text-sm font-medium hover:bg-rose-500'
      : 'btn-interactive px-4 py-2 rounded-xl bg-sky-400 text-white text-sm font-medium hover:bg-sky-500'

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        e.stopPropagation()
        onCancel()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-800 mb-2">
          {title}
        </h2>
        <p id="confirm-modal-desc" className="text-slate-600 text-sm mb-5">
          {message}
        </p>
        <div className="flex gap-3 justify-end" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="btn-interactive px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium bg-white hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className={confirmClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, container)
}
