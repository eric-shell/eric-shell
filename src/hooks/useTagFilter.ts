import { useCallback, useState } from 'react'
import { useFilterTelemetry } from './useFilterTelemetry'

interface TagFilterOptions<S extends string> {
  /** Which grid this is, for the `filter_apply` event. */
  section: 'work' | 'notes'
  defaultSort: S
}

/**
 * The state behind a `FilterBar`: a sort order and a set of tags, with the
 * settled selection reported to telemetry (see `useFilterTelemetry`, which
 * debounces and skips the default view).
 *
 * Tags combine with OR at the call sites. AND would let two clicks produce an
 * empty grid, which reads as a broken filter rather than a narrow one.
 */
export function useTagFilter<S extends string>({ section, defaultSort }: TagFilterOptions<S>) {
  const [sort, setSort] = useState<S>(defaultSort)
  const [tags, setTags] = useState<string[]>([])

  useFilterTelemetry({ section, tags, sort, defaultSort })

  const toggleTag = useCallback((tag: string) => {
    setTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }, [])

  const reset = useCallback(() => {
    setTags([])
    setSort(defaultSort)
  }, [defaultSort])

  return {
    sort,
    setSort,
    tags,
    setTags,
    toggleTag,
    reset,
    canReset: tags.length > 0 || sort !== defaultSort,
  }
}
