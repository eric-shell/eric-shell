import type { InputHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  onChange: (value: string) => void
  valid?: boolean
  showCount?: boolean
  className?: string
}

const FIELD_BASE =
  'w-full rounded-lg border bg-transparent px-4 py-3 font-sans text-sm text-off-black placeholder:text-off-black/30 focus:outline-none transition disabled:opacity-50'

export default function Input({
  id,
  label,
  value,
  onChange,
  valid = false,
  showCount,
  maxLength,
  className = '',
  ...props
}: InputProps) {
  const borderClass = valid
    ? 'border-blue focus:border-blue'
    : 'border-off-black/20 focus:border-off-black/60'

  const shouldShowCount = showCount ?? maxLength !== undefined
  const stringValue = typeof value === 'string' ? value : ''

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-sm font-semibold text-off-black">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        className={twMerge(FIELD_BASE, borderClass, className)}
        {...props}
      />
      {shouldShowCount && maxLength !== undefined && (
        <span className="font-sans text-xs text-off-black/30 text-right">
          {stringValue.length}/{maxLength}
        </span>
      )}
    </div>
  )
}
