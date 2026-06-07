import { beforeEach, describe, expect, it } from 'vitest';
import { useTimerStore, computeActualMinutes } from './timerStore';

beforeEach(() => useTimerStore.getState().reset());

describe('computeActualMinutes (legacy rounding)', () => {
  it('floors minutes', () => expect(computeActualMinutes(120)).toBe(2)); // 120s
  it('rounds up when remainder >= 30s', () => expect(computeActualMinutes(150)).toBe(3)); // 2m30s
  it('does not round up when remainder < 30s', () => expect(computeActualMinutes(149)).toBe(2)); // 2m29s
  it('min 1 when any time elapsed', () => expect(computeActualMinutes(5)).toBe(1));
  it('zero when no time', () => expect(computeActualMinutes(0)).toBe(0));
});

describe('timerStore', () => {
  it('configure sets planned seconds and resets remaining', () => {
    useTimerStore.getState().configure({
      subject: 'Math',
      minutes: 25,
      focus: 8,
      method: 'Pomodoro',
      note: '',
    });
    const s = useTimerStore.getState();
    expect(s.plannedSeconds).toBe(1500);
    expect(s.secondsLeft).toBe(1500);
    expect(s.running).toBe(false);
    expect(s.startedAt).toBeNull();
    expect(s.subject).toBe('Math');
    expect(s.focus).toBe(8);
    expect(s.method).toBe('Pomodoro');
  });

  it('start then tick decrements', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    expect(useTimerStore.getState().secondsLeft).toBe(59);
    expect(useTimerStore.getState().running).toBe(true);
  });

  it('start records startedAt once and keeps it on resume', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    const started = useTimerStore.getState().startedAt;
    expect(started).not.toBeNull();
    st.pause();
    st.resume();
    expect(useTimerStore.getState().startedAt).toBe(started);
  });

  it('tick does not decrement when paused', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    st.pause();
    st.tick();
    expect(useTimerStore.getState().secondsLeft).toBe(59);
    expect(useTimerStore.getState().running).toBe(false);
  });

  it('tick stops at zero, never negative', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 0, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    expect(useTimerStore.getState().secondsLeft).toBe(0);
  });

  it('elapsedSeconds reflects planned - left', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    st.tick();
    expect(useTimerStore.getState().elapsedSeconds()).toBe(2);
  });

  it('stop clears running but keeps elapsed', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    st.stop();
    expect(useTimerStore.getState().running).toBe(false);
    expect(useTimerStore.getState().elapsedSeconds()).toBe(1);
  });

  it('reset clears to defaults', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: 'x' });
    st.start();
    st.tick();
    st.reset();
    const s = useTimerStore.getState();
    expect(s.subject).toBe('');
    expect(s.plannedSeconds).toBe(0);
    expect(s.secondsLeft).toBe(0);
    expect(s.running).toBe(false);
    expect(s.startedAt).toBeNull();
  });

  it('persists running state to localStorage key track_timer', () => {
    const st = useTimerStore.getState();
    st.configure({ subject: 'Math', minutes: 1, focus: 8, method: 'Pomodoro', note: '' });
    st.start();
    st.tick();
    const raw = window.localStorage.getItem('track_timer');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.running).toBe(true);
    expect(parsed.state.secondsLeft).toBe(59);
  });
});
