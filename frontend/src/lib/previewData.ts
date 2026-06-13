/**
 * Preview-mode demo data. Returns realistic, type-checked fixtures for every
 * endpoint the app reads, so the whole UI looks alive on the backend-less
 * Vercel preview (see `lib/previewMode.ts`). Only used when `PREVIEW_MODE` is
 * on; `apiClient.request()` calls `getPreviewResponse()` instead of fetching.
 *
 * The narrative: a VJU Computer-Science student two-and-a-bit semesters in,
 * CPA ~3.4 ("Giỏi"). Dates are computed relative to now so it never looks stale.
 */
import i18n from '@/lib/i18n';
import { getStoredTheme } from '@/lib/theme';
import type { MeOut } from '@/features/auth/types';
import type { Dashboard, StudySession, Suggestion } from '@/features/sessions/types';
import type { GpaSummary, Grade, WhatIfOut } from '@/features/grades/types';
import type { Course } from '@/features/courses/types';
import type { Semester } from '@/features/semesters/types';
import type { Deadline } from '@/features/deadlines/types';
import type { Direction, WeakSubject } from '@/features/analysis/types';
import type { Analytics } from '@/features/analytics/types';
import type { Prerequisite } from '@/features/prerequisites/types';
import type { ScheduleItem } from '@/features/schedule/types';
import type { Notification, UnreadCount } from '@/features/notifications/types';
import type { RoadmapPlan } from '@/features/roadmap/types';

// --- date helpers (relative to now, so the demo is always "current") ---------
const NOW = new Date();
function offsetISO(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function offsetDate(days: number): string {
  return offsetISO(days).slice(0, 10);
}

// --- semesters ---------------------------------------------------------------
const semesters: Semester[] = [
  {
    id: 1,
    code: '2023.1',
    name: 'HK1 2023–2024',
    start_date: '2023-09-04',
    end_date: '2024-01-12',
  },
  {
    id: 2,
    code: '2023.2',
    name: 'HK2 2023–2024',
    start_date: '2024-02-19',
    end_date: '2024-06-28',
  },
  {
    id: 3,
    code: '2024.1',
    name: 'HK1 2024–2025',
    start_date: '2024-09-02',
    end_date: '2025-01-10',
  },
];

// --- courses (CTĐT) ----------------------------------------------------------
const courses: Course[] = [
  {
    id: 1,
    code: 'MAT101',
    name: 'Giải tích 1',
    credits: 4,
    category: 'foundation',
    is_required: true,
    planned_semester_id: 1,
  },
  {
    id: 2,
    code: 'INT101',
    name: 'Nhập môn Lập trình',
    credits: 3,
    category: 'foundation',
    is_required: true,
    planned_semester_id: 1,
  },
  {
    id: 3,
    code: 'PHY101',
    name: 'Vật lý đại cương',
    credits: 3,
    category: 'foundation',
    is_required: true,
    planned_semester_id: 1,
  },
  {
    id: 4,
    code: 'ENG101',
    name: 'Tiếng Anh 1',
    credits: 3,
    category: 'general',
    is_required: true,
    planned_semester_id: 1,
  },
  {
    id: 5,
    code: 'INT201',
    name: 'Cấu trúc Dữ liệu & Giải thuật',
    credits: 4,
    category: 'specialized',
    is_required: true,
    planned_semester_id: 2,
  },
  {
    id: 6,
    code: 'INT202',
    name: 'Cơ sở Dữ liệu',
    credits: 3,
    category: 'specialized',
    is_required: true,
    planned_semester_id: 2,
  },
  {
    id: 7,
    code: 'MAT201',
    name: 'Đại số tuyến tính',
    credits: 3,
    category: 'foundation',
    is_required: true,
    planned_semester_id: 2,
  },
  {
    id: 8,
    code: 'INT301',
    name: 'Trí tuệ Nhân tạo',
    credits: 3,
    category: 'specialized',
    is_required: false,
    planned_semester_id: 3,
  },
];

const courseSummary = (id: number) => {
  const c = courses.find((x) => x.id === id)!;
  return { id: c.id, code: c.code, name: c.name, credits: c.credits, category: c.category ?? null };
};
const semesterSummary = (id: number) => {
  const s = semesters.find((x) => x.id === id)!;
  return { id: s.id, code: s.code };
};

// --- grades ------------------------------------------------------------------
const grades: Grade[] = [
  {
    id: 1,
    course_id: 1,
    semester_id: 1,
    grade_10: 8.5,
    status: 'passed',
    letter: 'A',
    grade_4: 4.0,
    course: courseSummary(1),
    semester: semesterSummary(1),
  },
  {
    id: 2,
    course_id: 2,
    semester_id: 1,
    grade_10: 9.0,
    status: 'passed',
    letter: 'A',
    grade_4: 4.0,
    course: courseSummary(2),
    semester: semesterSummary(1),
  },
  {
    id: 3,
    course_id: 3,
    semester_id: 1,
    grade_10: 7.5,
    status: 'passed',
    letter: 'B',
    grade_4: 3.0,
    course: courseSummary(3),
    semester: semesterSummary(1),
  },
  {
    id: 4,
    course_id: 4,
    semester_id: 1,
    grade_10: 8.0,
    status: 'passed',
    letter: 'B+',
    grade_4: 3.5,
    course: courseSummary(4),
    semester: semesterSummary(1),
  },
  {
    id: 5,
    course_id: 5,
    semester_id: 2,
    grade_10: 8.0,
    status: 'passed',
    letter: 'B+',
    grade_4: 3.5,
    course: courseSummary(5),
    semester: semesterSummary(2),
  },
  {
    id: 6,
    course_id: 6,
    semester_id: 2,
    grade_10: 7.0,
    status: 'passed',
    letter: 'B',
    grade_4: 3.0,
    course: courseSummary(6),
    semester: semesterSummary(2),
  },
  {
    id: 7,
    course_id: 7,
    semester_id: 2,
    grade_10: 8.5,
    status: 'passed',
    letter: 'A',
    grade_4: 4.0,
    course: courseSummary(7),
    semester: semesterSummary(2),
  },
  {
    id: 8,
    course_id: 8,
    semester_id: 3,
    grade_10: null,
    status: 'in_progress',
    letter: null,
    grade_4: null,
    course: courseSummary(8),
    semester: semesterSummary(3),
  },
];

const gpa: GpaSummary = {
  cpa: 3.45,
  classification: 'gioi',
  credits: { earned: 23, in_progress: 3, remaining: 104, required: 130 },
  semesters: [
    { semester_id: 1, code: '2023.1', gpa: 3.62, credits: 13 },
    { semester_id: 2, code: '2023.2', gpa: 3.5, credits: 10 },
  ],
};

// --- study sessions ----------------------------------------------------------
const sessions: StudySession[] = [
  {
    id: 1,
    subject: 'Cấu trúc Dữ liệu',
    planned_minutes: 25,
    actual_minutes: 25,
    focus: 5,
    method: 'Pomodoro',
    note: 'Ôn cây nhị phân',
    session_date: offsetDate(0),
    started_at: null,
    ended_at: null,
    course_id: 5,
    course: { id: 5, code: 'INT201', name: 'Cấu trúc Dữ liệu & Giải thuật' },
  },
  {
    id: 2,
    subject: 'Cơ sở Dữ liệu',
    planned_minutes: 50,
    actual_minutes: 48,
    focus: 4,
    method: 'Deep Work',
    note: 'Chuẩn hoá 3NF',
    session_date: offsetDate(-1),
    started_at: null,
    ended_at: null,
    course_id: 6,
    course: { id: 6, code: 'INT202', name: 'Cơ sở Dữ liệu' },
  },
  {
    id: 3,
    subject: 'Trí tuệ Nhân tạo',
    planned_minutes: 25,
    actual_minutes: 25,
    focus: 5,
    method: 'Active Recall',
    note: '',
    session_date: offsetDate(-1),
    started_at: null,
    ended_at: null,
    course_id: 8,
    course: { id: 8, code: 'INT301', name: 'Trí tuệ Nhân tạo' },
  },
  {
    id: 4,
    subject: 'Tiếng Anh',
    planned_minutes: 30,
    actual_minutes: 30,
    focus: 4,
    method: 'Pomodoro',
    note: 'Luyện nghe IELTS',
    session_date: offsetDate(-3),
    started_at: null,
    ended_at: null,
    course_id: null,
    course: null,
  },
  {
    id: 5,
    subject: 'Đại số tuyến tính',
    planned_minutes: 50,
    actual_minutes: 50,
    focus: 5,
    method: 'Deep Work',
    note: '',
    session_date: offsetDate(-4),
    started_at: null,
    ended_at: null,
    course_id: 7,
    course: { id: 7, code: 'MAT201', name: 'Đại số tuyến tính' },
  },
  {
    id: 6,
    subject: 'Cấu trúc Dữ liệu',
    planned_minutes: 25,
    actual_minutes: 22,
    focus: 3,
    method: 'Pomodoro',
    note: '',
    session_date: offsetDate(-5),
    started_at: null,
    ended_at: null,
    course_id: 5,
    course: { id: 5, code: 'INT201', name: 'Cấu trúc Dữ liệu & Giải thuật' },
  },
];

const dashboard: Dashboard = {
  kpis: { today_minutes: 50, total_minutes: 1840, total_sessions: 47, streak: 6 },
  chart: [6, 5, 4, 3, 2, 1, 0].map((d, i) => ({
    date: offsetDate(-d),
    minutes: [40, 75, 25, 0, 90, 50, 50][i],
  })),
  badges: [
    { key: 'first_session', unlocked: true },
    { key: 'focused_5h', unlocked: true },
    { key: 'master_20h', unlocked: false },
  ],
  recent_sessions: sessions.slice(0, 4),
};

// --- schedule (0=Mon .. 6=Sun) ----------------------------------------------
const schedule: ScheduleItem[] = [
  {
    id: 1,
    day_of_week: 0,
    time: '07:30',
    subject: 'Cấu trúc Dữ liệu & Giải thuật',
    course_id: 5,
    recurring: true,
  },
  { id: 2, day_of_week: 0, time: '09:30', subject: 'Cơ sở Dữ liệu', course_id: 6, recurring: true },
  {
    id: 3,
    day_of_week: 2,
    time: '07:30',
    subject: 'Trí tuệ Nhân tạo',
    course_id: 8,
    recurring: true,
  },
  {
    id: 4,
    day_of_week: 2,
    time: '13:00',
    subject: 'Đại số tuyến tính',
    course_id: 7,
    recurring: true,
  },
  { id: 5, day_of_week: 4, time: '09:30', subject: 'Tiếng Anh', course_id: null, recurring: true },
];

// --- deadlines ---------------------------------------------------------------
const deadlines: Deadline[] = [
  {
    id: 1,
    title: 'Bài tập lớn CSDL — thiết kế ERD',
    type: 'project',
    due_at: offsetISO(2),
    done: false,
    priority: 'high',
    remind_before_minutes: 1440,
    reminded_at: null,
    course_id: 6,
    course: { id: 6, code: 'INT202', name: 'Cơ sở Dữ liệu' },
    created_at: offsetISO(-5),
  },
  {
    id: 2,
    title: 'Kiểm tra giữa kỳ CTDL',
    type: 'exam',
    due_at: offsetISO(5),
    done: false,
    priority: 'high',
    remind_before_minutes: 4320,
    reminded_at: null,
    course_id: 5,
    course: { id: 5, code: 'INT201', name: 'Cấu trúc Dữ liệu & Giải thuật' },
    created_at: offsetISO(-8),
  },
  {
    id: 3,
    title: 'Nộp bài tập Trí tuệ Nhân tạo #3',
    type: 'assignment',
    due_at: offsetISO(9),
    done: false,
    priority: 'medium',
    remind_before_minutes: 60,
    reminded_at: null,
    course_id: 8,
    course: { id: 8, code: 'INT301', name: 'Trí tuệ Nhân tạo' },
    created_at: offsetISO(-2),
  },
  {
    id: 4,
    title: 'Bài luận Tiếng Anh',
    type: 'assignment',
    due_at: offsetISO(-2),
    done: true,
    priority: 'low',
    remind_before_minutes: null,
    reminded_at: null,
    course_id: null,
    course: null,
    created_at: offsetISO(-10),
  },
];

// --- prerequisites -----------------------------------------------------------
const prerequisites: Prerequisite[] = [
  { id: 1, course_id: 5, prereq_course_id: 2, course_code: 'INT201', prereq_code: 'INT101' },
  { id: 2, course_id: 6, prereq_course_id: 2, course_code: 'INT202', prereq_code: 'INT101' },
  { id: 3, course_id: 8, prereq_course_id: 5, course_code: 'INT301', prereq_code: 'INT201' },
  { id: 4, course_id: 7, prereq_course_id: 1, course_code: 'MAT201', prereq_code: 'MAT101' },
];

// --- analysis ----------------------------------------------------------------
const direction: Direction = {
  category_strengths: [
    { category: 'specialized', avg_grade_4: 3.5, count: 2 },
    { category: 'foundation', avg_grade_4: 3.67, count: 3 },
    { category: 'general', avg_grade_4: 3.5, count: 1 },
  ],
  strongest_category: 'foundation',
  overloaded_semesters: [{ code: '2024.1', total_credits: 25 }],
  missing_prerequisites: [],
};

// Signal/priority strings mirror the backend weak_subject contract exactly
// (priority red|yellow; signals low_grade|low_study|failed_prereq), so the
// frontend i18n keys weakSubject.{priority,signal}.* resolve in preview mode.
const weakSubjects: WeakSubject[] = [
  {
    course_id: 6,
    code: 'INT202',
    name: 'Cơ sở Dữ liệu',
    signals: ['low_study', 'failed_prereq'],
    priority: 'red',
    metrics: { minutes_per_credit: 18.5 },
  },
  {
    course_id: 3,
    code: 'PHY101',
    name: 'Vật lý đại cương',
    signals: ['low_study'],
    priority: 'yellow',
    metrics: { minutes_per_credit: 22.0 },
  },
];

// --- analytics ---------------------------------------------------------------
const analytics: Analytics = {
  heatmap: Array.from({ length: 35 }, (_, i) => ({
    date: offsetDate(-(34 - i)),
    minutes: [0, 0, 25, 50, 30, 0, 75, 40, 0, 25, 50, 0, 90, 30][i % 14],
  })),
  time_by_method: [
    { method: 'Pomodoro', total_minutes: 720, session_count: 26 },
    { method: 'Deep Work', total_minutes: 880, session_count: 15 },
    { method: 'Active Recall', total_minutes: 240, session_count: 6 },
  ],
  time_by_course: [
    {
      course_id: 5,
      subject: 'Cấu trúc Dữ liệu & Giải thuật',
      total_minutes: 620,
      session_count: 16,
    },
    { course_id: 6, subject: 'Cơ sở Dữ liệu', total_minutes: 480, session_count: 12 },
    { course_id: 8, subject: 'Trí tuệ Nhân tạo', total_minutes: 360, session_count: 9 },
    { course_id: null, subject: 'Tiếng Anh', total_minutes: 380, session_count: 10 },
  ],
  focus_trend: [6, 5, 4, 3, 2, 1, 0].map((d) => ({
    date: offsetDate(-d),
    avg_focus: 3 + Math.random(),
  })),
  weekly_comparison: { this_week_minutes: 330, last_week_minutes: 280, change_pct: 17.9 },
  monthly_comparison: { this_month_minutes: 1240, last_month_minutes: 1010, change_pct: 22.8 },
  productivity_score: { score: 78, components: { consistency: 82, volume: 70, focus_quality: 84 } },
  hourly_distribution: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    total_minutes: [19, 20, 21, 8, 9, 13, 14, 7, 22].includes(h)
      ? 60 + (h % 5) * 15
      : h >= 7 && h <= 22
        ? 20
        : 0,
  })),
  method_effectiveness: [
    { method: 'Pomodoro', avg_focus: 4.2, avg_completion_rate: 0.95 },
    { method: 'Deep Work', avg_focus: 4.5, avg_completion_rate: 0.9 },
    { method: 'Active Recall', avg_focus: 4.0, avg_completion_rate: 0.97 },
  ],
};

// --- notifications -----------------------------------------------------------
const notifications: Notification[] = [
  {
    id: 1,
    type: 'deadline_reminder',
    payload: { title: 'Bài tập lớn CSDL — thiết kế ERD' },
    read: false,
    created_at: offsetISO(-0.2),
  },
  {
    id: 2,
    type: 'badge_unlocked',
    payload: { badge_key: 'focused_5h' },
    read: false,
    created_at: offsetISO(-1),
  },
  {
    id: 3,
    type: 'deadline_reminder',
    payload: { title: 'Kiểm tra giữa kỳ CTDL' },
    read: true,
    created_at: offsetISO(-2),
  },
];

// --- roadmap (generate/apply) ------------------------------------------------
const roadmap: RoadmapPlan = {
  semesters: [
    {
      code: '2024.2',
      total_credits: 10,
      courses: [
        { course_id: 8, code: 'INT301', name: 'Trí tuệ Nhân tạo', credits: 3, is_required: false },
        { course_id: 6, code: 'INT202', name: 'Cơ sở Dữ liệu', credits: 3, is_required: true },
        { course_id: 7, code: 'MAT201', name: 'Đại số tuyến tính', credits: 3, is_required: true },
      ],
    },
  ],
  warnings: [
    { type: 'no_prerequisite', course_ids: [8], detail: 'INT301 cần hoàn thành INT201 trước.' },
  ],
};

const whatIf: WhatIfOut = {
  goal_seek: {
    required_avg: 3.7,
    feasible: true,
    already_met: false,
    max_reachable_cpa: 3.82,
    remaining_credits: 104,
    target_tier: 'xuat_sac',
  },
  projection: { projected_cpa: 3.58, projected_tier: 'gioi' },
};

const suggestion: Suggestion = {
  type: 'high_focus',
  method: 'Deep Work',
  focus: 5,
  planned_minutes: 50,
};

// --- /api/auth/me — echo the visitor's current lang/theme so toggling sticks --
function me(): MeOut {
  const lang = i18n.resolvedLanguage === 'en' ? 'en' : 'vi';
  return {
    user: {
      id: 1,
      email: 'demo@studytrack.app',
      name: 'Minh An',
      lang,
      theme: getStoredTheme(),
      email_verified: true,
      created_at: offsetISO(-300),
    },
    profile: {
      class_name: 'CS2023',
      faculty: 'Khoa Công nghệ Thông tin',
      major: 'Khoa học Máy tính',
      goal: 'Tốt nghiệp loại Giỏi',
      avatar_url: null,
      card_theme: 'studytrack',
      student_code: '23010234',
      target_cpa: 3.6,
      total_credits_required: 130,
      expected_graduation: '2027',
      max_credits_per_semester: 24,
    },
  };
}

/**
 * Resolve a demo response for a request. GETs return read fixtures; the few
 * mutations whose return value the UI consumes (roadmap, what-if, suggestion)
 * return a fixture; all other mutations echo a plausible object so optimistic
 * updates don't throw. Path matching ignores the query string.
 */
export function getPreviewResponse(method: string, path: string, json?: unknown): unknown {
  const p = path.split('?')[0];

  if (method === 'GET') {
    switch (p) {
      case '/api/auth/me':
        return me();
      case '/api/dashboard':
        return dashboard;
      case '/api/sessions':
        return sessions;
      case '/api/gpa':
        return gpa;
      case '/api/grades':
        return grades;
      case '/api/courses':
        return courses;
      case '/api/semesters':
        return semesters;
      case '/api/schedule':
        return schedule;
      case '/api/deadlines':
        return deadlines;
      case '/api/prerequisites':
        return prerequisites;
      case '/api/analysis/direction':
        return direction;
      case '/api/analysis/weak-subjects':
        return weakSubjects;
      case '/api/analytics':
        return analytics;
      case '/api/notifications':
        return notifications;
      case '/api/notifications/unread-count':
        return { count: notifications.filter((n) => !n.read).length } satisfies UnreadCount;
      default:
        return {};
    }
  }

  // Mutations whose response the UI renders.
  if (p === '/api/roadmap/generate' || p === '/api/roadmap/apply') return roadmap;
  if (p === '/api/gpa/what-if') return whatIf;
  if (p === '/api/suggestions') return suggestion;

  // Everything else (create/update/delete/void): a benign success. Echo the
  // sent body with a fake id so optimistic UI paths don't crash.
  if (json && typeof json === 'object') {
    return { id: Math.floor(Math.random() * 100000), ...(json as Record<string, unknown>) };
  }
  return {};
}
