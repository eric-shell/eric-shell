import type { Preview } from '@storybook/react'
import { Suspense } from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: '#ffffff' },
        { name: 'off-white', value: '#e7f2f6' },
        { name: 'off-black', value: '#111521' },
        { name: 'black', value: '#030407' },
      ],
    },
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <Suspense fallback={null}>
        <div className="font-sans antialiased">
          <Story />
        </div>
      </Suspense>
    ),
  ],
}

export default preview
