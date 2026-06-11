import type { Variants } from 'framer-motion';

// Page-level route transition is a pure cross-fade (no y-shift): the per-page
// list staggers (listItem) own the slide-up motion, so keeping the page wrapper
// to opacity-only avoids a second, duplicated slide on every navigation.
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
export const listStagger: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
export const listItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

/** Gate all motion on the reduced-motion preference. */
export function getMotion(reduced: boolean) {
  if (reduced) {
    return {
      duration: 0,
      page: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      } as Variants,
      list: {} as Variants,
      item: { initial: { opacity: 1 }, animate: { opacity: 1 } } as Variants,
    };
  }
  return { duration: 0.22, page: pageVariants, list: listStagger, item: listItem };
}
