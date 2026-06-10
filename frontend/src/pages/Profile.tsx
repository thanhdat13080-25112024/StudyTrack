import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentIdCard } from '@/components/StudentIdCard';
import { useMe, useUpdateProfile, useUpdateSettings } from '@/features/auth/hooks';

interface ProfileFormValues {
  name: string;
  class_name: string;
  faculty: string;
  major: string;
  goal: string;
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
      avatar_url: null,
    },
  });

  useEffect(() => {
    if (me.data) {
      reset({
        name: me.data.user.name,
        class_name: me.data.profile.class_name,
        faculty: me.data.profile.faculty,
        major: me.data.profile.major,
        goal: me.data.profile.goal,
        avatar_url: me.data.profile.avatar_url,
      });
    }
  }, [me.data, reset]);

  const values = watch();

  const onAvatar = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue('avatar_url', String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: ProfileFormValues) => {
    // name lives on User (settings); identity fields live on Profile.
    updateSettings.mutate({ name: data.name });
    updateProfile.mutate({
      class_name: data.class_name,
      faculty: data.faculty,
      major: data.major,
      goal: data.goal,
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
          <Field label={t('profile.goal')} id="goal">
            <Input id="goal" {...register('goal')} />
          </Field>
          <Field label={t('profile.avatar')} id="avatar">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => onAvatar(e.target.files?.[0])}
            />
          </Field>
          <Button type="submit" disabled={updateProfile.isPending || updateSettings.isPending}>
            {t('profile.save')}
          </Button>
        </form>
      </Card>

      <div className="md:pt-12">
        <StudentIdCard
          name={values.name}
          className={values.class_name}
          major={values.major}
          avatarUrl={values.avatar_url}
        />
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
