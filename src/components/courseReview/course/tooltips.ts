export const ratingTooltip = (rating: number) => {
    switch (rating) {
      case 3:
        return '很好'
      case 2:
        return '还行'
      case 1:
        return '差'
      default:
        return ''
    }
  }