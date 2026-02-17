import { forwardRef } from 'react'

export interface RadioProps {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  id?: string
  children?: React.ReactNode
  className?: string
}

const RADIO_SIZE = '1.125rem'

export default forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { name, value, checked, onChange, id, children, className = '' },
  ref
) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer text-sm ${className}`}>
      <span
        className="custom-radio-wrap relative inline-flex flex-shrink-0 align-middle"
        style={{ width: RADIO_SIZE, height: RADIO_SIZE }}
      >
        <input
          ref={ref}
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="custom-input-native"
          aria-hidden={false}
        />
        <span className="custom-radio-dot" aria-hidden="true" />
      </span>
      {children != null && <span>{children}</span>}
    </label>
  )
})
