export const isManagementPath = (path: string) => path === '/manage' || path.startsWith('/manage/')

export const managementNavigationNeedsReload = (currentPath: string, destinationPath: string) => (
  isManagementPath(destinationPath) && !isManagementPath(currentPath)
)
