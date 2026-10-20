import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Kanban, Menu, X, ArrowRight } from 'lucide-react';
import ThemeSwitcher from '../../../theme/ThemeSwitcher';
import { useAppSelector } from '../../../app/hooks';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useMotionValueEvent(scrollY, 'change', (v: number) => setScrolled(v > 24));

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div
          className={`mt-3 flex h-14 items-center justify-between rounded-2xl px-3 transition-all duration-500 sm:px-4 ${
            scrolled
              ? 'lp-glass shadow-md'
              : 'border border-transparent bg-transparent'
          }`}
        >
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="brand-mark h-8 w-8">
              <Kanban className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-ink">
              TaskTrace
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-[13.5px] font-medium text-mute transition-colors hover:bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)] hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn btn-primary hidden h-9 rounded-full px-5 sm:inline-flex"
              >
                Open App
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-9 items-center rounded-full px-4 text-[13.5px] font-medium text-mute transition-colors hover:text-ink sm:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary hidden h-9 rounded-full px-5 text-[13.5px] sm:inline-flex"
                >
                  Get Started
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="icon-btn flex h-9 w-9 lg:!hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-page/95 px-6 pb-12 pt-24 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.35 }}
                  className="rounded-xl px-2 py-3 text-2xl font-bold tracking-tight text-ink transition-colors hover:text-accent"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="mt-10 flex flex-col gap-3"
            >
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary h-12 w-full rounded-full text-[15px]"
                >
                  Open App
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary h-12 w-full rounded-full text-[15px]"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="btn btn-surface h-12 w-full rounded-full text-[15px]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
