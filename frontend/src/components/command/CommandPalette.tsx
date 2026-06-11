/**
 * CommandPalette — the ⌘K command palette (Phase C).
 *
 * Built on `cmdk`, dressed as the house modal (matching `SemesterManager`): a
 * `bg-black/50` backdrop over an `elevated` white card, `role="dialog"`
 * `aria-modal`, Inter, fully tokenized. We render the raw `Command` (not
 * `Command.Dialog`, which pulls in Radix Dialog's portal + title requirement)
 * inside our own backdrop so the chrome matches the rest of the app exactly.
 *
 * Notion-blue `accent` is the only structural/active signal (the selected row's
 * left indicator + text); list icons stay quiet (`text-text-faint`), group
 * headers are eyebrow type. Picking any item closes the palette; Esc + backdrop
 * click close too.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Languages,
  LogOut,
  MoonStar,
  Plus,
  Timer as TimerIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_HEADING =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-eyebrow [&_[cmdk-group-heading]]:text-text-faint';

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleLang = useUiStore((s) => s.toggleLang);
  const logout = useAuthStore((s) => s.logout);

  const close = () => onOpenChange(false);

  // Esc closes (cmdk doesn't own the overlay here).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
    close();
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t('command.title')}
      onClick={close}
    >
      <Command
        label={t('command.title')}
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-bg-card text-text-main shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          autoFocus
          placeholder={t('command.placeholder')}
          className="w-full border-b border-border bg-transparent px-4 py-3 text-[15px] leading-snug text-text-main outline-none placeholder:text-text-faint"
        />
        <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-[15px] text-text-faint">
            {t('command.empty')}
          </Command.Empty>

          <Command.Group heading={t('command.group.navigate')} className={`px-1 ${GROUP_HEADING}`}>
            {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
              <PaletteItem key={to} value={`nav ${t(key)} ${to}`} onSelect={() => go(to)}>
                <Icon className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
                <span>{t(key)}</span>
              </PaletteItem>
            ))}
          </Command.Group>

          <Command.Group
            heading={t('command.group.actions')}
            className={`mt-1 px-1 ${GROUP_HEADING}`}
          >
            <PaletteItem value={t('command.action.startFocus')} onSelect={() => go('/focus')}>
              <TimerIcon className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.startFocus')}</span>
            </PaletteItem>
            <PaletteItem value={t('command.action.newSession')} onSelect={() => go('/focus')}>
              <Plus className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.newSession')}</span>
            </PaletteItem>
            <PaletteItem value={t('command.action.newDeadline')} onSelect={() => go('/deadlines')}>
              <CalendarClock className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.newDeadline')}</span>
            </PaletteItem>
            <PaletteItem value={t('command.action.newCourse')} onSelect={() => go('/courses')}>
              <Plus className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.newCourse')}</span>
            </PaletteItem>
          </Command.Group>

          <Command.Group
            heading={t('command.group.system')}
            className={`mt-1 px-1 ${GROUP_HEADING}`}
          >
            <PaletteItem
              value={t('command.action.toggleTheme')}
              onSelect={() => {
                toggleTheme();
                close();
              }}
            >
              <MoonStar className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.toggleTheme')}</span>
            </PaletteItem>
            <PaletteItem
              value={t('command.action.toggleLang')}
              onSelect={() => {
                toggleLang();
                close();
              }}
            >
              <Languages className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.toggleLang')}</span>
            </PaletteItem>
            <PaletteItem value={t('command.action.logout')} onSelect={handleLogout}>
              <LogOut className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
              <span>{t('command.action.logout')}</span>
            </PaletteItem>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

/**
 * A list row: `rounded-sm` `body-sm`, quiet by default; the active row (cmdk
 * sets `aria-selected`) takes `bg-menu-item` + a 2px accent left indicator +
 * accent text — the single structural accent.
 */
function PaletteItem({
  value,
  onSelect,
  children,
}: {
  value: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-sm border-l-2 border-transparent px-3 py-2 text-[15px] text-text-helper aria-selected:border-accent aria-selected:bg-menu-item aria-selected:font-medium aria-selected:text-accent"
    >
      {children}
    </Command.Item>
  );
}
