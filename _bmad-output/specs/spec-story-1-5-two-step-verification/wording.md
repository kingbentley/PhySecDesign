# Story 1.5: wording (D-21)

**Decided** (D-21, Claude, accepted on Kevin's instruction, 2026-11-22; amended for review findings 1, 10, 11, 25, 26 and the ruled key-state check). Exact text for every new screen part, message, refusal and deploy-command line. ‹…› marks a value filled in. Text reused unchanged from an existing page is marked (reused) with its source. A builder adds no other text; anything missing is raised, not invented.

## Refusals (`shared/refusal.ts`)

| Code | Status | Message |
|---|---|---|
| `second_step_code_wrong` | 401 | That code does not match or was already used. Wait for the next code in your authenticator app and try again. |
| `second_step_recovery_code_wrong` | 401 | That recovery code does not match, or it has already been used. |
| `second_step_expired` | 401 | This sign-in has expired. Sign in again with your email and password. |
| `two_step_password_wrong` | 403 | That password is not correct. |
| `two_step_code_wrong` | 403 | That code does not match. Check that the app shows this installation and try the newest code. |
| `two_step_setup_expired` | 409 | This set-up has expired or was replaced. Start again. |
| `two_step_already_on` | 409 | Two-step verification is already on for this account. |
| `two_step_off` | 409 | Two-step verification is off for this account. |
| `deployment_key_missing` | 503 | Two-step verification is not available on this installation yet: it has no deployment key. Ask an administrator. |
| `deployment_key_mismatch` | 503 | Two-step verification cannot be checked on this installation: its deployment key does not match the one its secrets were saved with. Ask an administrator to deploy it again with the original key. |

Reused: `signin_wait` (page wording "Too many attempts. Wait ‹1 minute› before trying again.", story 1.3's D-8), `signin_busy`, `not_signed_in`, `origin_refused`, `invalid_input`, `updating`.

## Sign in, second step (S-26)

- Heading: "Two-step verification"
- Lead: "Open your authenticator app and enter the 6-digit code for ‹installation name›."
- Field label: "Code"; hint under it: "6 digits. Spaces are ignored."
- Button: "Verify and sign in"; while sending: "Checking…"
- Link-style button: "Use a recovery code"
- Recovery mode lead: "Enter one of the recovery codes you saved when you turned on two-step verification. Each code works once."
- Recovery field label: "Recovery code"; button "Sign in with recovery code"; link-style button "Use a code from your authenticator app"
- Button under both modes: "Back to sign in"
- Field check (page, before sending): code "Enter the 6 digits from your authenticator app."; recovery code "Enter a recovery code: 16 letters and digits."
- After `second_step_expired` or a wait the page shows the password form with the refusal's message (the wait as story 1.3 composes it).
- After `deployment_key_mismatch` on a code: the `deployment_key_mismatch` message, then "You can still sign in with a recovery code."; the page switches to recovery mode (finding 26).
- Network, updating, origin and other failures: the sign-in page's existing messages (reused, `SIGN_IN_MESSAGES` in `src/admin/signInClient.js`).

## Account menu and My account (S-29, this story's part)

- Menu item: "My account"
- Dialog heading: "My account"; close button "Close"
- Section heading: "Two-step verification"
- State chip: "On" (filled check shape) or "Off" (empty circle shape), with the label always shown (standing rule 3)
- Off: "After your password, signing in will also ask for a code from an authenticator app on your phone, so a stolen password alone is not enough." Button: "Turn on two-step verification"
- On: "Recovery codes left: ‹n› of 10". At 0: "No recovery codes left. Make a fresh set so you can still sign in if you lose your phone." Buttons: "Make fresh recovery codes", "Turn off two-step verification"
- `no_key`: the `deployment_key_missing` message, no buttons
- `key_mismatch`: the `deployment_key_mismatch` message, then "You can still sign in with a recovery code." Button: "Turn off two-step verification" (when on)
- Loading fails: "Two-step verification could not be loaded. Check the connection and try again." Button "Try again"

### Turning on

1. Heading "Confirm it is you"; "Enter your password to set up two-step verification."; field "Password" (`autocomplete="current-password"`); buttons "Continue", "Cancel"
2. Heading "Scan this code with your authenticator app"; QR image's accessible name "QR code to add ‹installation name› to your authenticator app"; "Can't scan it? Enter this key in the app instead:" then the key in groups of four; button "Copy key" / "Copied"; "Choose a time-based key. The entry will be named ‹installation name›:‹email›."; field "Code from the app" with the hint "6 digits. Spaces are ignored."; buttons "Turn on", "Cancel"
3. Heading "Save your recovery codes"; "Each code signs you in once if you cannot use your authenticator app. Keep them somewhere safe, such as a password manager. They are shown only now."; the 10 codes as a list; buttons "Copy codes" / "Copied", "Download codes"; button "I have saved my codes" (returns to the section, now On)
- Copy failure: "The codes could not be copied. Select them and copy them, or download them." (for the key: "The key could not be copied. Select it and copy it.")

### Fresh recovery codes

- Heading "Make fresh recovery codes"; "Your current recovery codes stop working."; fields "Password", "Code from the app"; buttons "Make fresh codes", "Cancel"; then step 3 above

### Turning off

- Heading "Turn off two-step verification"; "Signing in will need only your password, and your recovery codes stop working."; field "Password"; buttons "Turn off", "Cancel"; then "Two-step verification is off." in the section

### Download file

Name `site-survey-design-recovery-codes.txt`, plain text, UTF-8, LF line ends:

```
Site Survey Design recovery codes
Installation: ‹installation name›
Account: ‹email›
Made: ‹local date and time, as story 1.4's expiry›

Each code works once.

‹code 1›
…
‹code 10›
```

## Offer after accepting an invitation (S-27)

- Heading: "Protect your account"
- "Turn on two-step verification now? After your password, signing in will also ask for a code from an authenticator app on your phone. You can turn it on later from My account."
- Buttons: "Set up two-step verification", "Skip for now"
- The set-up steps as under "Turning on"; after step 3 the button reads "Continue to Site Survey Design"

## Deploy command (`scripts/deploy-cloudflare.mjs`)

- First line of every run (finding 10): "Run one deploy at a time for a Worker: two at once can each generate a deployment key, and the one printed may not be the one kept."
- Generated (printed before the key is stored, finding 1):
  - `  Deployment key: ‹key›`
  - "This key protects the two-step verification secrets this installation stores. It is shown only this once. Keep a copy outside the Cloudflare account, for example in your organisation's password manager. To deploy this installation to a new Worker, or to recover it, supply the key in the SITE_SURVEY_DEPLOYMENT_KEY environment variable."
- Kept: "The Worker already has a deployment key, so none was generated."
- Supplied and used: "The deployment key from SITE_SURVEY_DEPLOYMENT_KEY was supplied to the Worker. No key was generated."
- Supplied while one exists: "The Worker already has a deployment key; the key in SITE_SURVEY_DEPLOYMENT_KEY was not used."
- Supplied but malformed (error, nothing deployed): "SITE_SURVEY_DEPLOYMENT_KEY does not hold a deployment key: it must be 43 letters, digits, - or _. Nothing was deployed."
- Encrypted values but no key (error, D-18): "This installation already holds secrets saved with a deployment key, but the Worker has none. Supply the original key in SITE_SURVEY_DEPLOYMENT_KEY and run the command again. No key was generated."
- Listing failed (error): "The Worker's secrets could not be listed, so no deployment key was generated or supplied. Run the command again."
- Storing a generated key failed (error, finding 1): "The key above may or may not have been stored. Keep it, and run the command again with it in SITE_SURVEY_DEPLOYMENT_KEY."
- Key state unreadable (error, finding 11): "‹address›/api/v1/deployment-key/state did not say whether this installation holds encrypted values, so no deployment key was generated or supplied. Run the command again."
- Supplied key does not match the stored fingerprint (error, ruled key-state check): "The key in SITE_SURVEY_DEPLOYMENT_KEY is not the original deployment key of this installation: it does not match the secrets it holds. Supply the original key and run the command again."
- Supplied key not confirmed in time (error): "The Worker did not say whether the key in SITE_SURVEY_DEPLOYMENT_KEY matches the secrets this installation holds. Run the command again with the same key."

## Runtime log (no key material, no account data)

- Once per object start, the first time an operation meets the condition: `{"event":"deployment_key_mismatch","object":"installation"}` or `{"event":"deployment_key_missing","object":"installation"}` when a fingerprint is stored and the key the Worker passed differs or is absent (D-22); `"reason":"malformed"` is added when a key was passed that does not parse (finding 30).
