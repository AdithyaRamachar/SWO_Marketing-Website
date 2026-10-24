import { createContext, useContext, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { CircleX } from 'lucide-react';
import { cx } from '../lib/cx.ts';

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useField(component: string): FieldContextValue {
  const context = useContext(FieldContext);
  if (!context) throw new Error(`${component} must be rendered inside <FormField>`);
  return context;
}

export interface FormFieldProps {
  label: string;
  hint?: string;
  /** When set, the field is marked invalid and the message is announced with it. */
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Wires a visible label, optional hint and optional error to the control inside
 * it, so every control has an accessible name and description.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cx('flex flex-col gap-2', className)}>
        <label htmlFor={id} className="text-small font-semibold text-text-primary">
          {label}
          {required && (
            <>
              <span aria-hidden="true"> *</span> <span className="sr-only">(required)</span>
            </>
          )}
        </label>
        {hint && (
          <p id={hintId} className="text-small text-text-secondary">
            {hint}
          </p>
        )}
        {children}
        {error && (
          // Icon + text, so the error is not signalled by colour alone.
          <p
            id={errorId}
            className="flex items-center gap-2 text-small font-medium text-feedback-danger-fg"
          >
            <CircleX aria-hidden="true" className="size-4 shrink-0" />
            <span>
              <span className="sr-only">Error:</span> {error}
            </span>
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

const controlStyles =
  'min-h-(--min-target-size) w-full rounded-control border bg-surface-page px-3 py-2 ' +
  'text-body text-text-primary placeholder:text-text-secondary ' +
  'disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-text-disabled';

function borderFor(invalid: boolean): string {
  // The invalid border is thicker as well as red: a second non-colour cue.
  return invalid ? 'border-2 border-feedback-danger-fg' : 'border-border-strong';
}

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'>;

export function TextInput({ className, ...rest }: TextInputProps) {
  const field = useField('TextInput');
  return (
    <input
      id={field.id}
      required={field.required}
      aria-invalid={field.invalid || undefined}
      aria-describedby={field.describedBy}
      className={cx(controlStyles, borderFor(field.invalid), className)}
      {...rest}
    />
  );
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'required'
> {
  children: ReactNode;
}

export function Select({ className, children, ...rest }: SelectProps) {
  const field = useField('Select');
  return (
    <select
      id={field.id}
      required={field.required}
      aria-invalid={field.invalid || undefined}
      aria-describedby={field.describedBy}
      className={cx(controlStyles, borderFor(field.invalid), className)}
      {...rest}
    >
      {children}
    </select>
  );
}
