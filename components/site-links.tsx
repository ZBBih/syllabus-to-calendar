'use client'

import { useState } from 'react'
import { Coffee, Gmail, Instagram, LinkedIn } from './icons'

/**
 * Where to find the person who made this.
 *
 * Everything here is an outbound link, so nothing is fetched from another origin and the
 * page's content security policy stays as tight as it is. The brand marks are inline paths
 * for the same reason.
 */

export const EMAIL = 'zbweiss1645@gmail.com'

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/zbweiss1645/', icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/zach-d-weiss/', icon: LinkedIn },
] as const

/**
 * Paste a tip-jar link here to switch the support button on, for example
 * 'https://buymeacoffee.com/yourhandle' or a Ko-fi or PayPal.me address.
 * While it is empty nothing renders, so the page never shows a dead link.
 */
export const SUPPORT_URL = 'https://ko-fi.com/zachdweiss'

export function SocialLinks({ size = 16, className = '' }: { size?: number; className?: string }) {
  const [copied, setCopied] = useState(false)

  /**
   * The address, copied, rather than a mailto: link.
   *
   * A mailto does nothing at all on a phone with no mail account set up and inside every
   * in-app browser, which is most of the ways this page gets opened. Handing over the address
   * always works, and it is what someone tapping a mail icon wanted anyway.
   */
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard permission: fall back to the mail client, which may still be there.
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <div className={`relative flex items-center gap-0.5 ${className}`}>
      {SOCIALS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Zach on ${label}`}
          title={label}
          className="icon-btn"
        >
          <Icon size={size} />
        </a>
      ))}
      <button type="button" onClick={copyEmail} aria-label={`Copy Zach's email, ${EMAIL}`} title={EMAIL} className="icon-btn">
        <Gmail size={size} />
      </button>
      {copied && (
        <span role="status" className="pill pill-ok absolute right-0 top-full mt-1 whitespace-nowrap">
          Email copied
        </span>
      )}
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
