import { forwardRef } from 'react'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  children?: React.ReactNode
  className?: string
}

const CHECKBOX_SIZE = '1.125rem'

export default forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, onChange, id, children, className = '' },
  ref
) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer text-sm ${className}`}>
      <span
        className="custom-checkbox-wrap relative inline-flex flex-shrink-0 align-middle"
        style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE }}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="custom-input-native"
          aria-hidden={false}
        />
        <span className="custom-checkbox-box" aria-hidden="true">
          {checked && (
            <svg
              className="custom-checkbox-check"
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M1 5.5L4.5 9L11 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
      {children != null && <span>{children}</span>}
    </label>
  )
})
