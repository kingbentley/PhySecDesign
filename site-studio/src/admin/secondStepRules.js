// The sign-in page's second-step field check (story 1.5, spec 8, S-26): the entered code or recovery
// code is checked with the rules the server applies (shared/twoStep.ts, standing rule 6) before it
// is sent, so a request is refused by the server only for a reason the page cannot know. No message
// repeats what was typed (AD-22).
//
// Imported only by the lazily loaded sign-in page; kept out of signInClient.js, which
// tests/signin-client.test.mjs loads under Node, where shared/twoStep.ts cannot be imported. Tested
// in server-tests/second-step-page-text.test.ts.
import { normaliseCode, normaliseRecoveryCode } from '../../shared/twoStep.ts';

/** The field messages (wording.md, "Sign in, second step"), by method. */
export const SECOND_STEP_FIELD_MESSAGES = {
  code: 'Enter the 6 digits from your authenticator app.',
  recovery: 'Enter a recovery code: 16 letters and digits.',
};

/**
 * Checks `value` for `method` (`'code'` or `'recovery'`). Answers `{ code }`, the normalised value to
 * send (spaces, and for a recovery code hyphens, removed; lower case), or `{ error }`, the field's
 * message.
 */
export function checkSecondStepCode(method, value) {
  const text = typeof value === 'string' ? value : '';
  const code = method === 'recovery' ? normaliseRecoveryCode(text) : normaliseCode(text);
  if (code === null) return { error: method === 'recovery' ? SECOND_STEP_FIELD_MESSAGES.recovery : SECOND_STEP_FIELD_MESSAGES.code };
  return { code };
}
