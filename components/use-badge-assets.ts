import { useEffect, useState } from 'react'
import { isGoogleBadgeFont, type BadgeAssets } from '@/lib/badge-assets'
import type { BadgeDesign } from '@/lib/badge-design'

export function useBadgeAssets({ font, icon }: BadgeDesign, enabled = true): BadgeAssets | undefined {
  const params = new URLSearchParams()
  if (enabled && isGoogleBadgeFont(font)) params.set('font', font)
  if (enabled && icon) params.set('icon', icon)
  const key = params.toString()
  const [result, setResult] = useState<{ key: string; assets: BadgeAssets }>()
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    fetch(`/api/badge-assets?${key}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.ok && !controller.signal.aborted) {
          const assets: BadgeAssets = await response.json()
          if (!controller.signal.aborted) setResult({ key, assets })
        }
      })
      .catch(() => { /* Preview falls back to the design font and no icon. */ })
    return () => controller.abort()
  }, [key])

  return result?.key === key ? result.assets : undefined
}
