import type { ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-400 py-8">
      <Loader2 className="animate-spin" size={18} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">Não foi possível carregar</div>
        <div className="text-red-600/90 break-words">{message}</div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
      <Inbox size={24} />
      <span className="text-sm">{children}</span>
    </div>
  );
}

interface StateWrapperProps {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  children: ReactNode;
}

export function StateWrapper({
  isLoading,
  error,
  isEmpty,
  loadingLabel,
  emptyLabel,
  children,
}: StateWrapperProps) {
  if (isLoading) return <Spinner label={loadingLabel} />;
  if (error) return <ErrorBox error={error} />;
  if (isEmpty) return <EmptyState>{emptyLabel ?? 'Nenhum resultado.'}</EmptyState>;
  return <>{children}</>;
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'blue' | 'green' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-iubi-50 text-iubi-700',
    green: 'bg-emerald-50 text-emerald-700',
  } as const;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
