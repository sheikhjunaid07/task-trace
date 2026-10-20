import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Reveal } from './ui/Reveal';

const BLOBS = [
  {
    size: 620,
    top: '-18%',
    left: '8%',
    color: 'rgba(139,92,246,0.5)',
    duration: 19,
    drift: { x: 140, y: 90 },
  },
  {
    size: 520,
    top: '20%',
    left: '62%',
    color: 'rgba(168,85,247,0.4)',
    duration: 24,
    drift: { x: -170, y: 110 },
  },
  {
    size: 460,
    top: '46%',
    left: '30%',
    color: 'rgba(99,102,241,0.34)',
    duration: 27,
    drift: { x: 150, y: -120 },
  },
  {
    size: 380,
    top: '8%',
    left: '44%',
    color: 'rgba(217,70,239,0.26)',
    duration: 21,
    drift: { x: -110, y: 70 },
  },
];

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32 lg:py-44">
      {/* animated gradient mesh */}
      <div
        className="absolute inset-0"
        style={{ background: 'color-mix(in srgb, #07070c 92%, var(--bg))' }}
      />
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="lp-blob"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle, ${b.color}, transparent 62%)`,
          }}
          animate={{ x: [0, b.drift.x, 0], y: [0, b.drift.y, 0], scale: [1, 1.15, 1] }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      <div className="lp-noise" />

      {/* focal glow behind the copy */}
      <div
        className="absolute left-1/2 top-1/2 h-[520px] w-[920px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 13%, transparent), transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <span className="lp-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink">
            <span className="relative flex h-1.5 w-1.5">
              <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Join 500+ teams already in flow
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="lp-hero-title mt-8 text-white">
            Ready to bring clarity
            <br />
            to your <span className="lp-text-gradient">workflow?</span>
          </h2>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-white/55">
            Join teams that move faster with TaskTrace. Set up your first board
            in under a minute — no credit card required.
          </p>
        </Reveal>

        <Reveal delay={0.26}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="btn btn-primary h-14 rounded-full px-9 text-[15.5px] font-semibold"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="btn lp-glass h-14 rounded-full px-8 text-[15px] font-semibold text-white"
            >
              <CalendarClock className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              Book Demo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.34}>
          <p className="mt-8 text-[12.5px] font-medium text-white/35">
            Free forever plan · Cancel anytime · 2-minute setup
          </p>
        </Reveal>
      </div>
    </section>
  );
}