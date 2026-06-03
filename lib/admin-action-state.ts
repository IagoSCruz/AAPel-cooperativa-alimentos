/**
 * Shared action state type for admin Server Actions driven by `useActionState`.
 *
 * All admin `actions.ts` files import from here instead of defining their own
 * local copies.
 */

export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message?: string }
  | { status: "error"; message: string };

export const INITIAL: ActionState = { status: "idle" };
