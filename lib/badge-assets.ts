export const GOOGLE_BADGE_FONTS = {
  inter: 'Inter',
  roboto: 'Roboto',
  outfit: 'Outfit',
  'dm-sans': 'DM Sans',
  manrope: 'Manrope',
  'space-grotesk': 'Space Grotesk',
  'playfair-display': 'Playfair Display',
  lora: 'Lora',
  'ibm-plex-mono': 'IBM Plex Mono',
  'space-mono': 'Space Mono',
  oswald: 'Oswald',
  nunito: 'Nunito',
} as const

export const ICON_PACKS = { solid: 'Solid', regular: 'Regular', brands: 'Brands' } as const
export type IconPack = keyof typeof ICON_PACKS
export type BadgeIcon = { width: number; height: number; paths: string[] }
export type BadgeAssets = { font?: string; icon?: BadgeIcon }

export function isGoogleBadgeFont(key: string | null | undefined): key is keyof typeof GOOGLE_BADGE_FONTS {
  return Boolean(key && Object.prototype.hasOwnProperty.call(GOOGLE_BADGE_FONTS, key))
}

export function isBadgeIconKey(value: string | null | undefined): value is string {
  return Boolean(value && /^(solid|regular|brands):[a-z0-9][a-z0-9-]{0,63}$/.test(value))
}
