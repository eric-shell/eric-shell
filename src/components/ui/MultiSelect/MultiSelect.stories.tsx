import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import { ArrowDownAZ, CalendarArrowDown, Cpu, Palette, RotateCcw, Sparkles } from 'lucide-react'
import MultiSelect from './MultiSelect'
import type { DropdownOption } from '../Dropdown'
import Dropdown from '../Dropdown'
import Button from '../Button'

/**
 * `MultiSelect` is controlled, so every story drives it through local state —
 * `args`-only stories would render a trigger that never changes when clicked,
 * which is exactly the behaviour these stories exist to check.
 */
const meta = {
  title: 'UI/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  args: {
    options: [],
    values: [],
    onChange: fn(),
  },
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

const frameworks: DropdownOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
]

/** The real notes tag vocabulary — the list this component was built for. */
const noteTags: DropdownOption[] = [
  'Accessibility', 'Animation', 'Audio', 'Auth', 'Bot detection', 'Build tooling',
  'Bundle size', 'CRM', 'CSP', 'CSS', 'Caching', 'Canvas', 'Content', 'Data modelling',
  'Deployment', 'Design', 'Design systems', 'Images', 'Node', 'Performance', 'Print CSS',
  'Privacy', 'React', 'Refactoring', 'Resilience', 'Responsive', 'Routing', 'SEO',
  'Security', 'Serverless', 'Tailwind', 'Telemetry', 'Tradeoffs', 'Typography', 'UX',
  'Vercel', 'Vite',
].map(t => ({ value: t, label: t }))

function Controlled({
  initial = [],
  ...props
}: Omit<React.ComponentProps<typeof MultiSelect>, 'values' | 'onChange'> & { initial?: string[] }) {
  const [values, setValues] = useState<string[]>(initial)
  return (
    <div className="flex w-[28rem] flex-col gap-4">
      <MultiSelect {...props} values={values} onChange={setValues} />
      <p className="font-sans text-sm text-blue-950/60">
        {values.length === 0 ? 'Nothing selected' : `Selected: ${values.join(', ')}`}
      </p>
    </div>
  )
}

export const Default: Story = {
  render: () => <Controlled options={frameworks} placeholder="Frameworks" />,
}

export const WithSelection: Story = {
  render: () => (
    <Controlled options={frameworks} placeholder="Frameworks" initial={['react', 'svelte']} />
  ),
}

/**
 * Past ~15 options the list is faster to filter than to scan. Focus lands in the
 * field on open; arrows still drive the list from there, and Space types a space
 * rather than toggling.
 */
export const Searchable: Story = {
  render: () => (
    <Controlled
      options={noteTags}
      placeholder="Filter by tag"
      searchPlaceholder="Filter tags…"
      searchable
      initial={['Performance', 'SEO', 'Tailwind']}
    />
  ),
}

/** Without a filter field, the same 37 options are a scroll. */
export const ManyOptionsNoSearch: Story = {
  render: () => <Controlled options={noteTags} placeholder="Filter by tag" />,
}

export const WithIcons: Story = {
  render: () => (
    <Controlled
      options={[
        { value: 'ai', label: 'AI', icon: <Sparkles size={14} strokeWidth={2.5} /> },
        { value: 'design', label: 'Design', icon: <Palette size={14} strokeWidth={2.5} /> },
        { value: 'hardware', label: 'Data Hardware', icon: <Cpu size={14} strokeWidth={2.5} /> },
      ]}
      placeholder="Categories"
      initial={['ai']}
    />
  ),
}

/**
 * The composition it ships in: sort `Dropdown`, tag `MultiSelect`, Reset. The
 * point of the trigger summarising its selection is that this row keeps its
 * width no matter how many tags are on — compare against the dismissible-Button
 * row it replaced, which grew one control per tag.
 */
export const InAControlBar: Story = {
  render: function ControlBar() {
    const [sort, setSort] = useState('newest')
    const [tags, setTags] = useState<string[]>(['Performance', 'SEO', 'Tailwind', 'React'])
    const canReset = tags.length > 0 || sort !== 'newest'
    return (
      <div className="w-[44rem] rounded-xl bg-gradient-to-br from-white to-blue-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown
              options={[
                { value: 'newest', label: 'Newest first', icon: <CalendarArrowDown size={12} strokeWidth={2.5} /> },
                { value: 'asc', label: 'Ascending', icon: <ArrowDownAZ size={12} strokeWidth={2.5} /> },
              ]}
              value={sort}
              onChange={setSort}
            />
            <MultiSelect
              options={noteTags}
              values={tags}
              onChange={setTags}
              placeholder="Filter by tag"
              searchPlaceholder="Filter tags…"
              searchable
            />
          </div>
          {canReset && (
            <Button
              variant="white"
              size="md"
              onClick={() => { setTags([]); setSort('newest') }}
              leftIcon={<RotateCcw size={15} strokeWidth={2.5} aria-hidden="true" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    )
  },
}

/**
 * Pinned near the bottom of the viewport so the panel has to open upward. The
 * measurement runs on open and again on scroll and resize — scroll the frame
 * with the panel open and it should stay attached to its trigger.
 */
export const OpensUpwardNearViewportEdge: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="flex h-[100vh] flex-col justify-end p-6">
      <Controlled options={noteTags} placeholder="Filter by tag" searchable />
    </div>
  ),
}

/**
 * The trigger uses whatever variant the surrounding section calls for; the panel
 * itself stays light, same as `Dropdown`.
 */
export const InDarkTheme: Story = {
  parameters: { backgrounds: { default: 'blue-950' } },
  render: () => (
    <div className="p-8">
      <Controlled
        options={frameworks}
        placeholder="Frameworks"
        variant="glass-light"
        initial={['react']}
      />
    </div>
  ),
}
