import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Merge class lists, last one wins. This is tailwind-merge taught the site's
 * own token names, and it is the only place in the app that may import
 * tailwind-merge (ESLint enforces it).
 *
 * The stock merge only recognises Tailwind's default names. To it `rounded-card`
 * is not a radius, so `cn('rounded-lg', 'rounded-card')` would keep both and
 * let stylesheet order decide; and `shadow-card` looks like a shadow *colour*,
 * so it would not replace `shadow-lg` either. Every name declared under
 * `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--text-shadow-*`,
 * `--tracking-*` and `--ease-*` in src/index.css has to be listed here too.
 * tests/ui-vocabulary.test.ts fails when the two lists disagree.
 */
export const cn = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['tile', 'media', 'card', 'composer', 'sheet'],
      shadow: ['raised', 'popover', 'card', 'card-soft', 'float', 'capsule', 'drawer', 'beacon'],
      'inset-shadow': ['highlight', 'highlight-strong'],
      'text-shadow': ['poster', 'poster-strong'],
      tracking: ['display', 'label'],
      ease: ['spring', 'settle'],
    },
  },
})
