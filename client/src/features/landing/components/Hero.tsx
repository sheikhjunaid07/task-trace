import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { HeroKanban } from './HeroKanban';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const AVATARS = [
  'linear-gradient(135deg,#8b5cf6,#a855f7)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#22c55e,#10b981)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const kanbanY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh items-center overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-40"
    >
      {/* backdrop layers */}
      <div className="lp-grid-bg absolute inset-0" />
      <div
        className="lp-blob -top-32 right-[-10%] h-[560px] w-[560px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent), transparent 65%)',
        }}
      />
      <div
        className="lp-blob bottom-[-20%] left-[-12%] h-[480px] w-[480px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent-2) 18%, transparent), transparent 65%)',
        }}
      />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1240px] items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* ——— copy ——— */}
        <motion.div variants={container} initial="hidden" animate="show" style={{ y: isDesktop ? textY : 0 }}>
          <motion.div variants={item}>
            <span className="lp-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-accent" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-[12px] sm:text-[12.5px] font-semibold tracking-wide text-ink">
                Modern Project Management
              </span>
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="lp-hero-title mt-5 sm:mt-6 text-ink"
          >
            Work flows better{' '}
            <br className="hidden sm:inline" />
            when everything{' '}
            <br className="hidden sm:inline" />
            <span className="lp-text-gradient">flows together.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 sm:mt-6 max-w-lg text-[15.5px] sm:text-[17.5px] leading-relaxed text-mute"
          >
            TaskTrace brings instant tasks, real-time collaboration, and fluid Kanban workflows into one distraction-free workspace.
          </motion.p>

          <motion.div variants={item} className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
            <Link
              to="/register"
              className="btn btn-primary h-12 sm:h-13 w-full sm:w-auto rounded-full px-8 py-3.5 text-[15.5px] font-bold shadow-[0_12px_32px_-8px_var(--glow)] hover:shadow-[0_18px_40px_-6px_var(--glow)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#product"
              className="btn lp-glass h-12 sm:h-13 w-full sm:w-auto rounded-full px-7 py-3.5 text-[14.5px] font-semibold text-ink/85 hover:text-ink hover:bg-white/[0.08] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
                <Play className="h-3 w-3 fill-current" />
              </span>
              <span>Explore Features</span>
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-x-6">
            <div className="flex items-center gap-3">
              <div className="flex">
                {AVATARS.map((g, i) => (
                  <span
                    key={i}
                    className="lp-avatar-ring -ml-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[10px] sm:text-[11px] font-bold text-white first:ml-0"
                    style={{ backgroundImage: g }}
                  >
                    {['A', 'L', 'M', 'S', 'K'][i]}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-warning" style={{ color: 'var(--warning)' }} />
                  ))}
                </div>
                <p className="mt-0.5 text-[12px] sm:text-[12.5px] font-medium text-mute">
                  Loved by 500+ high-velocity teams
                </p>
              </div>
            </div>
            <div className="hidden sm:block h-4 w-px bg-edge" />
            <p className="text-[12px] sm:text-[12.5px] font-medium text-mute">
              Free forever plan · No credit card required
            </p>
          </motion.div>
        </motion.div>

        {/* ——— animated kanban ——— */}
        <motion.div style={{ y: isDesktop ? kanbanY : 0 }} className="relative lg:pl-4">
          <HeroKanban />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-faint">
          Scroll
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-[color-mix(in_srgb,var(--text-1)_12%,transparent)]">
          <span className="lp-scroll-cue absolute inset-x-0 h-1/2 bg-accent" />
        </span>
      </motion.div>
    </section>
  );
}
