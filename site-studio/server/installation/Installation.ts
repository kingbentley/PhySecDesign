import type { Env } from "../env";
import { ObjectBase } from "../objects/ObjectBase";
import type { SetupState } from "../../shared/setup";
import {
  createFirstAdministratorInput,
  parseOperationInput,
  setupAttemptInput,
  SetupStore,
  type FirstAdministratorCreated,
  type SetupAttemptCounted,
} from "./setupStore";
import {
  completeSignInInput,
  cookiesInput,
  signInAttemptInput,
  SignInStore,
  type SessionEnded,
  type SessionInfo,
  type SignInAttemptCounted,
  type SignInCompleted,
} from "./signInStore";
import {
  acceptInvitationInput,
  createInvitationInput,
  invitationInfoInput,
  InvitationStore,
  type InvitationAccepted,
  type InvitationCreated,
  type InvitationInfo,
} from "./invitationStore";
import { deploymentKeyStateInput, KeyGuard, type DeploymentKeyState } from "./keyGuard";

// The installation object: one per installation, always named "installation" (AD-2). It holds
// users, sessions, invitations, the project catalogue, settings, tokens, the activity log and the
// job table as the stories add them. From story 1.2 it holds users, the installation's name and
// public address, and the set-up code's fingerprint and wrong-code counts; from story 1.3 its
// identifier, sessions, sign-in failure counts and tickets (signInStore.ts); from story 1.4 its
// invitations (invitationStore.ts); from story 1.5 the deployment key's fingerprint (keyGuard.ts).

export interface InstallationStatus {
  dataFormat: number;
  createdAt: string;
}

export class Installation extends ObjectBase<Env> {
  protected readonly objectKind = "installation";
  readonly setup: SetupStore;
  readonly signIn: SignInStore;
  readonly invitations: InvitationStore;
  /** The deployment-key guard (story 1.5): the key only ever arrives in an operation's input (D-22). */
  readonly keyGuard: KeyGuard;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.keyGuard = new KeyGuard(ctx.storage);
    this.setup = new SetupStore(ctx.storage);
    // After the set-up store, whose `users` and `settings` tables the sign-in store reads.
    this.signIn = new SignInStore(ctx.storage);
    // After both: invitations read users, settings and sessions, and start sessions (story 1.4).
    this.invitations = new InvitationStore(ctx.storage, this.signIn);

    this.ops.set("status", {
      run: (): InstallationStatus => {
        const meta = this.readMeta();
        return { dataFormat: meta.formatVersion, createdAt: meta.createdAt };
      },
    });

    // Whether set-up is open: the only fact the public set-up state route reveals (CA-52).
    this.ops.set("setupState", {
      run: (): { state: SetupState } => ({ state: this.setup.isOpen() ? "open" : "closed" }),
    });

    // Raises the wrong-code counts for one set-up attempt, before the Worker checks its code. The
    // fingerprint is the configured code's (see server/auth/setupCode.ts), never the entered code's.
    // Answers a one-time ticket, valid 5 minutes, that the create below requires.
    this.ops.set("setupAttempt", {
      run: (raw): SetupAttemptCounted => {
        const input = parseOperationInput(setupAttemptInput, raw);
        return this.setup.attempt(input.address, input.fingerprint, Date.now());
      },
    });

    // Creates the first administrator after the Worker accepted the code and hashed the password,
    // consuming the ticket from that request's counted attempt.
    // Synchronous from check to insert, so two requests at once leave one administrator.
    this.ops.set("createFirstAdministrator", {
      run: (raw): FirstAdministratorCreated => {
        const input = parseOperationInput(createFirstAdministratorInput, raw);
        return this.setup.createFirstAdministrator(input, Date.now());
      },
    });

    // Sign-in (story 1.3). Counts one attempt before the Worker checks its password, or refuses it
    // with a wait; answers the stored hash or a stand-in signal, the identifier and a ticket.
    // Not idempotent: a retry after a bare reset could count twice (V-16).
    this.ops.set("signInAttempt", {
      run: (raw): Promise<SignInAttemptCounted> => {
        const input = parseOperationInput(signInAttemptInput, raw);
        return this.signIn.attempt(input, Date.now());
      },
    });

    // Completes an attempt with the ticket and the Worker's outcome only (D-5 amended).
    this.ops.set("completeSignIn", {
      run: (raw): Promise<SignInCompleted> => {
        const input = parseOperationInput(completeSignInInput, raw);
        return this.signIn.complete(input.ticket, input.outcome, Date.now());
      },
    });

    // The public session read: writes nothing (D-4 amended), so it may be retried.
    this.ops.set("sessionInfo", {
      run: (raw): Promise<SessionInfo> => {
        const input = parseOperationInput(cookiesInput, raw);
        return this.signIn.sessionInfo(input.cookies, Date.now());
      },
    });

    // Ends the presented session; ending one already gone succeeds, so it may be retried (D-13, E-6).
    this.ops.set("endSession", {
      run: (raw): Promise<SessionEnded> => {
        const input = parseOperationInput(cookiesInput, raw);
        return this.signIn.endSession(input.cookies);
      },
    });

    // Invitations (story 1.4). Creates one for the presented session's administrator, checking the
    // inviter in the same step as the write (D-6); answers the secret once. A write: never retried
    // after a bare reset.
    this.ops.set("createInvitation", {
      run: (raw): Promise<InvitationCreated> => {
        const input = parseOperationInput(createInvitationInput, raw);
        return this.invitations.createInvitation(input, Date.now());
      },
    });

    // Reads a live invitation by its secret's hash: writes nothing, so it may be retried.
    this.ops.set("invitationInfo", {
      run: (raw): InvitationInfo => {
        const input = parseOperationInput(invitationInfoInput, raw);
        return this.invitations.invitationInfo(input.secretHash, Date.now());
      },
    });

    // Accepts an invitation after the Worker hashed the password: creates the account, consumes the
    // invitation and starts its session in one synchronous step (D-4). A write: never retried.
    this.ops.set("acceptInvitation", {
      run: (raw): Promise<InvitationAccepted> => {
        const input = parseOperationInput(acceptInvitationInput, raw);
        return this.invitations.acceptInvitation(input, Date.now());
      },
    });

    // The public key-state read (story 1.5, D-18 as ruled): whether a fingerprint is stored and
    // whether the key the Worker passed matches it. Writes nothing, so it may be retried.
    this.ops.set("deploymentKeyState", {
      run: (raw): Promise<DeploymentKeyState> => {
        const input = parseOperationInput(deploymentKeyStateInput, raw ?? {});
        return this.keyGuard.state(input.deploymentKey);
      },
    });
  }
}
