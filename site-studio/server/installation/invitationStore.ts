import { z } from "zod";
import { INVITATION_TTL_MS, inviteInput, type InvitationRole } from "../../shared/invitation";
import { normaliseEmail, personNameField } from "../../shared/setup";
import { newMarkerId } from "../auth/marker";
import { sha256Hex, TOKEN_HASH_PATTERN, toBase64Url } from "../auth/session";
import { OperationRefusal } from "../objects/ObjectBase";
import { insertUser, passwordHashInput, SETTINGS_TABLE, USERS_TABLE } from "./setupStore";
import { cookiesField, type AccountRole, type SignInStore } from "./signInStore";

// Invitation storage in the installation object (story 1.4, spec 1). The table is created if
// absent under data format 1 (standing rule 8).
//
// - A row holds the secret's SHA-256 (64 hex digits), never the secret (CA-55, standing rule 14),
//   the invited email (unique: at most one invitation per email), the suggested name, the role,
//   the inviter's account id, the issue time and an indexed expiry, 7 days after the issue (CA-09).
// - Creating an invitation identifies the inviter from this installation's session cookie as the
//   session read does, in the same synchronous step as the write: no live session (an inactive
//   account's session is none) is `not_signed_in`, a live session of a standard account is
//   `administrator_only` (D-6). An email any account has is `invitation_email_taken`. Any earlier
//   row for the email, live or expired, is deleted before the new one is inserted, in the same
//   transaction (CA-10), so the earlier link stops working at once. The secret, 32 random bytes as
//   base64url, is made here and answered once.
// - The read takes the secret's hash and writes nothing; it answers the inviter's current name
//   (D-10), the installation's name, the email, the suggested name and the role.
// - Accepting takes the secret's hash, the person's name, the Worker's password hash and the
//   presented cookies. One synchronous transaction checks the invitation is live and its email
//   still free, inserts the account with the invitation's email and role, deletes the invitation
//   (D-3: nothing is kept after use), ends the presented session and stores the new one (D-4).
// - A used, replaced, expired or unknown hash is `invitation_unusable`, one refusal for all (D-3).
// - Expired rows are deleted at most INVITATION_PRUNE_BATCH per call, by a successful create or
//   accept only; the read never prunes. A refused call writes nothing: its transaction is undone.
//
// The Worker computes the secret's hash (`invitationSecretHash`) from the request body, so the
// object receives the secret only when it makes it.

export const INVITATIONS_TABLE = "invitations";
/** The most expired invitation rows one create or accept deletes. */
export const INVITATION_PRUNE_BATCH = 20;
const SECRET_BYTES = 32;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${INVITATIONS_TABLE} (
     secret_hash TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('administrator', 'standard')),
     inviter_id TEXT NOT NULL,
     issued_at INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS invitations_expires_at ON ${INVITATIONS_TABLE} (expires_at)`,
];

/** The secret's hash as the Worker passes it: SHA-256, 64 lower-case hex digits. */
export const secretHashField = z.string().regex(TOKEN_HASH_PATTERN);

export const createInvitationInput = inviteInput.extend({ cookies: cookiesField }).strict();
export const invitationInfoInput = z.object({ secretHash: secretHashField }).strict();
export const acceptInvitationInput = z
  .object({
    secretHash: secretHashField,
    name: personNameField,
    passwordHash: passwordHashInput,
    cookies: cookiesField,
  })
  .strict();

export type CreateInvitationInput = z.input<typeof createInvitationInput>;
export type AcceptInvitationInput = z.input<typeof acceptInvitationInput>;

/** What creating an invitation answers the Worker, which builds the link from it (D-1). */
export interface InvitationCreated {
  /** 43 base64url characters. Answered once; only its hash is kept. Never logged. */
  secret: string;
  /** UTC, ISO 8601: 7 days after the issue. */
  expiresAt: string;
  /** The installation's recorded public address (CA-57), never a request header. */
  publicAddress: string;
}

/** What the invitation read answers (D-10). */
export interface InvitationInfo {
  /** The inviter's current name. */
  inviterName: string;
  installationName: string;
  email: string;
  /** The name the administrator entered, for the page to prefill (D-7). */
  name: string;
  role: InvitationRole;
}

/** What accepting answers the Worker, which sets the two cookies from it (D-4). */
export interface InvitationAccepted {
  identifier: string;
  /** Goes only into the `Set-Cookie` line; never logged. */
  sessionToken: string;
  /** The marker for the new account, with a fresh marker id. */
  marker: string;
  account: { id: string; name: string; role: AccountRole };
  /** UTC, ISO 8601. */
  signedInAt: string;
}

/** The secret's SHA-256 as stored and as the Worker passes it: 64 lower-case hex digits. */
export function invitationSecretHash(secret: string): Promise<string> {
  return sha256Hex(secret);
}

/** A new secret: 32 random bytes, base64url without padding (43 characters). */
function newInvitationSecret(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
}

interface InvitationRow {
  email: string;
  name: string;
  role: string;
  inviter_id: string;
}

export class InvitationStore {
  constructor(
    private readonly storage: DurableObjectStorage,
    private readonly signIn: SignInStore,
  ) {
    for (const statement of SCHEMA) storage.sql.exec(statement);
  }

  private get sql(): SqlStorage {
    return this.storage.sql;
  }

  /** Deletes expired invitations, at most INVITATION_PRUNE_BATCH, oldest expiry first. */
  private prune(now: number): void {
    this.sql.exec(
      `DELETE FROM ${INVITATIONS_TABLE} WHERE rowid IN
         (SELECT rowid FROM ${INVITATIONS_TABLE} WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`,
      now,
      INVITATION_PRUNE_BATCH,
    );
  }

  private emailHasAccount(email: string): boolean {
    return this.sql.exec(`SELECT 1 FROM ${USERS_TABLE} WHERE email = ? LIMIT 1`, email).toArray().length > 0;
  }

  private liveInvitation(secretHash: string, now: number): InvitationRow | null {
    return (
      this.sql
        .exec<{ email: string; name: string; role: string; inviter_id: string }>(
          `SELECT email, name, role, inviter_id FROM ${INVITATIONS_TABLE} WHERE secret_hash = ? AND expires_at > ?`,
          secretHash,
          now,
        )
        .toArray()[0] ?? null
    );
  }

  private settings(): { installationName: string; publicAddress: string } | null {
    const row = this.sql
      .exec<{ installation_name: string; public_address: string }>(`SELECT installation_name, public_address FROM ${SETTINGS_TABLE} WHERE id = 1`)
      .toArray()[0];
    return row ? { installationName: row.installation_name, publicAddress: row.public_address } : null;
  }

  /**
   * Creates an invitation for a signed-in administrator, replacing any earlier one for the email,
   * and answers its secret once with the expiry and the public address. Refuses `not_signed_in`,
   * `administrator_only` or `invitation_email_taken` (field `email`), writing nothing.
   */
  async createInvitation(input: z.output<typeof createInvitationInput>, now: number): Promise<InvitationCreated> {
    // Cryptography that needs no storage first.
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const secret = newInvitationSecret();
    const secretHash = await invitationSecretHash(secret);
    const email = normaliseEmail(input.email);

    // From here to the return there is no await: the inviter's check and the write are one step.
    return this.storage.transactionSync(() => {
      const inviter = this.signIn.liveSessionAccount(tokenHash, now);
      if (!inviter) throw new OperationRefusal("not_signed_in");
      if (inviter.role !== "administrator") throw new OperationRefusal("administrator_only");
      if (this.emailHasAccount(email)) throw new OperationRefusal("invitation_email_taken", "email");
      const settings = this.settings();
      if (!settings) throw new Error("The installation has an account but no settings row.");
      const expiresAt = now + INVITATION_TTL_MS;
      this.sql.exec(`DELETE FROM ${INVITATIONS_TABLE} WHERE email = ?`, email);
      this.sql.exec(
        `INSERT INTO ${INVITATIONS_TABLE} (secret_hash, email, name, role, inviter_id, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        secretHash,
        email,
        input.name,
        input.role,
        inviter.id,
        now,
        expiresAt,
      );
      this.prune(now);
      return { secret, expiresAt: new Date(expiresAt).toISOString(), publicAddress: settings.publicAddress };
    });
  }

  /** Reads a live invitation by its secret's hash, writing nothing; refuses `invitation_unusable`. */
  invitationInfo(secretHash: string, now: number): InvitationInfo {
    const row = this.liveInvitation(secretHash, now);
    if (!row) throw new OperationRefusal("invitation_unusable");
    const inviter = this.sql.exec<{ name: string }>(`SELECT name FROM ${USERS_TABLE} WHERE id = ?`, row.inviter_id).toArray()[0];
    const settings = this.settings();
    // Accounts are never deleted, so an invitation's inviter and the settings row always exist.
    if (!inviter || !settings) throw new Error("A live invitation has no inviter or no settings row.");
    return {
      inviterName: inviter.name,
      installationName: settings.installationName,
      email: row.email,
      name: row.name,
      role: row.role as InvitationRole,
    };
  }

  /**
   * Accepts a live invitation: creates the account with the invitation's email and role and the
   * given name and password hash, consumes the invitation, ends the presented session and starts a
   * new one, all in one synchronous transaction. Refuses `invitation_unusable` or
   * `invitation_email_taken` (field `email`), writing nothing.
   */
  async acceptInvitation(input: z.output<typeof acceptInvitationInput>, now: number): Promise<InvitationAccepted> {
    const { tokenHash: presentedHash } = await this.signIn.presentedSession(input.cookies);
    const session = await this.signIn.prepareSession();
    const markerId = newMarkerId();

    // From here to the end of the write there is no await, so of two accepts at once only the
    // first finds the invitation.
    const account = this.storage.transactionSync(() => {
      const invitation = this.liveInvitation(input.secretHash, now);
      if (!invitation) throw new OperationRefusal("invitation_unusable");
      if (this.emailHasAccount(invitation.email)) throw new OperationRefusal("invitation_email_taken", "email");
      const role = invitation.role as AccountRole;
      const userId = insertUser(this.sql, { email: invitation.email, name: input.name, role, passwordHash: input.passwordHash }, now);
      this.sql.exec(`DELETE FROM ${INVITATIONS_TABLE} WHERE secret_hash = ?`, input.secretHash);
      this.signIn.writeSession(userId, presentedHash, session.tokenHash, now);
      this.prune(now);
      return { id: userId, name: input.name, role };
    });

    return {
      identifier: session.identifier,
      sessionToken: session.sessionToken,
      marker: await this.signIn.sessionMarker(session, account.id, markerId, now),
      account,
      signedInAt: new Date(now).toISOString(),
    };
  }
}
