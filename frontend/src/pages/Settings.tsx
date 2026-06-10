import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import {
  useChangePassword,
  useDeleteAccount,
  useExportData,
  useResendVerification,
} from '@/features/auth/hooks';

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const verified = useAuthStore((s) => s.user?.user.email_verified ?? false);

  const changePassword = useChangePassword();
  const resend = useResendVerification();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();

  // --- Change password ---
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  const onChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwOk(false);
    changePassword.mutate(
      { current_password: currentPw, new_password: newPw },
      {
        onSuccess: () => {
          setPwOk(true);
          setCurrentPw('');
          setNewPw('');
        },
        onError: () => setPwError(t('settings.changePasswordWrong')),
      },
    );
  };

  // --- Export ---
  const onExport = async () => {
    const data = await exportData.mutateAsync();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studytrack-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Delete account ---
  const [deletePw, setDeletePw] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    deleteAccount.mutate(
      { password: deletePw },
      {
        onSuccess: () => navigate('/register', { replace: true }),
        onError: () => setDeleteError(t('settings.deleteWrong')),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-helper">{t('settings.title')}</h1>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-pw">{t('settings.currentPassword')}</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-pw">{t('auth.newPassword')}</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            {pwError && <span className="text-sm text-red-400">{pwError}</span>}
            {pwOk && (
              <span className="text-sm text-green-400">{t('settings.changePasswordSuccess')}</span>
            )}
            <Button type="submit" disabled={changePassword.isPending} className="self-start">
              {t('settings.changePasswordSubmit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.emailStatus')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <span className={verified ? 'text-sm text-green-400' : 'text-sm text-text-muted'}>
            {verified ? t('settings.verified') : t('settings.unverified')}
          </span>
          {!verified && (
            <Button
              variant="outline"
              size="sm"
              disabled={resend.isPending}
              onClick={() => resend.mutate()}
            >
              {t('auth.verifyResend')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.exportData')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled={exportData.isPending} onClick={onExport}>
            {t('settings.exportButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/60">
        <CardHeader>
          <CardTitle className="text-red-400">{t('settings.dangerZone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onDelete} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-text-muted">{t('settings.deleteWarning')}</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-pw">{t('settings.deleteConfirmLabel')}</Label>
              <Input
                id="delete-pw"
                type="password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
              />
            </div>
            {deleteError && <span className="text-sm text-red-400">{deleteError}</span>}
            <Button
              type="submit"
              disabled={deleteAccount.isPending || deletePw.length === 0}
              className="self-start bg-red-600 text-white hover:bg-red-700"
            >
              {t('settings.deleteButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
