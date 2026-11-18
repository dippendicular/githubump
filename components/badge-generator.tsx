'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight, Braces, Check, Code2, Copy, Eye, Link2, Monitor, Moon, RotateCcw, Shuffle,
  SlidersHorizontal, Sun, UserRound, UsersRound,
} from 'lucide-react'
import { formatNumber, generateBadgeUrl, generateMarkdownCode, type CountMode } from '@/lib/badge-utils'
import { BADGE_STYLES, type BadgeStyle } from '@/lib/badge-styles'
import type { GitHubStats } from '@/lib/github-stats'

const DEFAULTS = {
  username: 'dipcb05',
  label: 'Profile views',
  color: '#0e75b6',
  style: 'flat' as BadgeStyle,
  mode: 'unique' as CountMode,
  ttl: '21600',
}

const STYLES = Object.keys(BADGE_STYLES) as BadgeStyle[]
const THEMES = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

type Theme = (typeof THEMES)[number]['value']
const THEME_KEY = 'github-counter-theme'

const COLORS = [
  ['Ocean blue', '#0e75b6'], ['Violet', '#7c3aed'], ['Green', '#15803d'],
  ['Rose', '#be185d'], ['Amber', '#b45309'],
]

const MODES = [
  { value: 'unique', label: 'Unique views', icon: UsersRound },
  { value: 'total', label: 'Every request', icon: Eye },
] as const

const FORMATS = [
  { value: 'markdown', label: 'Markdown', icon: Code2 },
  { value: 'html', label: 'HTML', icon: Braces },
  { value: 'url', label: 'URL', icon: Link2 },
] as const

type Format = (typeof FORMATS)[number]['value']

export default function BadgeGenerator() {
  const reduceMotion = useReducedMotion()
  const [settings, setSettings] = useState(DEFAULTS)
  const [origin, setOrigin] = useState('')
  const [surface, setSurface] = useState<Theme>('system')
  const [theme, setTheme] = useState<Theme>('system')
  const [zoom, setZoom] = useState(140)
  const [format, setFormat] = useState<Format>('markdown')
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState(false)
  const [failedPreview, setFailedPreview] = useState('')
  const [profile, setProfile] = useState<{ username: string; stats: GitHubStats } | null>(null)

  const { username, label, color, style, mode, ttl } = settings
  const account = username.trim().toLowerCase() || 'guest'
  const validUsername = /^[a-z0-9-]{1,39}$/.test(account)
  const validColor = /^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(color.trim())
  const hex = validColor ? '#' + color.trim().replace(/^#/, '').toLowerCase() : DEFAULTS.color
  const pickerColor = hex.length === 4 ? '#' + [...hex.slice(1)].map((digit) => digit.repeat(2)).join('') : hex
  const windowSeconds = ttl ? Math.min(86400, Math.max(60, Math.floor(Number(ttl)))) : Number(DEFAULTS.ttl)
  const options = { mode, ttl: mode === 'unique' ? windowSeconds : undefined }

  const badgePath = generateBadgeUrl('', account, label, hex, style, options)
  const badgeUrl = origin ? origin + badgePath : ''
  const previewUrl = generateBadgeUrl('', validUsername ? account : 'guest', label, hex, style, { preview: true })
  const stats = profile?.username === account ? profile.stats : null
  const outputs = {
    markdown: `![${account} profile views](${badgeUrl})`,
    html: generateMarkdownCode(badgeUrl, account),
    url: badgeUrl,
  }
  const output = badgeUrl && validUsername ? outputs[format] : ''
  const copyKey = `${format}:${output}`
  const isCopied = copied === copyKey

  useEffect(() => {
    setOrigin(window.location.origin)
    try {
      const saved = window.localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {
      // Theme controls remain available when storage is restricted.
    }
  }, [])

  useEffect(() => {
    if (!validUsername || !username.trim()) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/github-stats?username=${encodeURIComponent(account)}`, {
          signal: controller.signal,
        })
        if (response.ok) {
          const stats: GitHubStats | null = await response.json()
          if (stats && !controller.signal.aborted) setProfile({ username: account, stats })
        }
      } catch {
        // GitHub stats are optional. The badge works independently.
      }
    }, 500)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [account, username, validUsername])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(''), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  function update<K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setCopyError(false)
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(copyKey)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }

  function changeTheme(value: Theme) {
    setTheme(value)
    try {
      window.localStorage.setItem(THEME_KEY, value)
    } catch {
      // The selected theme still applies for this visit.
    }
  }

  function shuffleAppearance() {
    const styles = STYLES.filter((value) => value !== style)
    const colors = COLORS.filter(([, value]) => value !== pickerColor)
    const nextStyle = styles[Math.floor(Math.random() * styles.length)]
    const nextColor = colors[Math.floor(Math.random() * colors.length)][1]
    setSettings((current) => ({ ...current, style: nextStyle, color: nextColor }))
    setCopyError(false)
  }

  function reset() {
    setSettings(DEFAULTS)
    setCopyError(false)
    setCopied('')
    setFailedPreview('')
  }

  const cardMotion = (direction: -1 | 1, delay = 0) => ({
    initial: reduceMotion ? false as const : { x: direction * 14 },
    animate: { x: 0 },
    whileHover: reduceMotion ? undefined : { y: -3 },
    transition: { x: { duration: .38, delay, ease: 'easeOut' as const }, y: { duration: .18 } },
  })

  return (
    <main className="badge-workspace" data-theme={theme}>
      <header className="workspace-bar">
        <div className="workspace-width bar-content">
          <div className="workspace-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/github-counter-mark.webp" width="36" height="36" alt="" />
            <span>GitHub <strong>Counter</strong></span>
          </div>
          <div className="bar-actions">
            <div className="surface-toggle site-theme" role="group" aria-label="Site theme">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" aria-label={`${label} site theme`} title={`${label} site theme`} aria-pressed={theme === value} onClick={() => changeTheme(value)}>
                  <Icon size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
            <a className="source-link" href="https://github.com/dippendicular/githubvisitcounter" target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/github-mark.svg" width="19" height="19" alt="" />
              <span>View on GitHub</span><ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <div className="workspace-width workspace-content">
        <div className="workspace-grid">
          <motion.div className="workspace-card editor" {...cardMotion(-1)}>
            <div className="card-heading">
              <h2><SlidersHorizontal size={18} aria-hidden="true" /> Badge settings</h2>
              <div className="editor-actions">
                <button type="button" className="quiet-button" onClick={shuffleAppearance}><Shuffle size={15} aria-hidden="true" /> Shuffle</button>
                <button type="button" className="quiet-button" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Reset</button>
              </div>
            </div>

            <div className="editor-fields">
              <div className="field">
                <label htmlFor="badge-username">GitHub username</label>
                <div className="username-input">
                  <UserRound size={17} aria-hidden="true" />
                  <input id="badge-username" value={username} onChange={(event) => update('username', event.target.value)} autoCapitalize="none" spellCheck={false} maxLength={39} placeholder="guest" aria-invalid={!validUsername} aria-describedby={!validUsername ? 'username-error' : undefined} />
                </div>
                {!validUsername && <p id="username-error" className="field-error">Use only letters, numbers, and hyphens.</p>}
              </div>

              <div className="field">
                <label htmlFor="badge-label">Badge label</label>
                <input id="badge-label" value={label} onChange={(event) => update('label', event.target.value)} placeholder="Profile views" maxLength={48} />
              </div>

              <fieldset className="field">
                <legend>Badge color</legend>
                <div className="color-field">
                  <div className="color-swatches">
                    {COLORS.map(([name, value]) => (
                      <button key={value} type="button" className="color-swatch" style={{ background: value }} aria-label={name} title={name} aria-pressed={validColor && pickerColor === value} onClick={() => update('color', value)}>
                        {validColor && pickerColor === value && <Check size={15} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                  <div className="custom-color">
                    <input type="color" aria-label="Pick a custom color" value={pickerColor} onChange={(event) => update('color', event.target.value)} />
                    <input className="hex-input" aria-label="Hex color" value={color} onChange={(event) => update('color', event.target.value)} maxLength={7} spellCheck={false} aria-invalid={!validColor} aria-describedby={!validColor ? 'color-error' : undefined} />
                  </div>
                </div>
                {!validColor && <p id="color-error" className="field-error">Enter a 3- or 6-digit hex color. Using the default blue.</p>}
              </fieldset>

              <fieldset className="field">
                <legend>Badge style</legend>
                <div className="style-grid">
                  {STYLES.map((value) => (
                    <label key={value} className="style-option">
                      <input type="radio" name="badge-style" value={value} checked={style === value} onChange={() => update('style', value)} />
                      <span className="style-sample" data-style={value} aria-hidden="true"><i /><i /></span>
                      <span>{BADGE_STYLES[value]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field counting-field">
                <legend>Counting mode</legend>
                <div className="mode-grid">
                  {MODES.map(({ value, label, icon: Icon }) => (
                    <label key={value} className="mode-option">
                      <input type="radio" name="counting-mode" value={value} checked={mode === value} onChange={() => update('mode', value)} />
                      <Icon size={16} aria-hidden="true" />{label}
                    </label>
                  ))}
                </div>
                {mode === 'unique' ? (
                  <div className="ttl-field">
                    <label htmlFor="badge-ttl">Repeat visit window</label>
                    <div className="ttl-input">
                      <input id="badge-ttl" type="number" min={60} max={86400} value={ttl} placeholder={DEFAULTS.ttl} onChange={(event) => update('ttl', event.target.value)} onBlur={() => update('ttl', String(windowSeconds))} aria-describedby="ttl-help" />
                      <span aria-hidden="true">sec</span>
                    </div>
                    <p id="ttl-help">Repeat visits count once per window. 60–86,400 seconds.</p>
                  </div>
                ) : <p className="field-hint">Every badge request adds one view.</p>}
              </fieldset>
            </div>
          </motion.div>

          <div className="workspace-results">
            <motion.section className="workspace-card" {...cardMotion(1)}>
              <div className="card-heading">
                <h2><Eye size={18} aria-hidden="true" /> Live preview</h2>
                <div className="surface-toggle" role="group" aria-label="Preview background">
                  <button type="button" aria-label="Match site background" title="Match site background" aria-pressed={surface === 'system'} onClick={() => setSurface('system')}><Monitor size={15} aria-hidden="true" /></button>
                  <button type="button" aria-label="Light background" title="Light background" aria-pressed={surface === 'light'} onClick={() => setSurface('light')}><Sun size={16} aria-hidden="true" /></button>
                  <button type="button" aria-label="Dark background" title="Dark background" aria-pressed={surface === 'dark'} onClick={() => setSurface('dark')}><Moon size={15} aria-hidden="true" /></button>
                </div>
              </div>
              <div className="preview-area">
                <div className="preview-surface" data-surface={surface}>
                  {failedPreview === previewUrl ? <button type="button" className="quiet-button retry-preview" onClick={() => setFailedPreview('')}>Retry preview</button> : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewUrl} style={{ zoom: zoom / 100 }} alt={`${label.trim() || DEFAULTS.label} badge preview`} onError={() => setFailedPreview(previewUrl)} />
                  )}
                </div>
                <div className="preview-controls">
                  <label className="preview-zoom">
                    <span>Zoom</span>
                    <input type="range" min={100} max={200} step={10} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                    <output aria-hidden="true">{zoom}%</output>
                  </label>
                  <a className="preview-open" href={previewUrl} target="_blank" rel="noreferrer">Open sample SVG <ArrowUpRight size={13} aria-hidden="true" /></a>
                </div>
                <p className="preview-caption">Preview uses a sample count.</p>
              </div>
            </motion.section>

            <motion.section className="workspace-card" {...cardMotion(1, .08)}>
              <div className="card-heading">
                <h2><Code2 size={18} aria-hidden="true" /> Embed badge</h2>
              </div>
              <div className="embed-body">
                <div className="format-options" role="group" aria-label="Embed format">
                  {FORMATS.map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" aria-pressed={format === value} onClick={() => { setFormat(value); setCopyError(false) }}>
                      <Icon size={15} aria-hidden="true" />{label}
                    </button>
                  ))}
                </div>
                <textarea className="embed-code" aria-label={`${format.toUpperCase()} embed code`} readOnly value={output} placeholder={validUsername ? 'Preparing badge link…' : 'Enter a valid GitHub username.'} rows={4} spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
                <div className="embed-actions">
                  <p aria-live="polite">{copyError ? 'Select the text to copy it manually.' : isCopied ? 'Copied to clipboard.' : format === 'url' ? 'Direct link to the live SVG.' : 'Paste into your profile README.'}</p>
                  <button type="button" className="copy-button" disabled={!output} onClick={copyOutput}>
                    {isCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {isCopied ? 'Copied' : format === 'url' ? 'Copy URL' : 'Copy code'}
                  </button>
                </div>
              </div>
            </motion.section>

            {stats && (
              <motion.section className="workspace-card" {...cardMotion(1, .12)}>
                <div className="card-heading"><h2><UsersRound size={18} aria-hidden="true" /> GitHub stats</h2></div>
                <dl className="profile-stats">
                  {Object.entries({ Followers: stats.followers, Following: stats.following, 'Public repos': stats.publicRepos, Stars: stats.totalStars }).map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{formatNumber(value)}</dd></div>
                  ))}
                </dl>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
