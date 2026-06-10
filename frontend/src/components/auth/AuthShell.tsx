import { AuthHero } from '@/components/auth/AuthHero';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-full grid-cols-1 bg-bg-main lg:grid-cols-2">
      {/* Mobile: slim top band. Desktop: full-height left hero. */}
      <div className="h-28 lg:h-auto">
        <AuthHero />
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md rounded-card border border-border bg-bg-card p-8 shadow-soft">
          <h1 className="mb-6 text-2xl font-bold tracking-heading text-text-main">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
