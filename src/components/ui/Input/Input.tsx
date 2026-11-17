import type { InputHTMLAttributes } from 'react'
import { cn } from '../cn'
import { FIELD_COUNT, FIELD_LABEL, fieldClass, type FieldTone } from '../Field/field'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  onChange: (value: string) => void
  valid?: boolean
  error?: boolean
  showCount?: boolean
  /** The surface the field sits on. See `Field/field.ts`. */
  tone?: FieldTone
  className?: string
}

export default function Input({
  id,
  label,
  value,
  onChange,
  valid = false,
  error = false,
  showCount,
  maxLength,
  tone = 'white',
  className = '',
  ...props
}: InputProps) {
  const shouldShowCount = showCount ?? maxLength !== undefined
  const stringValue = typeof value === 'string' ? value : ''

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL[tone]}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        aria-invalid={error || undefined}
        className={cn(fieldClass({ tone, valid, error }), className)}
        {...props}
      />
      {shouldShowCount && maxLength !== undefined && (
        <span className={FIELD_COUNT[tone]}>
          {stringValue.length}/{maxLength}
        </span>
      )}
    </div>
  )
}
