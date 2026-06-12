import { useCallback, useEffect, useState } from 'react';

/**
 * Keeps content mounted through its exit animation. `rendered` flips true the
 * moment `open` is true; on close it stays true until the caller signals the
 * exit animation finished via `onExited`. The exit timeline lives in the
 * component (it knows its own elements); this hook is just the mount gate.
 */
export function usePresence(open: boolean): { rendered: boolean; onExited: () => void } {
  const [rendered, setRendered] = useState(open);
  useEffect(() => {
    if (open) setRendered(true);
  }, [open]);
  const onExited = useCallback(() => setRendered(false), []);
  return { rendered, onExited };
}
