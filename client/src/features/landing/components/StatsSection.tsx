import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useCountUp } from './ui/useCountUp';
import { Reveal } from './ui/Reveal';

interface Stat {
  target: number;
  decimals?: number;
  suffix: string;
  label: string;
  trend?: string;
}

const STATS: Stat[] = [
  { target: 50, suffix: 'K+', label: 'Tasks Completed', trend: '+18% this quarter' },
  { target: 98, suffix: '%', label: 'Customer Satisfaction' },
  { target: 120, suffix: '+', label: 'Countries' },
  { target: 99.9, decimals: 1, suffix: '%', label: 'Availability', trend: '12 months running' },
];

function StatItem({ stat, delay }: { stat: Stat; delay: number }) {
  const { ref } = useCountUp(stat.target, 1900, stat.decimals ?? 0);

  return (
    <Reveal delay={delay} className="flex flex-col items-center gap-3 px-4 text-center">
      <span className="lp-stat-num text-ink">
        <span ref={ref}>{stat.decimals ? (0).toFixed(stat.decimals) : '0'}</span>
        <span className="lp-text-gradient">{stat.suffix}</span>
      </span>
      <span className="text-[14px] font-semibold tracking-wide text-mute">{stat.label}</span>
      {stat.trend && (
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-1 text-[11px] font-bold" style={{ color: 'var(--success)' }}>
          <TrendingUp className="h-3 w-3" />
          {stat.trend}
        </span>
      )}
    </Reveal>
  );
}

export function StatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-edge py-24 lg:py-32">
      <div
        className="lp-blob left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 8%, transparent), transparent 62%)' }}
      />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto grid max-w-[1240px] grid-cols-1 gap-y-16 px-5 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className={i > 0 ? 'lg:border-l lg:border-edge' : ''}
          >
            <StatItem stat={s} delay={i * 0.08} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}