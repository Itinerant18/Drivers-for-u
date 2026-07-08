'use client';

/**
 * ThemeProvider — Client component wrapping the app in a MotionConfig so every
 * Framer Motion animation honours the OS prefers-reduced-motion setting.
 */

import { MotionConfig } from 'framer-motion';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // reducedMotion="user" makes every Framer Motion animation honour the OS
  // prefers-reduced-motion setting (CSS handles the rest via globals.css).
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
