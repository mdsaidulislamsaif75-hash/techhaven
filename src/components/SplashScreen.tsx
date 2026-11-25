import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { TECHHAVEN_LOGO_SRC } from './BrandLogo';

const SPLASH_STORAGE_KEY = 'th_splash_seen_v1';
const CUBIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function hasSeenSplashInSession(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSplashSeenInSession(): void {
  try {
    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, '1');
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export const SplashScreen: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => !hasSeenSplashInSession());
  const [logoFailed, setLogoFailed] = useState(false);

  const dismiss = useCallback(() => {
    markSplashSeenInSession();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Phase 1 (0-0.5s) + Phase 2 (0.5s-1.2s) -> Phase 3 exit begins at 1.2s, completes at 1.5s
    const phase3StartMs = prefersReducedMotion ? 300 : 1200;
    const timer = window.setTimeout(() => {
      dismiss();
    }, phase3StartMs);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, prefersReducedMotion, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="techhaven-splash"
          role="dialog"
          aria-modal="true"
          aria-label="TechHaven Boot & Reveal"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={
            prefersReducedMotion
              ? {
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: { duration: 0.2, ease: 'easeOut' },
                }
              : {
                  opacity: 0,
                  y: -24,
                  pointerEvents: 'none',
                  transition: { duration: 0.3, ease: CUBIC_EASE },
                }
          }
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-white select-none overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow in Electric Orange (#F97316) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0.28 } : { opacity: 0.14, scale: 0.88 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.28 }
                  : { opacity: [0.16, 0.36, 0.24], scale: [0.92, 1.05, 1] }
              }
              transition={{ duration: 1.2, ease: CUBIC_EASE }}
              style={{
                background:
                  'radial-gradient(circle, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.08) 45%, transparent 72%)',
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[540px] sm:h-[540px] rounded-full blur-2xl"
            />
          </div>

          {/* Centered Brand Boot Lockup */}
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs sm:max-w-sm">
            {/* Phase 1 (0s - 0.5s): Brand Logo Entrance */}
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.9, y: 10 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.15 : 0.5,
                ease: CUBIC_EASE,
              }}
              className="relative mb-5"
            >
              {/* Phase 2 (0.5s - 1.2s): Subtle Glowing Ring / Pulse Accent */}
              {!prefersReducedMotion && (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{
                    opacity: [0, 0.85, 0.35],
                    scale: [0.96, 1.05, 1.01],
                  }}
                  transition={{
                    delay: 0.5,
                    duration: 0.7,
                    ease: 'easeInOut',
                  }}
                  className="absolute -inset-2 rounded-3xl border border-[#F97316]/50 shadow-[0_0_28px_rgba(249,115,22,0.32)] pointer-events-none"
                />
              )}

              <div className="relative inline-flex items-center justify-center rounded-2xl bg-[#0B0F19] px-5 py-3.5 sm:px-6 sm:py-4 ring-1 ring-slate-900/15 dark:ring-white/15 shadow-2xl">
                {logoFailed ? (
                  <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                    <span className="text-[#F97316]">Tech</span>Haven
                  </span>
                ) : (
                  <img
                    src={TECHHAVEN_LOGO_SRC}
                    alt="TechHaven"
                    width={2103}
                    height={748}
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="h-9 sm:h-11 w-auto object-contain block"
                  />
                )}
              </div>
            </motion.div>

            {/* Phase 1 (0s - 0.5s): Crisp Thin Horizontal Progress Bar (0% -> 100%) */}
            <div className="w-48 sm:w-56 h-[3px] rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-3.5">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.5,
                  ease: CUBIC_EASE,
                }}
                style={{ transformOrigin: 'left center' }}
                className="h-full w-full rounded-full bg-gradient-to-r from-[#F97316] via-orange-400 to-[#F97316]"
              />
            </div>

            {/* Phase 2 (0.5s - 1.2s): Status Caption Fade-In */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.5,
                duration: prefersReducedMotion ? 0.1 : 0.35,
                ease: 'easeOut',
              }}
              className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide"
            >
              Initializing TechHaven...
            </motion.p>
          </div>

          {/* Subtle Bottom-Right Skip Button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip intro animation"
            className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-10 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:border-[#F97316] text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#F97316] inline-flex items-center gap-1.5 backdrop-blur-sm transition-colors cursor-pointer"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
