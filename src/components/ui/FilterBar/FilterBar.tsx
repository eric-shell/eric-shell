import type { HTMLAttributes } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '../cn'
import Button from '../Button'
import Dropdown, { type DropdownOption } from '../Dropdown'
import Label from '../Label'
import MultiSelect, { type MultiSelectOption } from '../MultiSelect'

interface FilterBarProps<S extends string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  sortOptions: (DropdownOption & { value: S })[]
  sort: S
  onSortChange: (sort: S) => void
  /** Derive these from the data, never hand-list them: see the Work grid. */
  tagOptions: MultiSelectOption[]
  tags: string[]
  onTagsChange: (tags: string[]) => void
  canReset: boolean
  onReset: () => void
  /** What the filter left, in words: "12 of 41 projects". */
  status: string
}

/**
 * Sort, tag filter, a count, and Reset: the controls above a filterable grid on
 * a lum field (the Work grid and the notes index). Pair it with `useTagFilter`,
 * which holds the state and reports it to telemetry.
 *
 * Selected tags live in the tag control's trigger rather than as a row of
 * dismissible chips beside it. That row grew one control per tag: at four it
 * wrapped and pushed the grid down. The dropdown is also the only place the
 * whole tag vocabulary is visible, since clicking tags on cards can only ever
 * surface the ones already on screen.
 *
 * The count is `aria-live` because filtering is the one action here with no
 * visible focus consequence: a tag click changes a list far below the control
 * that changed it, and without an announcement a screen reader user gets no
 * sign that anything happened. Polite, so it waits for a pause.
 */
export default function FilterBar<S extends string>({
  sortOptions,
  sort,
  onSortChange,
  tagOptions,
  tags,
  onTagsChange,
  canReset,
  onReset,
  status,
  className,
  ...props
}: FilterBarProps<S>) {
  return (
    <div className={cn('relative z-20 flex flex-wrap items-center justify-between gap-4', className)} {...props}>
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown variant="white" options={sortOptions} value={sort} onChange={v => onSortChange(v as S)} />
        <MultiSelect
          variant="white"
          options={tagOptions}
          values={tags}
          onChange={onTagsChange}
          placeholder="Filter by tag"
          searchPlaceholder="Filter tags…"
          searchable
        />
      </div>

      <div className="flex items-center gap-3">
        <Label aria-live="polite" className="whitespace-nowrap">
          {status}
        </Label>
        {canReset && (
          <Button
            variant="white"
            size="md"
            onClick={onReset}
            leftIcon={<RotateCcw size={15} strokeWidth={2.5} aria-hidden="true" />}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
