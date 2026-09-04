import type { GlobalThemeOverrides } from 'naive-ui'

const systemFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif'

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0071E3',
    primaryColorHover: '#0A84FF',
    primaryColorPressed: '#0066CC',
    primaryColorSuppl: '#0071E3',
    infoColor: '#0071E3',
    infoColorHover: '#0A84FF',
    infoColorPressed: '#0066CC',
    successColor: '#34C759',
    warningColor: '#FF9F0A',
    errorColor: '#FF3B30',
    bodyColor: '#F5F5F7',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    tableColor: '#FFFFFF',
    textColorBase: '#1D1D1F',
    textColor1: '#1D1D1F',
    textColor2: '#48484A',
    textColor3: '#6E6E73',
    borderColor: '#D1D1D6',
    dividerColor: '#E5E5EA',
    inputColor: '#FFFFFF',
    actionColor: '#F5F5F7',
    hoverColor: '#F2F2F7',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: systemFont,
    fontFamilyMono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px',
    fontWeight: '500',
  },
  Card: {
    borderRadius: '16px',
  },
  Dialog: {
    borderRadius: '16px',
  },
  Pagination: {
    itemBorderRadius: '8px',
  },
}
