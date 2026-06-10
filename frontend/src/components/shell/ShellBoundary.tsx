/**
 * ShellBoundary — a tiny fail-soft error boundary used to wrap the shell's
 * bottom control cluster. The cluster depends on TanStack Query (notification
 * count, logout cache clear); in production the QueryClientProvider always wraps
 * the app, but isolated render tests of the shell may mount it without one.
 * Rather than crash the whole shell (and hide navigation), we render nothing for
 * the cluster if it throws. Navigation — the shell's primary job — stays usable.
 */
import { Component, type ReactNode } from 'react';

export class ShellBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
