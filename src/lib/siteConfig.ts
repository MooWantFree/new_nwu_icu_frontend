import { reactive } from 'vue'
import { z } from 'zod'

const httpUrl = z.string().url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol))
const configSchema = z.object({
  site_name: z.string().min(1),
  site_origin: httpUrl,
  university_name: z.string(),
  university_short_name: z.string(),
  college_email_domains: z.array(z.string().min(1)),
  registration_blocked_email_domains: z.array(z.string().min(1)),
  navigation_links: z.array(z.object({ label: z.string().min(1), url: httpUrl })),
  analytics: z.object({ website_id: z.string(), domains: z.array(z.string()) }),
  sentry_dsn: z.union([z.literal(''), httpUrl]),
  footer_start_year: z.number().int().nonnegative(),
  frontend_repository_url: z.union([z.literal(''), httpUrl]),
  backend_repository_url: z.union([z.literal(''), httpUrl]),
})

export type SiteConfig = z.infer<typeof configSchema>
export const siteConfig = reactive<SiteConfig>({
  site_name: '本站', site_origin: window.location.origin,
  university_name: '学校', university_short_name: '学校',
  college_email_domains: [], registration_blocked_email_domains: [],
  navigation_links: [], analytics: { website_id: '', domains: [] }, sentry_dsn: '',
  footer_start_year: 0, frontend_repository_url: '', backend_repository_url: '',
})

export async function loadSiteConfig() {
  const bootstrap = document.getElementById('site-config-bootstrap')
  if (bootstrap) {
    bootstrap.remove()
    try {
      Object.assign(siteConfig, configSchema.parse(JSON.parse(bootstrap.textContent || '')))
      return
    } catch {
      // An incomplete document must not prevent retrying the current configuration.
    }
  }
  const response = await fetch('/api/site-config/', {
    credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error('站点配置加载失败')
  Object.assign(siteConfig, configSchema.parse(await response.json()))
}

export function isCollegeEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@').at(-1)
  return siteConfig.college_email_domains.some((allowed) => domain === allowed.toLowerCase())
}

export function isRegistrationEmailBlocked(email: string) {
  const domain = email.trim().toLowerCase().split('@').at(-1) || ''
  return siteConfig.registration_blocked_email_domains.some((allowed) => {
    const suffix = allowed.toLowerCase()
    return domain === suffix || domain.endsWith(`.${suffix}`)
  })
}
