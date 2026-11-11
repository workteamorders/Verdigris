'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Toast.module.css';

type ToastTone = 'success' | 'danger' | 'info';
interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  line: string;
}

const ICONS: Record<ToastTone, IconName> = { success: 'check', danger: 'alert', info: 'info' };
const ToastContext = createContext<((t: Omit<ToastItem, 'id'>) => void) | null>(null);

export function useToast(): (t: Omit<ToastItem, 'id'>) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast needs <ToastProvider>');
  return ctx;
}

/** Short title plus one line. Dismisses itself after 5 seconds, can be closed, announced to screen readers, never covers the main action. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const remove = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = nextId.current++;
      setItems((xs) => [...xs.slice(-2), { ...t, id }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`}>
            <Icon name={ICONS[t.tone]} />
            <div className={styles.text}>
              <strong>{t.title}</strong>
              <span>{t.line}</span>
            </div>
            <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => remove(t.id)}>
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
