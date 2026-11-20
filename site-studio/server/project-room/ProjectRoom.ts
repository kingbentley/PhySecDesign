import type { Env } from "../env";
import { ObjectBase } from "../objects/ObjectBase";

// The project room: one per project (AD-2). Operations, the change log and snapshots arrive in
// Epic 2. In story 1.1 it carries only the shared base: format version, version guard and alarm.

export class ProjectRoom extends ObjectBase<Env> {
  protected readonly objectKind = "project-room";
}
