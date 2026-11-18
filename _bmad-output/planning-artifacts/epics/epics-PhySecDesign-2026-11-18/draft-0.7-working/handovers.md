# Hand-overs between parts, draft 0.7 (old story numbers; suffixes are the split pieces)

## Split map so far
- 1.3 -> 1.3a sign in/out, R9; 1.3b invite and accept
- 1.7 -> 1.7a membership and access gate; 1.7b installation roles, deactivation, last administrator
- 1.8 -> 1.8a Administration area, users table; 1.8b reset links, two-step reset and require; 1.8c projects table and members; 1.8d locked-out administrator recovery command (Cloudflare)
- 1.10 -> 1.10a settings (installation, sign-in, maps); 1.10b require two-step for everyone; 1.10c email and forgotten password; 1.10d experiment R13

## From part A (Epic 1)
- 2.6 (B): must carry "an upload in progress keeps its session in use" and edge case 45 (parts kept on session end, resume after the same account signs in). Drop its duplicate maps-key visibility notice (1.10a has it); keep only delivery of the key.
- 2.13 (B): recovery command is story 1.8d; deployment key is story 1.4 with story 1.10a. The self-hosted smoke suite needs a named list of cases.
- 4.1 (C): add one test that a revision restore changes no installation record (accounts, sessions, invitations, members, settings, log).
- 9.7 and 9.1 (F): 1.2 and 1.4 state that a redeploy never regenerates the deployment key or set-up code and the key is printed once; reference, do not restate. 9.1 documents the recovery command and keeping the key off the account.
- 6.5 (E): bulk cleanup outcome belongs in the project change log, not the administrator activity log.
