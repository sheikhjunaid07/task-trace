import { Link } from 'react-router-dom';
import { Kanban } from 'lucide-react';

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GITHUB_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LINKEDIN_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const YOUTUBE_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SOCIALS = [
  { label: 'X (Twitter)', icon: X_ICON, href: 'https://x.com' },
  { label: 'GitHub', icon: GITHUB_ICON, href: 'https://github.com' },
  { label: 'LinkedIn', icon: LINKEDIN_ICON, href: 'https://linkedin.com' },
  { label: 'YouTube', icon: YOUTUBE_ICON, href: 'https://youtube.com' },
];

interface FooterItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isRoute?: boolean;
}

const LINKS: { title: string; items: FooterItem[] }[] = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '#features' },
      { label: 'Workflow', href: '#workflow' },
      { label: 'Product Tour', href: '#product' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Why TaskTrace', href: '#why' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'Sign In', href: '/login', isRoute: true },
      { label: 'Register', href: '/register', isRoute: true },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Documentation', href: '#features' },
      { label: 'Keyboard Shortcuts', href: '#product' },
      { label: 'System Uptime', href: '#why' },
      { label: 'Community', href: 'https://github.com', isExternal: true },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-edge">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="brand-mark h-8 w-8">
                <Kanban className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <span className="text-[17px] font-extrabold tracking-tight text-ink">TaskTrace</span>
            </Link>
            <p className="mt-4 text-[13.5px] leading-relaxed text-mute">
              The collaborative workspace where modern teams ship work that matters.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge text-mute transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {LINKS.map((col) => (
              <div key={col.title}>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-mute">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      {item.isRoute ? (
                        <Link
                          to={item.href}
                          className="text-[13.5px] font-medium text-mute transition-colors hover:text-ink"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          target={item.isExternal ? '_blank' : undefined}
                          rel={item.isExternal ? 'noopener noreferrer' : undefined}
                          className="text-[13.5px] font-medium text-mute transition-colors hover:text-ink"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-edge pt-7 sm:flex-row">
          <p className="text-[12.5px] font-medium text-mute">
            © 2026 TaskTrace, Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-[12.5px] font-medium text-mute">
            <a href="#why" className="transition-colors hover:text-ink">Privacy</a>
            <a href="#why" className="transition-colors hover:text-ink">Terms</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}