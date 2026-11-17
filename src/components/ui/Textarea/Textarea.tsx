import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../cn'
import { FIELD_COUNT, FIELD_LABEL, fieldClass, type FieldTone } from '../Field/field'

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  label: string
  onChange: (value: string) => void
  valid?: boolean
  error?: boolean
  showCount?: boolean
  /** The surface the field sits on. See `Field/field.ts`. */
  tone?: FieldTone
  className?: string
}

export default function Textarea({
  id,
  label,
  value,
  onChange,
  valid = false,
  error = false,
  showCount,
  maxLength,
  rows = 6,
  tone = 'white',
  className = '',
  ...props
}: TextareaProps) {
  const shouldShowCount = showCount ?? maxLength !== undefined
  const stringValue = typeof value === 'string' ? value : ''

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL[tone]}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error || undefined}
        className={cn('resize-none', fieldClass({ tone, valid, error }), className)}
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
