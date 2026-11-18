import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'githubump',
  description: 'Self-hosted profile view badges for GitHub, GitLab, Forgejo, Gitea, and Codeberg.',
  icons: {
    icon: ['light', 'dark'].map((theme) => ({
      url: `/img/icon/githubump_icon_${theme}.png`,
      type: 'image/png',
      sizes: '64x64',
      media: `(prefers-color-scheme: ${theme})`,
    })),
  },
  openGraph: {
    title: 'githubump',
    description: 'Create profile view and public repository badges for your README',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#111018' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
