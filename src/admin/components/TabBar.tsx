import { twMerge } from 'tailwind-merge'

interface Props<T extends string> {
  tabs: ReadonlyArray<readonly [T, string]>
  active: T
  onChange: (key: T) => void
  className?: string
}

export default function TabBar<T extends string>({ tabs, active, onChange, className }: Props<T>) {
  return (
    <div className={twMerge('flex border-b border-white/10', className)} role="tablist">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onChange(key)}
          className={twMerge(
            'cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors',
            active === key
              ? 'border-accent text-white'
              : 'border-transparent text-white/80 hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
