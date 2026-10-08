// Use a distinct basename from Router.ts so this declaration is included
// by TypeScript on both case-sensitive and case-insensitive filesystems.
import 'vue-router'

// To ensure it is treated as a module, add at least one `export` statement
export {}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    loginReason?: string
    loginSuccessMessage?: string
    pageTitle: string
  }
}
