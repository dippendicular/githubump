export const BADGE_STYLES = {
  flat: 'Flat',
  'flat-square': 'Flat square',
  plastic: 'Plastic',
  rounded: 'Rounded',
  'for-the-badge': 'For the badge',
  social: 'Social',
  pill: 'Pill',
  outline: 'Outline',
  terminal: 'Terminal',
  minimal: 'Minimal',
  ticket: 'Ticket',
  ledger: 'Ledger',
  orbit: 'Orbit',
} as const

export type BadgeStyle = keyof typeof BADGE_STYLES
