import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { PREVIEW_MODE } from '@/lib/previewMode';

/**
 * Shown only on the backend-less Vercel preview build (`VITE_PREVIEW_MODE`):
 * tells visitors they're browsing a demo with sample data, no live backend or
 * login. Returns null on the real (VPS) build. Mounted in the app shell.
 */
export function PreviewBanner() {
  const { t } = useTranslation();
  if (!PREVIEW_MODE) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-accent bg-bg-card px-4 py-2 text-sm text-text-main">
      <Eye className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span>{t('preview.banner')}</span>
    </div>
  );
}
