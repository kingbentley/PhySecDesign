2.1 | First scope name is required and at most 80 characters | The authorities give no length; a bound is needed for the frame chip and lists
2.2 | The 2-second save acknowledgement is first measured on the locally run server (19 of 20 trials), then again on the fixture in 2.7 | The fixture does not exist before 2.7; the 19-of-20 rule is the PRD's
2.2 | Unsaved edits are retried automatically on reconnection; leaving the page with unsaved items shows the browser's leave warning | FR-21 says pending input is kept "while the page stays open"; the warning protects that
2.2 | Plan images stay in browser storage until 2.6 | Avoids saving large images through the small-operation route before the file store is used
2.3 | A hidden tab does not poll | AD-6 says polling runs "while the page is visible"
2.4 | An operation on several items is all-or-nothing when one item conflicts | AD-2 and AD-5: "apply every change or none"
2.5 | A floor is "unused" only if it holds no device, route, obstruction, zone or note (later: plan, survey entry, revision reference, removed device, riser) | FR-60 says eligibility comes from content, not an empty visible plan
2.5 | The last floor and the last building of a project cannot be deleted | Conservative; a project with no floor has nowhere to work and the PRD does not describe one
2.6 | Supported plan types are PDF, PNG, JPEG and WebP | What the prototype accepts today
2.6 | Limits are 100 MiB per PDF and 25 MiB per image | PRD file acceptance table (the prototype's 50 MB PDF limit is replaced)
2.6 | An unfinished upload is discarded after 7 days | Matches R2's behaviour found in experiment R6, so both hosts agree
2.6 | A completed file that no record references is removed by a daily clean-up once 24 hours old | Review edge case 20; 24 hours leaves time for a retry of the referencing save
2.6 | Google mapping key is delivered to signed-in users only, to all projects, and Settings says it is browser-visible | Review finding 12; a Maps JavaScript key must reach the browser
2.7 | An Editor can set Proposed or Existing by hand, as the prototype's status field does; Removed cannot be chosen | Keeps the prototype's ability to record existing equipment until 6.1; removal is 6.8
2.7 | A device once saved as Existing keeps a "recorded as existing" mark | FR-55 judges Delete draft from origin and history, not the current flag
2.7 | Basis rule before Epic 6: Current installation = Existing devices; Proposed design = Existing and Proposed | PRD state model, without planned actions, which arrive in 6.6
2.7 | Fixture: 10 buildings, 25 plans, 600 devices, 150 cameras, 60 on the busiest plan, 20 targeted zones there, fixed seed, loaded through the server's own operations | PRD acceptance profile; 20 zones is the R2 experiment's workload
2.7 | All timing targets of the PRD table except analysis are measured here on the locally run server, 19 of 20 trials | Review finding 10; they cannot sit in 2.1, 2.2 or 2.5 because the fixture arrives in 2.7
2.8 | Target met needs the lower bound (edge cells counted as not qualifying) to reach the target; Shortfall needs the upper bound to miss it; otherwise refine once at half spacing, then show Uncertain near target with both figures | FR-15 and the addendum require "refine or flag"; bounding by edge cells is the conservative conventional method
2.8 | Not demonstrated is shown when the target is not met and a camera in range of the zone was left out of the calculation | FR-15; the only unassessed views before story 7.1 are cameras excluded for plane, settings or disabled state
2.8 | Time allowance for one calculation is 10 seconds | The PRD's target for the busiest plan
2.8 | All cameras excluded gives Not assessed, not 100% unseen | FR-13 Check
2.9 | A route with an unassigned end stays in cable totals and is listed for review | FR-55: keep cable records and mark unassigned ends; nothing silently dropped
2.10 | Photo types JPEG, PNG and WebP; 25 MiB limit | Prototype's accepted types; PRD limit
2.11 | Undo and redo cover the last 40 edits made in the open page; reload or sign-out clears them | 40 is the prototype's limit; FR-55 says no cross-session undo is required
2.11 | A new edit after an undo clears the redo list | Conventional
2.11 | Delete draft with no confirmation only for a proposed device with no survey entry, no route and never recorded as Existing; with routes, a preview and confirmation | FR-55: isolated draft immediate; connected draft previews
2.11 | In the preview a route may be deleted with the device only if selected, has no survey entry and has no other assigned end | FR-55 "dedicated disposable draft cable only when explicitly selected and independently eligible"
2.11 | A floor whose only devices are deleted drafts counts as unused; undo of the draft deletion is then refused | FR-55 "do not recreate deleted floors"
2.12 | Prototype project file limit 100 MiB | The prototype's own limit for these files
2.12 | Until 4.1 and 4.4, costs and named revisions in the file are listed as "not imported" | Cross-epic move; keeps "nothing dropped silently" true meanwhile
2.12 | Imported notes carry "from the prototype file" and the import date, with no author | The old file holds no author; FR-69 forbids inventing one
2.12 | Importing the same file twice makes two projects | No identity in the old file is trusted for de-duplication
2.13 | Bundled web server gets and renews its certificate automatically for the host name, or uses operator-supplied certificate files | Architecture leaves the certificate method open; these two cover public and private servers
2.13 | Plain HTTP is redirected by the bundled web server and refused by the application itself | FR-66 Check allows either; refusing at the application protects operators' own proxies
2.13 | Trusted-proxy list defaults to the bundled web server only; forwarded headers from other addresses are ignored; application port not published by default | Conservative default so headers cannot be forged
2.13 | Smoke suite in 2.13 excludes file cases; 2.14 adds them | Dependency rule: the disk file store is 2.14
2.14 | Backup location is a separate Compose setting with no default; server refuses to start if it is the same folder as the live files or is left unset (8.1 adds the same-disk warning) | Review finding 25: backups must not land in the live folder
2.14 | A stored file whose size or hash no longer matches is reported as damaged on request | AD-16 gives the disk store a stored hash and size; this is their use
2.15 | 50 forced kills | Experiment R8 used 45; rounded up
2.15 | At least 20 power cuts on the virtual-machine disk; network disk tested on NFS | R12 names the disks but no count; 20 matches the PRD's trial size
2.15 | A second container on a volume in use refuses to start | R12 covers "durability and locking"; conservative handling
2.15 | Storage-full notice is shown to administrators in Administration | Review edge case 23; Administration is the only administrator surface that exists by Epic 2
3.1 | Before Epic 5 the Installation view exists as a switch that only sets the default basis | UX 5.3; recording tools do not exist yet
3.1 | Materials and Capacity dialogs become the Costs and capacity page, Revisions and Review the Records page; Equipment is left to 3.5 | Review finding 28: one owner per conversion
3.2 | A development-only status reference page is the place of test for values no feature uses yet | Makes "one component renders each family" observable
3.3 | Phone-width form fields are 16 px, tested at 390 px | UX section 10 and audit finding A6, which the story's Covers line already listed
3.4 | The analysis strip is checked at 1440 × 900 and 1280 × 720 | 1440 × 900 is the audit size; 1280 × 720 is a common smaller laptop size
3.5 | Deleted drafts are not listed under Historical | PRD FR-8 and FR-55 (no recycle-bin view) over UX section 6, which lists "Deleted draft" there; Kevin to confirm
3.5 | Schedule CSV holds the rows and columns shown and names project, basis and export time | Review finding 21 and NFR-6
2.7 | The fixture script also makes the small functional project and can add plan files up to 8 GiB | Asked for by Epics 8 to 10 so that backup and limit tests have full-size data
2.13 | Self-hosted deployment key is generated on first start into a key file in its own Compose-set folder, apart from records and files | Epic 1 encrypts with a deployment key; 8.3 keeps it outside backups; generating it avoids a weak operator-chosen key
2.13 | Self-hosted administrator recovery is a command run on the server, with the same one-time code rules as 1.8 (once, 1 hour) | Mirrors Epic 1's Cloudflare command; the command itself is a review safeguard not in the PRD, for Kevin to confirm
2.13 | "Two installations share no files" is shown in 2.14, users and projects in 2.13 | The disk file store does not exist until 2.14
