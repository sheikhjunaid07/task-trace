import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const ITEMS = [
  { value: '10,000+', label: 'Tasks Managed' },
  { value: '500+', label: 'Teams' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Real-Time', label: 'Collaboration', live: true },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function TrustBar() {
  return (
    <section className="relative border-y border-edge w-full max-w-full overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-8 sm:py-12">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-y-8 sm:gap-y-10 lg:grid-cols-4"
        >
          {ITEMS.map((it) => (
            <motion.div
              key={it.label}
              variants={item}
              className="flex flex-col items-center gap-1.5 px-2 text-center"
            >
              <span className="flex items-center justify-center flex-wrap gap-2 text-[20px] sm:text-[26px] lg:text-[30px] font-extrabold tracking-tight text-ink text-center">
                {it.live && (
                  <span className="relative flex h-2 w-2">
                    <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-success" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                )}
                {it.value}
                {it.live && <Radio className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'var(--success)' }} />}
              </span>
              <span className="text-[12px] sm:text-[13px] font-medium text-mute">{it.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
