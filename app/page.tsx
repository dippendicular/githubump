import BadgeGenerator from '@/components/badge-generator'

export const metadata = {
  title: 'GitHub Counter',
  description: 'Generate a custom GitHub-compatible profile views counter badge',
}

export default function Home() {
  return <BadgeGenerator />
}
