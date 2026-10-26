import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  duration?: number;
  once?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 34,
  x = 0,
  duration = 0.85,
  once = true,
}: RevealProps) {
  const reduced = useReducedMotion();
  const [isDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );

  const effectiveX = isDesktop ? x : 0;
  const effectiveY = isDesktop ? y : y !== 0 ? y : 24;

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: reduced ? 0 : effectiveY,
        x: reduced ? 0 : effectiveX,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
      }}
      viewport={{ once, margin: isDesktop ? "-80px" : "-30px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
