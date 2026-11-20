import type { Env } from "../env";
import { ObjectBase } from "../objects/ObjectBase";

// The installation object: one per installation, always named "installation" (AD-2). From story
// 1.2 it holds users, sessions, invitations, the project catalogue, settings, tokens, the
// activity log and the job table. In story 1.1 it answers only its status.

export interface InstallationStatus {
  dataFormat: number;
  createdAt: string;
}

export class Installation extends ObjectBase<Env> {
  protected readonly objectKind = "installation";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ops.set("status", {
      run: (): InstallationStatus => {
        const meta = this.readMeta();
        return { dataFormat: meta.formatVersion, createdAt: meta.createdAt };
      },
    });
  }
}
