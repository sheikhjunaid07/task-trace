import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const G = (a: string, b: string) => `linear-gradient(135deg,${a},${b})`;

const TESTIMONIALS = [
  {
    quote: 'TaskTrace completely changed how our team manages projects.',
    name: 'Ava Reed',
    role: 'VP Product · Northwind',
    g: G('#8b5cf6', '#a855f7'),
    featured: true,
  },
  {
    quote: 'The most beautiful project management tool we have ever used.',
    name: 'Liam Park',
    role: 'Design Lead · Vantage',
    g: G('#ec4899', '#f472b6'),
  },
  {
    quote: 'Fast, intuitive, and incredibly polished.',
    name: 'Maya Ito',
    role: 'Founder · Lumen Labs',
    g: G('#22c55e', '#10b981'),
  },
  {
    quote:
      'We replaced three tools with TaskTrace. The team has never been this aligned before a launch.',
    name: 'Sara Kim',
    role: 'Engineering Manager · Delta',
    g: G('#3b82f6', '#06b6d4'),
  },
  {
    quote:
      'The real-time sync feels like magic. Two people can reorganize the same board without ever stepping on each other.',
    name: 'Kai Chen',
    role: 'CTO · Orbital',
    g: G('#f59e0b', '#f97316'),
  },
  {
    quote:
      'It is the first tool our team actually enjoys opening every morning.',
    name: 'Noor Haddad',
    role: 'COO · Studio Nine',
    g: G('#10b981', '#84cc16'),
  },
];

const COLUMNS = [0, 1, 2].map((i) => TESTIMONIALS.filter((_, idx) => idx % 3 === i));

export function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden py-28 lg:py-36">
      <div
        className="lp-blob left-[-10%] top-1/3 h-[480px] w-[480px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 9%, transparent), transparent 65%)' }}
      />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Loved by teams"
          title={
            <>
              Don&apos;t take our word for it.
            </>
          }
          description="From two-person startups to global product teams — here's what happens when work finally flows."
        />

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map((col, colIdx) => (
            <div
              key={colIdx}
              className={`flex flex-col gap-6 ${colIdx === 1 ? 'lg:mt-16' : colIdx === 2 ? 'lg:mt-8' : ''}`}
            >
              {col.map((t, i) => (
                <Reveal key={t.name} delay={(colIdx * 3 + i) * 0.07} y={36}>
                  <motion.figure
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="lp-glass-deep relative flex h-full flex-col rounded-3xl p-7"
                  >
                    <Quote
                      className="absolute right-6 top-6 h-7 w-7"
                      style={{ color: 'color-mix(in srgb, var(--accent) 28%, transparent)' }}
                    />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5"
                          style={{ color: 'var(--warning)', fill: 'var(--warning)' }}
                        />
                      ))}
                    </div>
                    <blockquote
                      className={`mt-5 text-ink ${t.featured ? 'text-[19px] font-bold leading-snug tracking-tight' : 'text-[15.5px] font-medium leading-relaxed'}`}
                    >
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-7 flex items-center gap-3 border-t border-edge pt-5">
                      <span
                        className="lp-avatar-ring flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ backgroundImage: t.g }}
                      >
                        {t.name[0]}
                      </span>
                      <div>
                        <p className="text-[13.5px] font-bold text-ink">{t.name}</p>
                        <p className="text-[11.5px] font-medium text-faint">{t.role}</p>
                      </div>
                    </figcaption>
                  </motion.figure>
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
