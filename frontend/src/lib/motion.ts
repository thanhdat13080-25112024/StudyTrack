import type { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
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
