'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './Field.module.css';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Label is always visible, hint sits under it, the specific error sits under the control. */
export function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className={styles.field} data-invalid={error ? true : undefined}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-err`} role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onBlur'> {
  label: string;
  hint?: string;
  /** Validate on blur, never on the first keystroke. Return a specific message, or undefined when valid. */
  validate?: (value: string) => string | undefined;
  error?: string;
  forceState?: 'hover' | 'focus';
}

export function TextField({ label, hint, validate, error: forcedError, forceState, className, ...rest }: TextFieldProps) {
  const id = useId();
  const [touchedError, setTouchedError] = useState<string | undefined>(undefined);
  const error = forcedError ?? touchedError;
  const described = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className={[styles.input, className].filter(Boolean).join(' ')}
        data-state={forceState}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        onBlur={(e) => setTouchedError(validate ? validate(e.currentTarget.value) : undefined)}
        {...rest}
      />
    </FieldShell>
  );
}

interface StepperProps {
  label: string;
  hint?: string;
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

/** Amount stepper. Prevents the error instead of explaining it: buttons stop at the limits. */
export function Stepper({ label, hint, min, max, value, onChange, disabled }: StepperProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${id}-l`}>
        {label}
      </span>
      {hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <div className={styles.stepper} role="group" aria-labelledby={`${id}-l`} aria-describedby={hint ? `${id}-hint` : undefined}>
        <button type="button" className={styles.stepBtn} aria-label="Decrease amount" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
          &minus;
        </button>
        <output className={styles.stepValue} aria-live="polite">
          {value}
        </output>
        <button type="button" className={styles.stepBtn} aria-label="Increase amount" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export function SelectField({ label, hint, options, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select id={id} className={styles.input} aria-describedby={hint ? `${id}-hint` : undefined} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: string;
  hint?: string;
}

export function Checkbox({ label, hint, ...rest }: ToggleProps) {
  const id = useId();
  return (
    <div className={styles.choice}>
      <input id={id} type="checkbox" className={styles.check} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      <label htmlFor={id}>
        <span className={styles.choiceLabel}>{label}</span>
        {hint ? (
          <span className={styles.hint} id={`${id}-hint`}>
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}

export function Radio({ label, hint, ...rest }: ToggleProps) {
  const id = useId();
  return (
    <div className={styles.choice}>
      <input id={id} type="radio" className={styles.radio} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      <label htmlFor={id}>
        <span className={styles.choiceLabel}>{label}</span>
        {hint ? (
          <span className={styles.hint} id={`${id}-hint`}>
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}

export function Switch({ label, hint, ...rest }: ToggleProps) {
  const id = useId();
  return (
    <div className={styles.choice}>
      <input id={id} type="checkbox" role="switch" className={styles.switch} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      <label htmlFor={id}>
        <span className={styles.choiceLabel}>{label}</span>
        {hint ? (
          <span className={styles.hint} id={`${id}-hint`}>
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: string;
  hint?: string;
  valueText: string;
}

export function Slider({ label, hint, valueText, ...rest }: SliderProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <input id={id} type="range" className={styles.range} aria-valuetext={valueText} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      <span className={`${styles.hint} mono`}>{valueText}</span>
    </FieldShell>
  );
}
