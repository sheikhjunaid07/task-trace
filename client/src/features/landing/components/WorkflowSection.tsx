import { useRef } from 'react';
import React from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  ArrowDown,
  ChevronRight,
  ClipboardList,
  CodeXml,
  Eye,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const STAGES = [
  { icon: Lightbulb, title: 'Idea', caption: 'Capture every spark' },
  { icon: ClipboardList, title: 'Planning', caption: 'Structure the work' },
  { icon: CodeXml, title: 'Development', caption: 'Build in the flow' },
  { icon: Eye, title: 'Review', caption: 'Polish together' },
  { icon: Rocket, title: 'Completed', caption: 'Ship with confidence' },
];

const NODE_X = [5, 27.5, 50, 72.5, 95];
const CHEVRON_X = [16.25, 38.75, 61.25, 83.75];

function DesktopNode({
  stage,
  i,
  progress,
}: {
  stage: (typeof STAGES)[number];
  i: number;
  progress: MotionValue<number>;
}) {
  const start = i * 0.17;
  const opacity = useTransform(progress, [start, start + 0.09], [0.18, 1]);
  const scale = useTransform(progress, [start, start + 0.09], [0.72, 1]);
  const glow = useTransform(progress, [start, start + 0.09], [0, 1]);
  const shadow = useTransform(
    glow,
    (v) =>
      `0 0 0 1px color-mix(in srgb, var(--accent) ${Math.round(14 + v * 40)}%, transparent), 0 0 ${Math.round(18 + v * 30)}px ${Math.round(4 + v * 8)}px color-mix(in srgb, var(--glow) ${Math.round(16 + v * 30)}%, transparent)`
  );

  return (
    <motion.div
      style={{ left: `${NODE_X[i]}%`, opacity, scale }}
      className="absolute top-0 -translate-x-1/2"
    >
      <motion.div
        style={{ boxShadow: shadow }}
        className="lp-glass-deep relative flex h-16 w-16 items-center justify-center rounded-2xl"
      >
        <stage.icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
        {i === 4 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
            <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-success" />
          </span>
        )}
      </motion.div>
      <div className="mt-5 text-center">
        <p className="text-[15px] font-bold tracking-tight text-ink">
          {stage.title}
        </p>
        <p className="mt-1 text-[11.5px] font-medium text-mute">
          {stage.caption}
        </p>
      </div>
    </motion.div>
  );
}

function Chevron({ x, progress }: { x: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [x - 0.02, x], [0, 1]);
  return (
    <motion.span style={{ left: `${x * 100}%`, opacity }} className="absolute top-7 -translate-x-1/2">
      <ChevronRight className="h-4 w-4 text-mute" />
    </motion.span>
  );
}

function DesktopLine({ progress }: { progress: MotionValue<number> }) {
  const cometX = useTransform(progress, [0.01, 0.99], ['4.5%', '95.5%']);
  const cometOpacity = useTransform(progress, [0.01, 0.06], [0, 1]);

  return (
    <div className="relative mt-10 h-16">
      <svg
        className="absolute left-0 right-0 top-8 h-2 w-full"
        viewBox="0 0 1000 8"
        preserveAspectRatio="none"
        fill="none"
      >
        <line x1="50" y1="4" x2="950" y2="4" stroke="rgba(255,255,255,0.09)" strokeWidth="2" />
        <line
          x1="50"
          y1="4"
          x2="950"
          y2="4"
          stroke="rgba(139,92,246,0.55)"
          strokeWidth="2"
          strokeLinecap="round"
          className="lp-flow-dash"
        />
        <motion.path
          d="M 50 4 L 950 4"
          stroke="url(#flowGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ pathLength: progress }}
        />
                <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>

      {CHEVRON_X.map((x, i) => (
        <Chevron key={i} x={x / 100} progress={progress} />
      ))}

      <motion.span
        style={{ left: cometX, opacity: cometOpacity }}
        className="absolute top-[26px] -translate-x-1/2"
      >
        <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
        <span
          className="absolute inset-0 -z-10 rounded-full"
          style={{
            background:
              'radial-gradient(circle, var(--glow), transparent 70%)',
            filter: 'blur(6px)',
            transform: 'scale(2.6)',
          }}
        />
      </motion.span>
    </div>
  );
}

export function WorkflowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  const { scrollYProgress } = useScroll(
    isDesktop
      ? {
          target: ref,
          offset: ['start 0.78', 'end 0.55'],
        }
      : undefined
  );

  return (
    <section
      id="workflow"
      ref={ref}
      className="relative overflow-hidden py-24 lg:py-32 scroll-mt-24"
      style={{ background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))' }}
    >
      {/* cinematic backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 460px at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%), radial-gradient(700px 380px at 90% 110%, color-mix(in srgb, var(--accent-2) 9%, transparent), transparent 60%), radial-gradient(600px 320px at 5% 90%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 60%)',
        }}
      />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="The flow"
          title={
            <>
              From idea to shipped,
              <br className="hidden sm:block" /> without <span className="lp-text-gradient">friction.</span>
            </>
          }
          description="A workflow that mirrors how great teams actually work — every stage visible, every handoff effortless."
        />

        {/* desktop pipeline */}
        <div className="relative mt-24 hidden lg:block">
          <DesktopLine progress={scrollYProgress} />
          <div className="relative h-[340px]">
            {STAGES.map((s, i) => (
              <DesktopNode key={s.title} stage={s} i={i} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* mobile pipeline */}
        <div className="relative mt-20 flex flex-col items-center lg:hidden">
          <div className="relative flex flex-col gap-10">
            {STAGES.map((s, i) => (
              <React.Fragment key={s.title}>
                <Reveal delay={i * 0.08} y={24}>
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      initial={{ scale: 0.85 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="lp-glass-deep flex h-16 w-16 items-center justify-center rounded-2xl"
                    >
                      <s.icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold tracking-tight text-ink">{s.title}</p>
                      <p className="mt-1 text-[11.5px] font-medium text-mute">{s.caption}</p>
                    </div>
                  </div>
                </Reveal>
                {i < STAGES.length - 1 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="-my-6 flex justify-center"
                  >
                    <ArrowDown
                      className="h-4 w-4 text-mute"
                      style={{ animation: 'lp-float 2.4s ease-in-out infinite' }}
                    />
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
