/**
 * Hidden honeypot input — pair with `lib/spam-honeypot.ts` on the server.
 *
 * Drop this inside any <form> that submits to a public API route which
 * runs `isHoneypotTriggered()`. Real users never see or fill this field
 * (visually hidden, aria-hidden, tab-skipped, autocomplete off). Dumb bots
 * blindly fill every input on the page, which the server quietly silently
 * drops as spam.
 *
 * The component is a controlled input with no `value` prop — we keep it
 * uncontrolled so it lives in the DOM but sits outside React state. The
 * caller reads the value from a ref or via FormData on submit. To keep
 * the existing `await fetch('/api/contact', { body: JSON.stringify({...}) })`
 * pattern working without each call site changing how it reads form data,
 * we render a `name="website"` input and let parent code grab its value
 * via a ref or via the form's elements collection.
 */

import { useId } from 'react';
import { HONEYPOT_FIELD_NAME } from '@/lib/spam-honeypot';

interface HoneypotFieldProps {
  /** Optional ref so callers can read the field value at submit time. */
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Inline styles instead of Tailwind classes so this works regardless of
 * whether Tailwind's CSS has loaded yet, and so the styles can't be
 * accidentally overridden by a developer touching the field's parent.
 *
 * `position: absolute; left: -9999px` keeps the field in the layout/tab
 * order conceptually, but visually off-screen. `tabIndex={-1}` removes it
 * from keyboard tab order. `aria-hidden` keeps screen readers from reading
 * it.
 */
const hiddenStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none',
};

export function HoneypotField({ inputRef }: HoneypotFieldProps = {}) {
  // Stable, non-clashing id for label association; not strictly required
  // because the label is hidden, but linters complain otherwise.
  const id = useId();
  return (
    <div aria-hidden="true" style={hiddenStyle}>
      <label htmlFor={id}>Website (leave blank)</label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
