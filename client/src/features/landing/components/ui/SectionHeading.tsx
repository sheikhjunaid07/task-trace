import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  return (
    <Reveal
      className={`flex flex-col gap-3.5 ${
        align === 'center' ? 'items-center text-center' : 'items-start text-left'
      } ${className}`}
    >
      {eyebrow && (
        <span className={align === 'center' ? 'lp-eyebrow-center' : 'lp-eyebrow'}>
          {eyebrow}
        </span>
      )}
      <h2 className="lp-section-title text-ink">{title}</h2>
      {description && (
        <p className={`text-[15.5px] sm:text-[16.5px] leading-relaxed text-mute ${align === 'center' ? 'max-w-2xl' : 'max-w-xl'}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
