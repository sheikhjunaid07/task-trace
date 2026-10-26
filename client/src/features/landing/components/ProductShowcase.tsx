import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  ChartSpline,
  Check,
  CircleCheck,
  Kanban,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  SquareKanban,
  Users,
  Waypoints,
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const G = (a: string, b: string) => `linear-gradient(135deg,${a},${b})`;
const AVATARS = [
  { g: G('#8b5cf6', '#a855f7'), l: 'A' },
  { g: G('#ec4899', '#f472b6'), l: 'L' },
  { g: G('#22c55e', '#10b981'), l: 'M' },
  { g: G('#3b82f6', '#06b6d4'), l: 'S' },
  { g: G('#f59e0b', '#f97316'), l: 'K' },
];

const COLUMNS = [
  {
    name: 'To Do',
    color: '#8b5cf6',
    cards: [
      { title: 'Design onboarding flow', prio: 'high', due: 'Today', tags: 2 },
      { title: 'API rate limiting', prio: 'medium', due: 'Fri', tags: 1, progress: 45 },
      { title: 'Refactor auth guards', prio: 'low', tags: 2 },
    ],
  },
  {
    name: 'In Progress',
    color: '#f59e0b',
    cards: [
      { title: 'Landing page rebuild', prio: 'critical', due: 'Today', tags: 2, progress: 72 },
      { title: 'Real-time presence', prio: 'high', tags: 3, progress: 35 },
    ],
  },
  {
    name: 'Review',
    color: '#22c55e',
    cards: [{ title: 'Board invite links', prio: 'medium', due: 'Mon', tags: 1 }],
  },
];

export function ProductShowcase() {
  const [isDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  return (
    <section id="product" className="relative w-full max-w-full overflow-hidden py-20 sm:py-24 lg:py-32 scroll-mt-24">
      <div className="lp-blob left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2" style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 12%, transparent), transparent 62%)' }} />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Product tour"
          title={
            <>
              One board. Every signal.
              <br className="hidden sm:block" /> <span className="lp-text-gradient">Zero context switching.</span>
            </>
          }
          description="The TaskTrace dashboard brings your whole project into a single, beautiful surface — boards, people, analytics, and history."
        />

        <Reveal delay={0.1} y={40}>
          <div className="mx-auto mt-14 sm:mt-20 max-w-6xl w-full min-w-0" style={{ perspective: 1600 }}>
            <motion.div
              initial={{ rotateX: isDesktop ? 14 : 0, scale: 0.94, y: 40, opacity: 0 }}
              whileInView={{ rotateX: 0, scale: 1, y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full min-w-0"
            >
              <div className="lp-browser relative w-full min-w-0 overflow-hidden">
                {/* browser chrome */}
                <div className="flex items-center gap-4 border-b border-edge px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/70" />
                  </div>
                  <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--bg)_60%,transparent)] px-3.5 py-1.5">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full text-white" style={{ background: 'var(--grad-accent)', color: '#ffffff' }}>
                      <Kanban className="h-2 w-2" strokeWidth={3} style={{ color: '#ffffff', stroke: '#ffffff' }} />
                    </span>
                    <span className="text-[10px] font-medium text-faint truncate">tasktrace.app/acme/product-launch</span>
                  </div>
                  <div className="flex items-center gap-2 text-faint">
                    <Search className="h-3.5 w-3.5" />
                    <Bell className="h-3.5 w-3.5" />
                    <span className="ml-1 h-5 w-5 rounded-full" style={{ backgroundImage: AVATARS[0].g }} />
                  </div>
                </div>

                <div className="flex w-full min-w-0">
                  {/* ── sidebar ── */}
                  <div className="hidden w-44 shrink-0 flex-col border-r border-edge p-3 md:flex">
                    <div className="mb-4 flex items-center gap-2 px-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-white" style={{ background: 'var(--grad-accent)', color: '#ffffff' }}>
                        <Kanban className="h-3 w-3" strokeWidth={2.6} style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      </span>
                      <span className="text-[11px] font-extrabold tracking-tight text-ink">TaskTrace</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {[
                        { icon: LayoutGrid, label: 'Dashboard', active: true },
                        { icon: SquareKanban, label: 'Boards', active: false },
                        { icon: ChartSpline, label: 'Analytics', active: false },
                        { icon: Users, label: 'Members', active: false },
                      ].map((n) => (
                        <span
                          key={n.label}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                            n.active
                              ? 'bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-ink'
                              : 'text-faint'
                          }`}
                        >
                          <n.icon className="h-3 w-3" style={{ color: n.active ? 'var(--accent)' : undefined }} />
                          {n.label}
                        </span>
                      ))}
                    </div>
                    <p className="mb-1.5 mt-5 px-2 text-[8.5px] font-bold uppercase tracking-[0.14em] text-faint">
                      My boards
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {[
                        { dot: '#8b5cf6', name: 'Product Launch', active: true },
                        { dot: '#22c55e', name: 'Mobile App', active: false },
                        { dot: '#f59e0b', name: 'Brand Refresh', active: false },
                      ].map((b) => (
                        <span
                          key={b.name}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                            b.active ? 'bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)] text-ink' : 'text-faint'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.dot }} />
                          {b.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center gap-2 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] p-2">
                      <span className="h-5 w-5 rounded-full" style={{ backgroundImage: AVATARS[4].g }} />
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-ink">Kai Chen</p>
                        <p className="text-[8px] text-faint">Acme Inc.</p>
                      </div>
                      <MoreHorizontal className="h-3 w-3 text-faint" />
                    </div>
                  </div>

                  {/* ── main board ── */}
                  <div className="min-w-0 flex-1 p-3 sm:p-4 overflow-hidden">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <div className="mr-auto">
                        <p className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-ink">
                          Product Launch
                          <span className="rounded-md bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
                            live
                          </span>
                        </p>
                        <p className="mt-0.5 text-[9px] font-medium text-faint">Updated 2 min ago · 14 members</p>
                      </div>
                      <div className="flex -space-x-1.5">
                        {AVATARS.slice(0, 4).map((a, i) => (
                          <span
                            key={i}
                            className="lp-avatar-ring flex h-6 w-6 items-center justify-center rounded-full text-[7px] font-bold text-white"
                            style={{ backgroundImage: a.g }}
                          >
                            {a.l}
                          </span>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-1.5 text-[9px] font-bold" style={{ color: 'var(--accent)' }}>
                        <Plus className="h-2.5 w-2.5" /> Invite
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 touch-pan-x sm:grid sm:grid-cols-3 sm:overflow-visible">
                      {COLUMNS.map((col) => (
                        <div key={col.name} className="min-w-[170px] flex-1 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-2 sm:min-w-0">
                          <div className="mb-2 flex items-center gap-1.5 px-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                            <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-mute">{col.name}</span>
                            <span className="ml-auto rounded-full px-1.5 text-[8px] font-bold" style={{ background: `color-mix(in srgb, ${col.color} 14%, transparent)`, color: col.color }}>
                              {col.cards.length}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {col.cards.map((c) => (
                              <motion.div
                                key={c.title}
                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                className="rounded-lg border border-edge bg-card px-2 py-1.5 shadow-sm"
                              >
                                <p className="text-[9px] font-semibold leading-snug text-ink">{c.title}</p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <span
                                    className={`rounded px-1 py-px text-[6.5px] font-bold uppercase tracking-wide ${
                                      c.prio === 'high'
                                        ? 'bg-[#f59e0b]/15 text-[#f59e0b]'
                                        : c.prio === 'critical'
                                          ? 'bg-[#ef4444]/15 text-[#ef4444]'
                                          : c.prio === 'medium'
                                            ? 'bg-[#3b82f6]/15 text-[#3b82f6]'
                                            : 'bg-[#64748b]/15 text-[#64748b]'
                                    }`}
                                  >
                                    {c.prio}
                                  </span>
                                  {c.due && <span className="text-[7.5px] font-medium text-faint">{c.due}</span>}
                                  {c.progress !== undefined && (
                                    <div className="ml-auto h-[3px] w-8 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-1)_10%,transparent)]">
                                      <motion.div
                                        style={{ width: `${c.progress}%`, transformOrigin: 'left' }}
                                        initial={{ scaleX: 0 }}
                                        whileInView={{ scaleX: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-accent"
                                      />
                                    </div>
                                  )}
                                  <span className="ml-auto flex -space-x-1">
                                    {Array.from({ length: c.tags }).map((_, i) => (
                                      <span
                                        key={i}
                                        className="lp-avatar-ring h-3.5 w-3.5 rounded-full"
                                        style={{ backgroundImage: AVATARS[i].g }}
                                      />
                                    ))}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                            <span className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-edge-strong py-1.5 text-[8px] font-semibold text-faint transition-colors hover:border-accent/50 hover:text-accent">
                              <Plus className="h-2.5 w-2.5" /> Add task
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── right rail ── */}
                  <div className="hidden w-52 shrink-0 flex-col gap-3 border-l border-edge p-3 xl:flex">
                    <div className="rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-faint">Velocity</span>
                        <span className="flex items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-1.5 py-px text-[7.5px] font-bold" style={{ color: 'var(--success)' }}>
                          +12.4%
                        </span>
                      </div>
                      <p className="mt-1 text-[17px] font-extrabold tracking-tight text-ink">87</p>
                      <svg viewBox="0 0 120 32" className="mt-1 h-8 w-full">
                        <motion.path
                          d="M2 28 L16 24 L30 25 L44 19 L58 21 L72 14 L86 16 L100 9 L114 11 L118 8"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.6, ease: 'easeInOut' }}
                        />
                        <path
                          d="M2 28 L16 24 L30 25 L44 19 L58 21 L72 14 L86 16 L100 9 L114 11 L118 8 L118 32 L2 32 Z"
                          fill="color-mix(in srgb, var(--accent) 10%, transparent)"
                        />
                      </svg>
                    </div>

                    <div className="rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-3">
                      <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-faint">Online now</span>
                      <div className="mt-2 flex flex-col gap-2">
                        {AVATARS.slice(0, 4).map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="relative">
                              <span className="lp-avatar-ring flex h-5 w-5 items-center justify-center rounded-full text-[6.5px] font-bold text-white" style={{ backgroundImage: a.g }}>
                                {a.l}
                              </span>
                              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success" style={{ boxShadow: '0 0 5px rgba(34,197,94,0.8)' }} />
                            </span>
                            <span className="text-[9px] font-semibold text-ink">{['Ava Reed', 'Liam Park', 'Maya Ito', 'Sara Kim'][i]}</span>
                            {i === 0 && (
                              <span className="ml-auto rounded bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-1.5 py-px text-[6.5px] font-bold" style={{ color: 'var(--accent)' }}>
                                editing
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] p-3">
                      <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-faint">Activity</span>
                      <div className="mt-2 flex flex-col gap-2.5">
                        {[
                          { icon: CircleCheck, color: 'var(--success)', text: 'Ava completed a task', time: '2m' },
                          { icon: MessageSquare, color: 'var(--accent)', text: 'Liam commented on landing', time: '14m' },
                          { icon: Waypoints, color: 'var(--accent-2)', text: '3 tasks moved to Review', time: '31m' },
                        ].map((e, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <e.icon className="mt-px h-2.5 w-2.5 shrink-0" style={{ color: e.color }} />
                            <p className="flex-1 text-[8px] font-medium leading-snug text-mute">{e.text}</p>
                            <span className="text-[7px] text-faint">{e.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 rounded-xl border border-edge bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] px-3 py-2">
                      <Radio className="h-3 w-3" style={{ color: 'var(--success)' }} />
                      <span className="text-[8.5px] font-semibold text-mute">
                        14 members · <span style={{ color: 'var(--success)' }}>5 online</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-faint">
            {['Live board sync', 'Drag & drop reordering', 'Role-based access', 'Audit-grade activity log'].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: 'var(--success)' }} />
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
