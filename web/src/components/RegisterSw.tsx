'use client';
import { useEffect } from 'react';

/** Registers the offline-page worker in production builds only. */
export function RegisterSw() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);
  return null;
}
