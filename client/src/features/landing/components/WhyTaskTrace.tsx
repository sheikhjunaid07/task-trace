import { motion } from 'framer-motion';
import {
  ChartSpline,
  Palette,
  Radio,
  Server,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const CARDS: {
  icon: LucideIcon;
  title: string;
  text: string;
  glow: string;
}[] = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    text: 'Sub-100ms updates. Every drag, drop, and keystroke feels instant — no matter how many cards you stack.',
    glow: '#f59e0b',
  },
  {
    icon: Radio,
    title: 'Real-Time Updates',
    text: 'Everything syncs the moment it happens. Your board is always live, always current, always true.',
    glow: 'var(--success)',
  },
  {
    icon: Workflow,
    title: 'Flexible Workflows',
    text: 'Kanban, lists, and custom stages. Shape TaskTrace around the way your team actually works.',
    glow: 'var(--accent)',
  },
  {
    icon: Palette,
    title: 'Beautiful Interface',
    text: 'A crafted interface with thoughtful typography, subtle depth, and zero visual noise.',
    glow: 'var(--accent-2)',
  },
  {
    icon: ChartSpline,
    title: 'Powerful Insights',
    text: 'Velocity, burn-down, and completion trends — rendered beautifully, updated automatically.',
    glow: '#06b6d4',
  },
  {
    icon: Server,
    title: 'Built for Scale',
    text: 'From 3-person startups to 3,000-person orgs. Infrastructure that grows with your ambition.',
    glow: '#a855f7',
  },
];

export function WhyTaskTrace() {
  return (
    <section id="why" className="relative overflow-hidden py-28 lg:py-36">
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why TaskTrace"
          title={
            <>
              Designed for teams that
              <br className="hidden sm:block" /> care about <span className="lp-text-gradient">execution.</span>
            </>
          }
          description="Not another tool to fight with. A workspace engineered to get out of your way and keep you in flow."
        />

        <div className="mt-20 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.1} className="h-full">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="group relative h-full rounded-3xl border border-edge bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-8 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]"
              >
                <div
                  className="absolute -top-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle, color-mix(in srgb, ${c.glow} 22%, transparent), transparent 70%)` }}
                />
                <span
                  className="relative flex h-13 w-13 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                  style={{
                    background: `color-mix(in srgb, ${c.glow} 12%, transparent)`,
                    boxShadow: `0 0 0 1px color-mix(in srgb, ${c.glow} 22%, transparent)`,
                  }}
                >
                  <c.icon className="h-6 w-6" style={{ color: c.glow }} />
                </span>
                <h3 className="relative mt-7 text-[20px] font-bold tracking-tight text-ink">
                  {c.title}
                </h3>
                <p className="relative mt-3 text-[14.5px] leading-relaxed text-mute">{c.text}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
