8.1 | A backup location on the same disk as live data is allowed, with a warning on S-34 | UX 17.4 specifies a warning, not a refusal
8.1 | One backup job per project at a time; Back up now during a running job shows that job; a daily backup due during a manual one waits and is skipped if the manual one succeeded | Avoids two jobs writing one generation; simplest rule
8.1 | A failed backup does not count toward the seven kept generations and removes none | PRD says seven successful generations
8.1 | Only the most recent "before an update or data conversion" backup is kept beside the seven | AD-13 says "plus one"
8.1 | A missing second bucket makes the Cloudflare deployment fail with a message | Safer than starting with no backup area
8.2 | A backup of the working project is taken before the switch and kept as "before restore"; the switch does not happen if it fails | FR-34 requires a backup before destructive maintenance; makes a mistaken switch recoverable
8.2 | At most one unswitched restored copy per project; it stays until an administrator discards or replaces it (no timed deletion) | Bounds storage without inventing a retention period
8.2 | Saves from pages open before the switch are refused, shown as "not saved: project was restored", and not retried | Same pattern as shared decision 11 for access changes
8.2 | Older-format backups are converted in the copy; newer-format backups are refused | Follows AD-20 and NFR-7
8.3 | The deployment key is kept outside backups; recovery without it resets two-step verification for every account and clears stored settings secrets, logged | Secrets encrypted with the key cannot be read without it; accounts must stay usable
8.3 | Recovery cancels outstanding invitation and password-reset links as well as sessions and reviewer links | A link used after the recovery point would otherwise work again
8.3 | A project in the catalogue with no usable backup is listed as not recovered; a project backup with no catalogue entry is recovered with no members | Nothing is silently dropped or made reachable without an administrator's decision
8.3 | The recovery notice stays until an administrator dismisses it | PRD requires the notice but gives no duration
8.3 | "No live site passwords in backups" is tested as: no record shape has a field for one | Free-text notes cannot be policed; the review asked for a testable control
8.4 | A finished portable backup file is kept for download for 24 hours, then removed, and does not count against the project budget | PRD says backup storage is separate; a short conventional holding period
8.4 | One portable-backup job per project at a time | Same rule as 8.1
8.4 | A standard user who imports becomes the new project's Editor | FR-68: import "follows the same rule" as project creation
8.4 | Replacing a live project is refused when the backup's project identity differs from the live project's | Prevents replacing the wrong project; importing as new remains available
8.5 | A warning is shown when a project reaches 90% of the 8 GiB budget, in addition to the warning before an operation that would exceed a limit | PRD says "warn before exceeding"; 90% is a conventional threshold
8.5 | Space is reserved when an upload or job starts and released on failure | Stops two concurrent uploads jointly exceeding the budget
8.5 | Viewers as well as Editors see project usage on Records | Usage is read-only information; a Viewer can open the project
9.4 | A failed or malformed update check keeps the last good result and shows the failure time and reason | Avoids a false or stale update marker
9.4 | A release is offered only if its version is higher than the installed one | Never offers a downgrade (NFR-8)
9.5 | The signature is verified before users are warned | Avoids interrupting users for a release that will be refused; PRD order puts verification first
9.5 | Sign-in is not offered while changes are stopped; existing sessions stay valid | PRD stops "changes of every kind"; a sign-in writes a session and a log entry that a return would lose
9.5 | Update, Back up now and Restore are disabled while an update, backup or restore runs; a daily backup due during an update waits | One maintenance job at a time
9.5 | After an update an open page submits its pending edits; any the new version cannot accept stay listed as not saved and the page asks for a reload without reloading by itself | Keeps unsaved input visible, as FR-21 and NFR-2 require
9.6 | After power loss or a killed updater: accept changes again if installation had not begun, otherwise return to the earlier version and backup | Returning is the conservative choice once the image may have changed
9.6 | Going back after an update that passed its checks is a documented command-line procedure, not an interface control | AD-20 says going back means restoring the pre-update backup with the earlier version; no new control is invented
9.7 | 30 minutes without a result from the update run: ask GitHub to cancel it, clear the marker, accept changes again, log "no result" | The brief requires a stated limit; 30 minutes allows for a queued run and a full deploy
9.7 | The token and the existence of the release are checked before users are warned or changes stopped | Shared decision 8
9.7 | The workflow, not the Worker, verifies the signature | AD-21
9.7 | For a release that changes a Durable Object class, the manual procedure is shown in place of Update now | AD-21: it "is installed by the documented manual procedure"
10.1 | A change to the fixture after Kevin's confirmation makes a new manifest version and the affected runs are repeated | PRD forbids redefining the fixture after results
10.2/10.3 | The Cloudflare FR-66 and FR-72 Checks are placed in 10.3; the two-user conflict runs, independent arithmetic check and full-size recovery run in 10.2 | Shared decision 10 left the split open
8.1 | Archiving or un-archiving is refused while a backup or restore job for that project runs | Follow-up from Epic 6: an archive must not interleave with a backup or restore; matches 6.11's refusal while other jobs run
10.1 | The small functional project has about 50 devices and is built in 10.1, not by the 2.7 script | The addendum suggests about 50 assets; 2.7 generates only the acceptance-size project
