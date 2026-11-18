import { NEW_DESIGNS } from './badge-design'

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
  ...NEW_DESIGNS,
} as const

export type BadgeStyle = keyof typeof BADGE_STYLES
