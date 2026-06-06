import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});
export type AuthFormValues = z.infer<typeof schema>;

interface AuthFormProps {
  mode: 'login' | 'register';
  pending: boolean;
  error?: string | null;
  onSubmit: (values: AuthFormValues) => void;
}

export function AuthForm({ mode, pending, error, onSubmit }: AuthFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {mode === 'register' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input id="name" {...register('name', { required: mode === 'register' })} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <span className="text-sm text-red-400">{t('auth.invalidEmail')}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <span className="text-sm text-red-400">{t('auth.passwordTooShort')}</span>
        )}
      </div>
      {error && <span className="text-sm text-red-400">{error}</span>}
      <Button type="submit" disabled={pending}>
        {mode === 'login' ? t('auth.login') : t('auth.register')}
      </Button>
    </form>
  );
}
