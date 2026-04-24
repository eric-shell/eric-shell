import type { Meta, StoryObj } from '@storybook/react'
import CascadeGroup from './CascadeGroup'
import CascadeItem from './CascadeItem'

const meta = {
  title: 'UI/Cascade',
  component: CascadeGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof CascadeGroup>

export default meta
type Story = StoryObj<typeof meta>

export const MountOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <CascadeGroup mountOnly className="flex flex-col gap-4">
      <CascadeItem index={0}>
        <div className="p-4 rounded-lg bg-off-white">Item 1</div>
      </CascadeItem>
      <CascadeItem index={1}>
        <div className="p-4 rounded-lg bg-off-white">Item 2</div>
      </CascadeItem>
      <CascadeItem index={2}>
        <div className="p-4 rounded-lg bg-off-white">Item 3</div>
      </CascadeItem>
    </CascadeGroup>
  ),
}

export const StaggerDemo: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <CascadeGroup mountOnly stagger={100} className="flex flex-col gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <CascadeItem key={i} index={i}>
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue/10 to-off-white">
            Item {i + 1}
          </div>
        </CascadeItem>
      ))}
    </CascadeGroup>
  ),
}

export const ScrollTriggered: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="p-8">
      <div style={{ paddingTop: '150vh' }}>
        <CascadeGroup threshold={0.1} className="flex flex-col gap-4">
          <CascadeItem index={0}>
            <div className="p-4 rounded-lg bg-off-white">
              <p className="font-semibold">Scroll-triggered Item 1</p>
              <p className="text-sm text-off-black/60">This item is hidden until you scroll it into view</p>
            </div>
          </CascadeItem>
          <CascadeItem index={1}>
            <div className="p-4 rounded-lg bg-off-white">
              <p className="font-semibold">Scroll-triggered Item 2</p>
              <p className="text-sm text-off-black/60">Notice the staggered animation delay</p>
            </div>
          </CascadeItem>
          <CascadeItem index={2}>
            <div className="p-4 rounded-lg bg-off-white">
              <p className="font-semibold">Scroll-triggered Item 3</p>
              <p className="text-sm text-off-black/60">Each item enters with a delay</p>
            </div>
          </CascadeItem>
        </CascadeGroup>
      </div>
    </div>
  ),
}

export const AsGrid: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <CascadeGroup as="ul" mountOnly className="grid grid-cols-3 gap-4">
      {Array.from({ length: 9 }, (_, i) => (
        <CascadeItem key={i} as="li" index={i}>
          <div className="aspect-square rounded-lg bg-gradient-to-br from-off-white to-off-white/50 flex items-center justify-center font-semibold">
            {i + 1}
          </div>
        </CascadeItem>
      ))}
    </CascadeGroup>
  ),
}
