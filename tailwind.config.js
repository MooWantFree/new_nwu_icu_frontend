import typography from '@tailwindcss/typography'

const themePalette = (name) => Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade =>
    [shade, `rgb(var(--ui-${name}-${shade}) / <alpha-value>)`],
  ),
)
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
        4: '4 4 0%',
        5: '5 5 0%',
        7: '7 7 0%',
      },
      borderColor: {
        customGray: 'rgb(var(--ui-custom-border-rgb) / <alpha-value>)',
      },
      height: {
        37.5: '37.5rem',
        0.1: '0.025rem',
      },
      width: {
        '23/24': '95.833333%', // 添加自定义的 23/24 宽度
      },
      colors: {
        customGray: 'rgb(var(--ui-custom-gray-rgb) / <alpha-value>)',
        customBlue: 'rgb(var(--ui-accent-rgb) / <alpha-value>)',
        contentGray: 'rgb(var(--ui-tertiary-rgb) / <alpha-value>)',
        hrefBlue: 'rgb(var(--ui-link-rgb) / <alpha-value>)',
        blue: themePalette('blue'),
        gray: themePalette('neutral'),
        slate: themePalette('neutral'),
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px rgb(0 0 0 / 0.04)',
        DEFAULT: '0 2px 8px rgb(0 0 0 / 0.06)',
        md: '0 4px 14px rgb(0 0 0 / 0.07)',
        lg: '0 8px 24px rgb(0 0 0 / 0.08)',
        xl: '0 12px 32px rgb(0 0 0 / 0.10)',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--ui-text-secondary)',
            '--tw-prose-headings': 'var(--ui-text-primary)',
            '--tw-prose-lead': 'var(--ui-text-tertiary)',
            '--tw-prose-links': 'var(--ui-link)',
            '--tw-prose-bold': 'var(--ui-text-primary)',
            '--tw-prose-counters': 'var(--ui-text-tertiary)',
            '--tw-prose-bullets': 'var(--ui-text-muted)',
            '--tw-prose-hr': 'var(--ui-border)',
            '--tw-prose-quotes': 'var(--ui-text-primary)',
            '--tw-prose-quote-borders': 'var(--ui-border-strong)',
            '--tw-prose-captions': 'var(--ui-text-tertiary)',
            '--tw-prose-code': 'var(--ui-text-primary)',
            '--tw-prose-pre-code': 'var(--ui-surface-muted)',
            '--tw-prose-pre-bg': 'var(--ui-text-primary)',
            '--tw-prose-th-borders': 'var(--ui-border-strong)',
            '--tw-prose-td-borders': 'var(--ui-border)',
          },
        },
      },
    },
  },
  plugins: [typography],
}
