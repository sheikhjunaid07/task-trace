import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  CircleCheck,
  MessageSquare,
  MousePointer2,
  Radio,
  Signal,
  SquareKanban,
  ChartColumn,
  ListChecks,
  TrendingUp,
  Waypoints,
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

/* ─────────────────────────── mockup frame ─────────────────────────── */

function MockupFrame({
  label,
  children,
  glow = 'var(--accent)',
  className = '',
}: {
  label: string;
  children: ReactNode;
  glow?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute -inset-4 sm:-inset-8 rounded-[40px] opacity-70"
        style={{
          background: `radial-gradient(52% 48% at 50% 42%, color-mix(in srgb, ${glow} 12%, transparent), transparent 72%)`,
          filter: 'blur(24px)',
        }}
      />
      <div className="lp-glass-deep relative rounded-[26px] p-3">
        <div className="flex items-center gap-1.5 px-2 pb-3 pt-1">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]/60" />
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]/60" />
          <span className="h-2 w-2 rounded-full bg-[#22c55e]/60" />
          <span className="ml-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            {label}
          </span>
        </div>
        <div className="lp-glass overflow-hidden rounded-[18px]">{children}</div>
      </div>
    </div>
  );
}

function MiniAvatar({ gradient, letter, size = 24 }: { gradient: string; letter: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        backgroundImage: gradient,
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
    >
      {letter}
    </span>
  );
}

/* ─────────────────────────── 1 · collaboration ─────────────────────────── */

function CollabMockup() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]">
            <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
          </span>
          <div>
            <p className="text-[12px] font-bold text-ink"># product-launch</p>
            <p className="text-[9.5px] font-medium text-faint">14 members</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-2.5 py-1 text-[9.5px] font-bold" style={{ color: 'var(--success)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-end gap-2">
          <MiniAvatar gradient="linear-gradient(135deg,#8b5cf6,#a855f7)" letter="A" />
          <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-2">
            <p className="text-[11px] leading-relaxed text-ink">
              Onboarding copy is updated — ready for review ✨
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <MiniAvatar gradient="linear-gradient(135deg,#ec4899,#f472b6)" letter="L" />
          <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-[color-mix(in_srgb,var(--text-1)_7%,transparent)] px-3 py-2">
            <p className="text-[11px] leading-relaxed text-ink">Loving the new flow. Checking it now.</p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <MiniAvatar gradient="linear-gradient(135deg,#f59e0b,#f97316)" letter="M" />
          <div className="rounded-2xl rounded-bl-md bg-[color-mix(in_srgb,var(--text-1)_7%,transparent)] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
              Maya is typing
              <span className="flex gap-[3px]">
                <span className="typing-dot" style={{ width: 3.5, height: 3.5 }} />
                <span className="typing-dot" style={{ width: 3.5, height: 3.5 }} />
                <span className="typing-dot" style={{ width: 3.5, height: 3.5 }} />
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] px-3 py-2.5">
        <span className="flex items-center gap-2 text-[10px] font-medium text-mute">
          <MousePointer2 className="h-3 w-3" style={{ color: 'var(--accent)' }} />
          Liam is editing <span className="font-bold text-ink">Landing copy</span>
        </span>
        <span className="flex items-center gap-2 text-[10px] font-medium text-mute">
          <Signal className="h-3 w-3" style={{ color: 'var(--success)' }} />
          synced
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── 2 · kanban boards ─────────────────────────── */

function KanbanMockup() {
  const cols: { name: string; color: string; cards: { t: string; d?: boolean; done?: boolean }[] }[] = [
    {
      name: 'To Do',
      color: '#8b5cf6',
      cards: [{ t: 'Wireframes v2' }, { t: 'Empty states' }],
    },
    {
      name: 'Doing',
      color: '#f59e0b',
      cards: [{ t: 'Onboarding', d: true }, { t: 'Auth refactor' }],
    },
    {
      name: 'Done',
      color: '#22c55e',
      cards: [{ t: 'Invite links', done: true }, { t: 'Mentions', done: true }],
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 p-3 sm:gap-2.5 sm:p-5">
      {cols.map((c) => (
        <div
          key={c.name}
          className="flex flex-col gap-1.5 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-1.5 sm:gap-2 sm:p-2"
        >
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
            <span className="text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-mute truncate">{c.name}</span>
          </div>
          {c.cards.map((card) => (
            <motion.div
              key={card.t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-lg border border-edge bg-card px-1.5 py-1.5 sm:px-2.5 sm:py-2"
              style={{
                transform: card.d ? 'rotate(2.5deg) translateY(-3px)' : undefined,
                boxShadow: card.d ? '0 14px 28px -10px rgba(0,0,0,0.45)' : undefined,
                borderColor: card.d ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : undefined,
              }}
            >
              <p className="text-[8px] sm:text-[9px] font-semibold text-ink leading-snug">{card.t}</p>
              {card.done && (
                <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-bold" style={{ color: 'var(--success)' }}>
                  <CircleCheck className="h-2.5 w-2.5" /> done
                </span>
              )}
            </motion.div>
          ))}
          {c.name === 'Doing' && (
            <div className="flex h-8 items-center justify-center rounded-lg border border-dashed border-edge-strong text-[8px] font-semibold text-faint">
              drop here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── 3 · smart analytics ─────────────────────────── */

function AnalyticsMockup() {
  const bars = [34, 52, 44, 66, 58, 78, 71, 92, 84, 100];
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Completion rate</p>
          <p className="mt-1 flex items-baseline gap-2 text-[28px] font-extrabold tracking-tight text-ink">
            87%
            <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-2 py-0.5 text-[9.5px] font-bold" style={{ color: 'var(--success)' }}>
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-1 text-[9.5px] font-bold" style={{ color: 'var(--accent)' }}>
          This week
        </span>
      </div>

      <div className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 origin-bottom rounded-t-[4px]"
            style={{
              height: `${h}%`,
              background:
                i === bars.length - 1
                  ? 'linear-gradient(180deg,#a855f7,#8b5cf6)'
                  : 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 26%, transparent), color-mix(in srgb, var(--accent) 9%, transparent))',
            }}
          />
        ))}
      </div>

      <svg viewBox="0 0 240 44" className="h-11 w-full">
        <motion.path
          d="M2 36 L30 32 L56 34 L84 26 L112 28 L140 18 L168 20 L196 10 L224 12 L238 6"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
        <motion.circle
          r="3.5"
          fill="#a855f7"
          initial={{ opacity: 0, cx: 2, cy: 36 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.5 }}
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────── 4 · task management ─────────────────────────── */

function TasksMockup() {
  const tasks = [
    { t: 'Ship invite links', done: true, prio: '#22c55e' },
    { t: 'Write onboarding copy', done: true, prio: '#8b5cf6' },
    { t: 'Design empty states', done: false, prio: '#f59e0b' },
    { t: 'Launch analytics', done: false, prio: '#ef4444' },
  ];
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink">Sprint 24</p>
        <span className="text-[10px] font-medium text-faint">8 of 12 done</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: '67%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#8b5cf6,#a855f7)' }}
        />
      </div>

      <div className="mt-1 flex flex-col gap-2">
        {tasks.map((task, i) => (
          <motion.div
            key={task.t}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] px-3 py-2.5"
          >
            <motion.span
              initial={false}
              whileInView={{ scale: task.done ? [1, 1.25, 1] : 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
              style={{
                background: task.done ? 'var(--success)' : 'transparent',
                borderColor: task.done ? 'var(--success)' : 'var(--border-strong)',
              }}
            >
              {task.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
            </motion.span>
            <p
              className={`flex-1 text-[11px] font-semibold ${task.done ? 'text-faint' : 'text-ink'}`}
              style={{ textDecoration: task.done ? 'line-through' : 'none' }}
            >
              {task.t}
            </p>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: task.prio }} />
            <span className="text-[9px] font-medium text-faint">{task.done ? 'done' : 'Fri'}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── 5 · team presence ─────────────────────────── */

function PresenceMockup() {
  const orbit = [
    { g: 'linear-gradient(135deg,#8b5cf6,#a855f7)', l: 'A', top: '-6%', left: '30%' },
    { g: 'linear-gradient(135deg,#ec4899,#f472b6)', l: 'L', top: '18%', left: '86%' },
    { g: 'linear-gradient(135deg,#22c55e,#10b981)', l: 'M', top: '58%', left: '92%' },
    { g: 'linear-gradient(135deg,#3b82f6,#06b6d4)', l: 'S', top: '68%', left: '22%' },
  ];
  return (
    <div className="flex flex-col items-center gap-5 p-5">
      <div className="relative flex h-44 w-44 items-center justify-center">
        {[1, 0.72, 0.46].map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full border"
            style={{
              width: 176 * s,
              height: 176 * s,
              borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)',
            }}
          />
        ))}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-edge-strong bg-card">
          <span className="relative flex h-3 w-3">
            <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
          </span>
        </span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-8 text-center">
          <p className="text-[15px] font-extrabold text-ink">12</p>
          <p className="text-[8.5px] font-semibold uppercase tracking-wider text-faint">online now</p>
        </span>

        {orbit.map((o, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            className="absolute"
            style={{ top: o.top, left: o.left }}
          >
            <span className="relative flex">
              <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-accent/50" style={{ animationDelay: `${i * 0.5}s` }} />
              <MiniAvatar gradient={o.g} letter={o.l} size={30} />
            </span>
          </motion.span>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] px-3 py-2">
        <Radio className="h-3 w-3" style={{ color: 'var(--success)' }} />
        <span className="text-[10px] font-medium text-mute">
          Maya is editing <span className="font-bold text-ink">Product Roadmap</span>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── 6 · activity timeline ─────────────────────────── */

function ActivityMockup() {
  const events = [
    { icon: CircleCheck, color: 'var(--success)', text: 'Ava completed “Design review”', time: '2m ago' },
    { icon: Waypoints, color: 'var(--accent)', text: 'Liam moved 3 tasks to Done', time: '14m ago' },
    { icon: MessageSquare, color: 'var(--accent-2)', text: 'Maya commented on “Landing”', time: '31m ago' },
    { icon: Radio, color: 'var(--warning)', text: 'Sara joined the board', time: '1h ago' },
  ];
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink">Recent activity</p>
        <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-1 text-[9px] font-bold" style={{ color: 'var(--accent)' }}>
          <span className="relative flex h-1 w-1">
            <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-accent" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-accent" />
          </span>
          live
        </span>
      </div>

      <div className="relative flex flex-col gap-4 pl-5">
        <motion.span
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute bottom-1 left-[9px] top-1 w-px origin-top bg-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
        />
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center gap-3"
          >
            <span
              className="absolute -left-5 flex h-[18px] w-[18px] items-center justify-center rounded-full"
              style={{ background: 'var(--bg)', boxShadow: `0 0 0 2px ${e.color}55` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--text-1)_7%,transparent)]">
              <e.icon className="h-3.5 w-3.5" style={{ color: e.color }} />
            </span>
            <p className="flex-1 text-[10.5px] font-medium text-ink">{e.text}</p>
            <span className="text-[9px] font-medium text-faint">{e.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── feature data ─────────────────────────── */

interface Feature {
  index: string;
  icon: typeof Signal;
  title: string;
  description: string;
  bullets: string[];
  glow: string;
  mockup: ReactNode;
}

const FEATURES: Feature[] = [
  {
    index: '01',
    icon: Signal,
    title: 'Real-Time Collaboration',
    description:
      'Work together instantly with live updates, comments, and team activity.',
    bullets: ['Live cursors & typing indicators', 'Threaded comments on every task', 'Instant sync across all devices'],
    glow: 'var(--accent)',
    mockup: <CollabMockup />,
  },
  {
    index: '02',
    icon: SquareKanban,
    title: 'Kanban Boards',
    description:
      'Drag, organize, prioritize, and ship faster.',
    bullets: ['Buttery drag & drop with fractional ordering', 'Custom columns for any workflow', 'Keyboard-first power moves'],
    glow: '#f59e0b',
    mockup: <KanbanMockup />,
  },
  {
    index: '03',
    icon: ChartColumn,
    title: 'Smart Analytics',
    description:
      'Track productivity and project velocity in real time.',
    bullets: ['Velocity & burn-down insights', 'Completion rate at a glance', 'Trends that update as you work'],
    glow: 'var(--accent-2)',
    mockup: <AnalyticsMockup />,
  },
  {
    index: '04',
    icon: ListChecks,
    title: 'Task Management',
    description:
      'Assign owners, due dates, priorities, and progress tracking.',
    bullets: ['Priorities from low to critical', 'Due dates with smart reminders', 'Progress tracking on every card'],
    glow: 'var(--success)',
    mockup: <TasksMockup />,
  },
  {
    index: '05',
    icon: Radio,
    title: 'Team Presence',
    description:
      'See who is online and collaborating right now.',
    bullets: ['Live presence on every board', 'Know who is editing what, when', 'Effortless async handoffs'],
    glow: '#22c55e',
    mockup: <PresenceMockup />,
  },
  {
    index: '06',
    icon: Waypoints,
    title: 'Activity Timeline',
    description:
      'Every action recorded with beautiful visual history.',
    bullets: ['Complete audit trail by default', 'Beautiful visual history', 'Replay any moment of your project'],
    glow: 'var(--accent)',
    mockup: <ActivityMockup />,
  },
];

/* ─────────────────────────── section ─────────────────────────── */

export function FeatureShowcase() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-24 lg:py-32 scroll-mt-24">
      <div className="lp-blob right-[-15%] top-24 h-[520px] w-[520px]" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 9%, transparent), transparent 65%)' }} />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything your team needs
              <br className="hidden sm:block" /> to stay <span className="lp-text-gradient">aligned.</span>
            </>
          }
          description="Six capabilities, one seamless surface. TaskTrace is built to disappear into your workflow while keeping every signal visible."
        />

        <div className="mt-14 sm:mt-24 flex flex-col gap-16 sm:gap-24 lg:gap-36">
          {FEATURES.map((f, i) => (
            <div
              key={f.index}
              className={`grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20 ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* mockup side */}
              <Reveal x={i % 2 === 1 ? 60 : -60} y={0}>
                <MockupFrame label={f.title} glow={f.glow}>
                  {f.mockup}
                </MockupFrame>
              </Reveal>

              {/* text side */}
              <Reveal x={i % 2 === 1 ? -60 : 60} y={0} delay={0.1}>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl lp-glass">
                      <f.icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                    </span>
                    <span className="text-[15px] font-bold tracking-[0.18em]" style={{ color: 'color-mix(in srgb, var(--text-1) 22%, transparent)' }}>
                      {f.index}
                    </span>
                  </div>
                  <h3 className="lp-feature-title text-ink">{f.title}</h3>
                  <p className="max-w-md text-[16.5px] leading-relaxed text-mute">{f.description}</p>
                  <ul className="flex flex-col gap-3">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-[14.5px] font-medium text-ink/85">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)]">
                          <Check className="h-3 w-3" strokeWidth={3} style={{ color: 'var(--success)' }} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a href="#product" className="lp-link-arrow mt-2">
                    See it in action
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
