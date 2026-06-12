import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  History,
  LayoutDashboard,
  Route,
  Timer,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  key: string;
  icon: LucideIcon;
}
export interface NavGroup {
  key: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'nav.group.habit',
    items: [
      { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/focus', key: 'nav.focus', icon: Timer },
      { to: '/history', key: 'nav.history', icon: History },
      { to: '/schedule', key: 'nav.schedule', icon: CalendarDays },
    ],
  },
  {
    key: 'nav.group.academic',
    items: [
      { to: '/courses', key: 'nav.courses', icon: BookOpen },
      { to: '/grades', key: 'nav.grades', icon: GraduationCap },
      { to: '/roadmap', key: 'nav.roadmap', icon: Route },
      { to: '/analysis', key: 'nav.analysis', icon: Activity },
    ],
  },
  {
    key: 'nav.group.insight',
    items: [
      { to: '/analytics', key: 'nav.analytics', icon: BarChart3 },
      { to: '/deadlines', key: 'nav.deadlines', icon: CalendarClock },
    ],
  },
];
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
