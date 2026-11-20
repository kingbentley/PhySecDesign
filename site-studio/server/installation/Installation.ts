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

// The installation object: one per installation, always named "installation" (AD-2). It holds
// users, sessions, invitations, the project catalogue, settings, tokens, the activity log and the
// job table as the stories add them. From story 1.2 it holds users, the installation's name and
// public address, and the set-up code's fingerprint and wrong-code counts.

export interface InstallationStatus {
  dataFormat: number;
  createdAt: string;
}

export class Installation extends ObjectBase<Env> {
  protected readonly objectKind = "installation";
  readonly setup: SetupStore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.setup = new SetupStore(ctx.storage);

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
  }
}
