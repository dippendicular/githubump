export const PLATFORMS = {
  github: 'GitHub',
  gitlab: 'GitLab',
  forgejo: 'Forgejo',
  gitea: 'Gitea',
  codeberg: 'Codeberg',
} as const

export type Platform = keyof typeof PLATFORMS
export const PLATFORM_IDS = Object.keys(PLATFORMS) as Platform[]

export function parsePlatform(value: unknown): Platform | null {
  if (value === undefined || value === null) return 'github'
  return typeof value === 'string' && PLATFORM_IDS.includes(value as Platform) ? value as Platform : null
}

export function platformUsername(value: unknown, platform: Platform): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim().toLowerCase()
  const allowed = platform === 'github' ? /^[a-z0-9-]{1,39}$/ : /^[a-z0-9_][a-z0-9_.-]{0,63}$/
  return allowed.test(name) ? name : null
}

export function platformCounterKey(platform: Platform, username: string) {
  return platform === 'github' ? `views:${username}` : `views:${platform}:${username}`
}
