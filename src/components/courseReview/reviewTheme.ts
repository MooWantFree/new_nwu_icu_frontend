import type { GlobalThemeOverrides } from 'naive-ui'

export const reviewSelectTheme: NonNullable<GlobalThemeOverrides['Select']> = {
  peers: {
    InternalSelection: {
      border: '1px solid #e4e4e7',
      borderHover: '1px solid #a1a1aa',
      borderActive: '1px solid #a1a1aa',
      borderFocus: '1px solid #a1a1aa',
      borderRadius: '6px',
      textColor: '#3f3f46',
      boxShadowActive: '0 0 0 2px rgb(161 161 170 / 20%)',
      boxShadowFocus: '0 0 0 2px rgb(161 161 170 / 20%)',
      caretColor: '#18181b',
    },
    InternalSelectMenu: {
      optionTextColorActive: '#18181b',
      optionCheckColor: '#18181b',
    },
  },
}

