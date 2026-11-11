'use client';

import { useMotion } from '@/lib/motion';
import styles from './MotionToggle.module.css';

/** Lets a visitor turn motion down. The system setting always wins and disables the button. */
export function MotionToggle() {
  const { osReduced, preference, setPreference } = useMotion();
  const reduced = osReduced || preference === 'reduced';
  return (
    <button
      type="button"
      className={styles.toggle}
      disabled={osReduced}
      title={osReduced ? 'Your system asks for reduced motion' : reduced ? 'Turn motion back on' : 'Turn motion down'}
      onClick={() => setPreference(reduced ? 'auto' : 'reduced')}
    >
      <span className={styles.knob} data-on={!reduced || undefined} aria-hidden="true" />
      <span className="label">Motion: {reduced ? 'Reduced' : 'Full'}</span>
    </button>
  );
}
