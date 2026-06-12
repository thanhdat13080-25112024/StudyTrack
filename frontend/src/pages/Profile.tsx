import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarMenu } from '@/components/AvatarMenu';
import { StudentIdCard } from '@/components/StudentIdCard';
import { CARD_THEMES, cardThemes, type CardTheme } from '@/lib/cardThemes';
import { useMe, useUpdateProfile, useUpdateSettings } from '@/features/auth/hooks';

interface ProfileFormValues {
  name: string;
  class_name: string;
  faculty: string;
  major: string;
  goal: string;
  student_code: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { t } = useTranslation();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset, watch, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      name: '',
      class_name: '',
      faculty: '',
      major: '',
      goal: '',
      student_code: '',
      avatar_url: null,
    },
  });

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  useEffect(() => {
    if (me.data) {
      reset({
        name: me.data.user.name,
        class_name: me.data.profile.class_name,
        faculty: me.data.profile.faculty,
        major: me.data.profile.major,
        goal: me.data.profile.goal,
        student_code: me.data.profile.student_code ?? '',
        avatar_url: me.data.profile.avatar_url,
      });
    }
  }, [me.data, reset]);

  const values = watch();
  const cardTheme = me.data?.profile.card_theme ?? 'studytrack';

  /** Avatar changes save immediately (Facebook-style), not on form submit. */
  const onPickAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setValue('avatar_url', url);
      updateProfile.mutate({ avatar_url: url });
    };
    reader.readAsDataURL(file);
  };

  const onPickTheme = (themeId: CardTheme) => {
    updateProfile.mutate({ card_theme: themeId });
  };

  const onSubmit = (data: ProfileFormValues) => {
    // name lives on User (settings); identity fields live on Profile.
    updateSettings.mutate({ name: data.name });
    updateProfile.mutate({
      class_name: data.class_name,
      faculty: data.faculty,
      major: data.major,
      goal: data.goal,
      student_code: data.student_code || null,
      avatar_url: data.avatar_url,
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold text-text-main">{t('profile.title')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label={t('profile.name')} id="name">
            <Input id="name" {...register('name')} />
          </Field>
          <Field label={t('profile.class')} id="class_name">
            <Input id="class_name" {...register('class_name')} />
          </Field>
          <Field label={t('profile.faculty')} id="faculty">
            <Input id="faculty" {...register('faculty')} />
          </Field>
          <Field label={t('profile.major')} id="major">
            <Input id="major" {...register('major')} />
          </Field>
          <Field label={t('profile.studentCode')} id="student_code">
            <Input id="student_code" {...register('student_code')} />
          </Field>
          <Field label={t('profile.goal')} id="goal">
            <Input id="goal" {...register('goal')} />
          </Field>
          <Button type="submit" disabled={updateProfile.isPending || updateSettings.isPending}>
            {t('profile.save')}
          </Button>
        </form>
      </Card>

      <div className="relative md:pt-12">
        <StudentIdCard
          name={values.name}
          className={values.class_name}
          major={values.major}
          avatarUrl={values.avatar_url}
          theme={cardTheme}
          studentCode={values.student_code}
          onAvatarClick={() => setAvatarMenuOpen((v) => !v)}
        />
        <AvatarMenu
          open={avatarMenuOpen}
          onClose={() => setAvatarMenuOpen(false)}
          avatarUrl={values.avatar_url}
          onPick={onPickAvatar}
        />
        <div className="mt-4 flex items-center gap-3">
          {CARD_THEMES.map((id) => (
            <button
              key={id}
              type="button"
              title={t(`studentId.theme.${id}`)}
              aria-label={t(`studentId.theme.${id}`)}
              aria-pressed={cardTheme === id}
              onClick={() => onPickTheme(id)}
              className={`h-8 w-8 rounded-full border border-border motion-safe:active:scale-[.97] ${
                cardTheme === id ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-body' : ''
              }`}
              style={{ background: cardThemes[id].swatch }}
            />
          ))}
        </div>
        {updateProfile.isError && (
          <p className="mt-2 text-sm text-red-400">{t('common.actionFailed')}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
