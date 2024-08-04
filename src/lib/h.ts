import {Component, h} from "vue";
import {MenuOption, NIcon} from "naive-ui";
import {RouterLink} from "vue-router";

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, {default: () => h(icon)})
}
const renderMenuLabel = (option: MenuOption) => {
  if (option.path) {
    return h(
      RouterLink,
      {
        to: option.path
      },
      {default: () => option.text??option.label}
    )
  }
  else if (option.onclick) {
    return h(
      "div",
      {onClick: option.onclick},
      {default: () => option.text??option.label}
    )
  }else {
    return h(
      'span',
      option.text??option.label
    )
  }
}

export {renderIcon, renderMenuLabel}