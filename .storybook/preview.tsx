import type { Preview } from '@storybook/react'
import { Suspense } from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'white',
      values: [
        // The four fields the site is built from. Keep in step with @theme in
        // src/index.css (tests/ui-vocabulary.test.ts checks `ink`).
        { name: 'white', value: '#ffffff' },
        { name: 'ice', value: '#EAF0FF' },
        { name: 'lum', value: '#2B54FF' },
        { name: 'ink', value: '#0A1033' },
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
