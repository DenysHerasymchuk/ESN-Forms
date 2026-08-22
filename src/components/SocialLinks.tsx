import { FaFacebook, FaInstagram } from 'react-icons/fa6'

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/esnbelgium',
    Icon: FaInstagram,
    colorClass: 'bg-esn-pink',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/esn.belgium',
    Icon: FaFacebook,
    colorClass: 'bg-esn-blue',
  },
]

export function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {socialLinks.map(({ label, href, Icon, colorClass }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-[1.04] ${colorClass}`}
        >
          <Icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  )
}
