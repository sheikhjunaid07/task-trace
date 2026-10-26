import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const TIERS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'free forever',
    description: 'For individuals getting organized.',
    cta: 'Start Free',
    to: '/register',
    variant: 'ghost' as const,
    features: [
      'Up to 3 boards',
      'Unlimited tasks & cards',
      'Basic analytics',
      '1 workspace',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$12',
    cadence: 'per user / month',
    description: 'For teams that move fast.',
    cta: 'Start Free Trial',
    to: '/register',
    variant: 'primary' as const,
    popular: true,
    features: [
      'Unlimited boards',
      'Real-time collaboration',
      'Smart analytics & reports',
      'Automation rules',
      'Guest access & sharing',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'tailored to you',
    description: 'For organizations at scale.',
    cta: 'Talk to Sales',
    to: '/register',
    variant: 'ghost' as const,
    features: [
      'SSO & SCIM provisioning',
      'Advanced permissions',
      'Audit logs & retention',
      'Dedicated CSM',
      '99.99% SLA',
      'Custom onboarding',
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 lg:py-32 scroll-mt-24">
      <div
        className="lp-blob right-[-8%] top-16 h-[460px] w-[460px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent), transparent 65%)' }}
      />
      <div className="lp-noise" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple pricing. <span className="lp-text-gradient">Serious software.</span>
            </>
          }
          description="Start free. Upgrade when the team grows. Every plan includes unlimited tasks and real-time sync."
        />

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 lg:grid-cols-3 lg:items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.1} className="h-full">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  tier.popular
                    ? 'lg:-my-3 bg-[color-mix(in_srgb,var(--card)_92%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_45%,transparent),0_24px_70px_-18px_var(--glow)]'
                    : 'border border-edge bg-[color-mix(in_srgb,var(--card)_52%,transparent)]'
                }`}
              >
                {tier.popular && (
                  <>
                    <div
                      className="absolute -inset-px -z-10 rounded-3xl"
                      style={{
                        background: 'linear-gradient(165deg, color-mix(in srgb, var(--accent) 30%, transparent), transparent 45%, color-mix(in srgb, var(--accent-2) 22%, transparent))',
                        filter: 'blur(18px)',
                        opacity: 0.7,
                      }}
                    />
                    <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </>
                )}

                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-faint">
                  {tier.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="lp-price-num text-ink">{tier.price}</span>
                  <span className="pb-1.5 text-[12.5px] font-medium text-faint">{tier.cadence}</span>
                </div>
                <p className="mt-3 text-[14px] text-mute">{tier.description}</p>

                <ul className="mt-8 flex flex-col gap-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[14px] font-medium text-ink/85">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tier.popular ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]' : 'bg-[color-mix(in_srgb,var(--text-1)_7%,transparent)]'}`}>
                        <Check className="h-3 w-3" strokeWidth={3} style={{ color: tier.popular ? 'var(--accent)' : 'var(--text-2)' }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={tier.to}
                  className={`btn mt-9 h-12 w-full rounded-full text-[14.5px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tier.popular
                      ? 'btn-primary font-bold shadow-[0_8px_24px_-4px_var(--glow)] hover:shadow-[0_12px_32px_-4px_var(--glow)] hover:-translate-y-0.5 active:translate-y-0'
                      : 'btn-surface font-semibold text-ink/80 hover:text-ink hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
