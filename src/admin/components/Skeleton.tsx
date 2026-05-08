import { twMerge } from 'tailwind-merge'

export function Skeleton({ className }: { className?: string }) {
  return <div className={twMerge('rounded bg-blue-950/10', className)} />
}
