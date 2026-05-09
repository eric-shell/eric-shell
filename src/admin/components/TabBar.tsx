import { twMerge } from 'tailwind-merge'

interface Props<T extends string> {
  tabs: ReadonlyArray<readonly [T, string]>
  active: T
  onChange: (key: T) => void
  className?: string
}

export default function TabBar<T extends string>({ tabs, active, onChange, className }: Props<T>) {
  return (
    <div className={twMerge('flex border-b border-blue-950/10', className)} role="tablist">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onChange(key)}
          className={twMerge(
            'cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors',
            active === key
              ? 'border-blue-950 text-blue-950'
              : 'border-transparent text-blue-950/40 hover:text-blue-950/70'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
