import type { TextareaHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  label: string
  onChange: (value: string) => void
  valid?: boolean
  showCount?: boolean
  theme?: 'light' | 'dark'
  className?: string
}

const FIELD_BASE_LIGHT =
  'w-full resize-none rounded-lg border bg-transparent px-4 py-3 font-sans text-sm text-blue-950 placeholder:text-blue-950/30 focus:outline-none transition disabled:opacity-50'

const FIELD_BASE_DARK =
  'w-full resize-none rounded-lg border bg-white/10 px-4 py-3 font-sans text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 transition disabled:opacity-50'

export default function Textarea({
  id,
  label,
  value,
  onChange,
  valid = false,
  showCount,
  maxLength,
  rows = 6,
  theme = 'light',
  className = '',
  ...props
}: TextareaProps) {
  const isDark = theme === 'dark'

  const borderClass = valid
    ? isDark ? 'border-white focus:border-white' : 'border-blue-700 focus:border-blue-700'
    : isDark ? 'border-white/20 focus:border-white/60' : 'border-blue-950/20 focus:border-blue-950/60'

  const labelClass = isDark
    ? 'font-sans text-sm font-semibold text-white text-shadow-md'
    : 'font-sans text-sm font-semibold text-blue-950'

  const countClass = isDark
    ? 'font-sans text-xs text-white/50 text-right'
    : 'font-sans text-xs text-blue-950/30 text-right'

  const shouldShowCount = showCount ?? maxLength !== undefined
  const stringValue = typeof value === 'string' ? value : ''

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className={twMerge(isDark ? FIELD_BASE_DARK : FIELD_BASE_LIGHT, borderClass, className)}
        {...props}
      />
      {shouldShowCount && maxLength !== undefined && (
        <span className={countClass}>
          {stringValue.length}/{maxLength}
        </span>
      )}
    </div>
  )
}
