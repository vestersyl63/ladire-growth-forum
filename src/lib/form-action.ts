/**
 * Bind a server action for use as a <form action> prop.
 *
 * React's DOM types only accept void-returning functions, while Next.js server
 * actions may return serializable payloads (which React simply ignores on
 * submit). Binding the *action reference* (rather than an inline closure) keeps
 * the value serializable across the RSC boundary — inline arrows are not.
 */
export type FormActionValue = (formData: FormData) => void | Promise<void>;

function bindAction(action: unknown, args: unknown[]): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (action as any).bind(null, ...args);
}

export function fa<A extends unknown[]>(
  action: (...args: A) => unknown,
  ...args: A
): FormActionValue {
  return bindAction(action, args) as unknown as FormActionValue;
}

/** Bind an action for ConfirmForm-style client wrappers (any return allowed). */
export function fb<A extends unknown[]>(
  action: (...args: A) => unknown,
  ...args: A
): (payload: FormData) => unknown {
  return bindAction(action, args) as (payload: FormData) => unknown;
}
