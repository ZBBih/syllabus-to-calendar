import { Coffee, Gmail, Instagram, LinkedIn } from './icons'

/**
 * Where to find the person who made this.
 *
 * Everything here is an outbound link, so nothing is fetched from another origin and the
 * page's content security policy stays as tight as it is. The brand marks are inline paths
 * for the same reason.
 */

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/zbweiss1645/', icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/zach-d-weiss/', icon: LinkedIn },
  { label: 'Gmail', href: 'mailto:zbweiss1645@gmail.com', icon: Gmail },
] as const

/**
 * Paste a tip-jar link here to switch the support button on, for example
 * 'https://buymeacoffee.com/yourhandle' or a Ko-fi or PayPal.me address.
 * While it is empty nothing renders, so the page never shows a dead link.
 */
export const SUPPORT_URL = 'https://ko-fi.com/zachdweiss'

export function SocialLinks({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {SOCIALS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel="noreferrer noopener"
          aria-label={label === 'Gmail' ? 'Email Zach' : `Zach on ${label}`}
          title={label === 'Gmail' ? 'zbweiss1645@gmail.com' : label}
          className="icon-btn"
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  )
}

/** The whole app is free. This is the only place that mentions money, and it asks for nothing. */
export function SupportLink({ className = '' }: { className?: string }) {
  if (!SUPPORT_URL) return null
  return (
    <a href={SUPPORT_URL} target="_blank" rel="noreferrer noopener" className={`btn btn-secondary btn-sm ${className}`}>
      <Coffee size={14} /> Buy me a coffee
    </a>
  )
}
