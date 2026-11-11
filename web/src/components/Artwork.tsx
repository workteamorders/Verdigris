import styles from './Artwork.module.css';

export function ExposureRim() {
  return (
    <g className={styles.rim} aria-hidden="true">
      <circle cx="300" cy="300" r="287" stroke="var(--line)" fill="none" strokeWidth="2" />
      <path d="M77 478A285 285 0 0 0 487 515M524 124A285 285 0 0 0 345 19" stroke="var(--patina)" fill="none" strokeWidth="3" />
      {Array.from({ length: 24 }, (_, index) => (
        <path key={index} d={index % 2 ? 'M300 65v5' : 'M300 62v10'} transform={`rotate(${index * 15} 300 300)`} stroke="var(--line-strong)" strokeWidth="2" />
      ))}
    </g>
  );
}

export type ArtworkKind = 'empty' | 'error' | 'missing' | 'offline';

export function RackArtwork({ kind, compact = false }: { kind: ArtworkKind; compact?: boolean }) {
  const fault = kind === 'error' || kind === 'missing';
  return (
    <svg className={styles.art} data-compact={compact || undefined} viewBox="0 0 128 96" aria-hidden="true" fill="none" strokeWidth="2">
      <path d="M8 8H120V88H8Z" stroke="var(--line-strong)" fill="var(--surface)" />
      <path d="M15 15h7v7h-7zM106 15h7v7h-7zM15 74h7v7h-7zM106 74h7v7h-7z" stroke="var(--line-strong)" fill="var(--surface-2)" />
      <circle cx="64" cy="48" r="29" stroke="var(--line-strong)" />
      <path d="M35 49a29 29 0 0 0 49 20M44 26a29 29 0 0 1 47 12" stroke="var(--patina)" />
      {kind === 'empty' && <circle cx="64" cy="48" r="20" stroke="var(--patina-0)" strokeDasharray="5 5" />}
      {fault && <path d="M46 59l14-18 7 10 13-14m-3 25h-9" stroke={kind === 'error' ? 'var(--danger)' : 'var(--patina-text)'} />}
      {kind === 'offline' && <path d="M47 45h12l-3 6h-9m34 0H69l3-6h9m-11-9L58 60" stroke="var(--patina-text)" />}
    </svg>
  );
}

export function ExposureDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <svg viewBox="0 0 72 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M0 8h22m28 0h22M28 8l8-7 8 7-8 7z" />
        <circle cx="36" cy="8" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}
