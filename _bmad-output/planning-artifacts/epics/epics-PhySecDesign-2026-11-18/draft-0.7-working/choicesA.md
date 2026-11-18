# Choices made in Epic 1 (stories 1.1–1.10), for Kevin to confirm

Format: `story | choice made | why`

1.1 | An object whose recorded data-format version is newer than the build's refuses requests with an explanation | AD-20 conversions are forward-only; this is the base behaviour that story 9.3 extends with the pending-update recovery rule
1.1 | "Dependency versions are pinned" is tested by a clean install from the lock file in continuous integration | Gives the R7 install problem an observable check
1.2 | On Cloudflare the deploy command generates the set-up code (random, at least 20 characters), supplies it as a secret and prints it once in the deployment output | Architecture says only "shown in the server output or the deployment output"; a Worker has no server output visible at deploy time
1.2 | Wrong set-up codes: after 5, attempts from any address are refused for 1 minute, doubling to a 15-minute maximum | Same pattern as sign-in; a fresh install is exposed to guessing (review edge case 4)
1.2 | Installation name is 1 to 80 characters | Needs a bound; fits a sign-in page heading
1.3 | Invitation lasts 7 days by default | Conventional; long enough to pass a link on by hand
1.2 | Password (all accounts, stated in 1.2 and reused by 1.3 and 1.5): 12 to 128 characters, must not equal the email, no composition rules | Follows current published guidance (length over composition); architecture section 15 left it open
1.3 | Sign-in slowing: 5 failures in a row per email, or 20 per network address in 15 minutes, then a 1-minute wait doubling to 15 minutes; the same wait for unknown emails | AD-12 says "slowed per account and per address"; UX S-26 says the page states how long to wait; the same wait avoids revealing which emails exist
1.3 | PBKDF2-SHA256 at 600,000 iterations | The count measured in experiment R8 and named in AD-12
1.3 | R9 passes if the hash is accepted without a platform error and median sign-in is under 1 second over 20 sign-ins | R9 needed a pass condition; R8 measured about 75 ms, so 1 second leaves a wide margin
1.3 | Session cookie is SameSite=Lax | AD-12 says "only to this site"; Lax lets a person arriving from an emailed link stay signed in, and change requests are separately checked for origin and header
1.3 | Inviting an email with an existing account is refused with that account's state; re-inviting a pending email replaces the earlier link | One account per email, one live invitation (review edge case 5)
1.3 | A minimal account menu (name, Sign out) is added to the existing prototype header in this story; My account, Projects and Administration join it in 1.5, 1.6 and 1.8 | Sign-out and later entry points need a place before the project frame of story 3.1
1.4 | 10 recovery codes | Conventional number
1.4 | Codes are 6 digits on a 30-second step; one step either side is accepted; an accepted code cannot be reused | Standard authenticator-app behaviour and clock tolerance
1.4 | Wrong second-step and recovery codes share the limit and wait of wrong passwords | Stops a six-digit code being guessed once the password is known (review edge case 8)
1.4 | A fresh set of recovery codes needs the password and a current code | Review edge case 9; conventional
1.4 | The authenticator secret is stored encrypted with a deployment key that the deploy command generates and supplies as a secret | AD-17 states this for settings secrets only; the same protection is applied to two-step secrets, as review edge case 60 assumes
1.5 | Session ends after 24 hours without use by default | Conservative for accounts that can change project records; a technician signs in once a working day; the administrator can lengthen it in 1.10
1.5 | Every request that passes sign-in counts as use of the session | So a long upload is not ended by the idle period (review edge case 14)
1.5 | Sessions list shows device, time of last use and network address, with a country or city only where the host supplies one | UX asks for "place of last use"; a self-hosted server has no location source
1.5 | Pending input is kept only for the same account; if another account signs in on that page it is shown but not sent | Prevents one person's input being saved under another's name (review edge case 12)
1.6 | Project name is 1 to 120 characters; duplicate names are allowed | Needs a bound; properties can share names
1.6 | The administrator who sees exactly one project in the installation is also sent straight to it, with the list reachable from the account menu | UX D11 says "a user with exactly one project" without excluding administrators
1.6 | Until story 2.1 a project's address loads the existing prototype app with browser-only data | Something must be at the address before the shared project exists
1.7 | "Last administrator" counts only active accounts that have accepted their invitation, and the check and change happen in one write | Review edge cases 2 and 3
1.7 | Membership is set through administrator-only server functions in this story; the screens come in 1.8 | Keeps the gate testable before the administration screens exist
1.8 | Administrator-issued reset link expires after 24 hours | Passed on by hand, so longer than an emailed link, but short
1.8 | A password reset ends all the account's sessions and never turns two-step verification off | AD-12 ends sessions on password change; review edge case 11
1.8 | Deactivation cancels the account's unused invitation and reset links; a link opened for a deactivated account is refused | Review edge case 7
1.8 | After an administrator resets two-step verification, old recovery codes stop working and the user is offered set-up again | A reset should leave nothing of the old set-up usable
1.8 | Recovery when the only administrator cannot sign in: a documented command run by whoever controls the host prints a one-time code, valid 1 hour, that lets a named administrator account set a new password and resets its two-step verification; logged | Review edge case 1; not in the PRD, so Kevin should confirm this explicitly. Same trust basis as the set-up code (control of the host)
1.8 | The Projects table in this story shows name, members and creation date only | State, last activity, stored size and latest backup cannot be tested until stories 2.1, 6.11, 8.1 and 8.5
1.9 | Export is a CSV file of the filtered log | FR-71 says "export" without a format; CSV matches the estimate export
1.9 | A failed sign-in entry records the email entered and the network address, whether or not an account exists | Needed to investigate guessing; FR-71 forbids only passwords, tokens and codes
1.10 | Session period accepts 15 minutes to 30 days; invitation life accepts 1 to 30 days | Review edge case 16 asks for bounds
1.10 | A changed session period applies to existing sessions on their next request; a changed invitation life applies to invitations issued afterwards | FR-70 Check: "changes the session period and sees it take effect"
1.10 | Emailed reset link expires after 1 hour; at most 3 reset messages per account per hour; same reply for every email | Conventional; review edge case 17
1.10 | A saved secret shows only its last 4 characters | UX S-33 says "only its last characters"
1.10 | The activity log records settings changes with earlier and new value, but a secret only as "changed" | FR-71: no secret in the log
1.10 | SMTP is offered only if R13 passes on both hosts; the self-hosted run uses the self-hosted configuration from story 1.1 | The self-hosted image does not exist until story 2.13
1.10 | Turning off "standard users may create projects" leaves existing projects and their members unchanged | Edge of FR-68
1.10 | Settings state beside the Google mapping key that it is visible in signed-in users' browsers; other secrets are never shown in full | Story 2.6 delivers the key to browsers, which a Maps key requires (review finding 12)
