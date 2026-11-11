import type { SVGProps } from 'react';

// One icon family: 24 grid, 1.5 stroke, square caps, mitred joins. Matches the square material language.
const PATHS = {
  check: 'M4 12.5L9.5 18L20 6.5',
  x: 'M5 5L19 19M19 5L5 19',
  alert: 'M12 3L21 12L12 21L3 12ZM12 8V13M12 15.8V16.4',
  info: 'M4 4H20V20H4ZM12 11V17M12 7.6V8.4',
  menu: 'M3 7H21M3 12H21M3 17H21',
  chevron: 'M8 4L16 12L8 20',
  arrow: 'M3 12H20M14 6L20 12L14 18',
  clock: 'M12 3a9 9 0 1 0 0.01 0ZM12 7V12L16 14',
  lock: 'M6 11H18V20H6ZM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  wallet: 'M3 6H21V19H3ZM3 6V4H17V6M15 12.5H18',
  external: 'M10 5H5V19H19V14M13 4H20V11M20 4L11 13',
  copy: 'M8 8H20V20H8ZM4 4H16V6M4 4V16H6',
  spinner: 'M12 3a9 9 0 1 0 9 9',
  eye: 'M2 12C5 6.5 19 6.5 22 12C19 17.5 5 17.5 2 12ZM12 9.5a2.5 2.5 0 1 0 0.01 0Z',
  send: 'M3 12L21 4L14 21L11 13Z',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Provide a label when the icon stands alone; otherwise it is decorative. */
  label?: string;
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
