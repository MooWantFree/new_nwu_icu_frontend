import { h, Component } from 'vue'
import { NIcon, MenuOption } from 'naive-ui'
import { RouterLink } from 'vue-router'

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}
const renderMenuLabel = (option: MenuOption) => {
  if (option.path) {
    return h(
      RouterLink,
      {
        to: option.path,
      },
      { default: () => option.text ?? option.label }
    )
  } else if (option.onclick) {
    return h(
      'div',
      { onClick: option.onclick },
      { default: () => option.text ?? option.label }
    )
  } else {
    return h(
      'span',
      h(
        'span',
        {
          style: (option.meta as { style?: any })?.style,
        },
        { default: () => option.text ?? option.label }
      )
    )
  }
}

export { renderIcon, renderMenuLabel }
