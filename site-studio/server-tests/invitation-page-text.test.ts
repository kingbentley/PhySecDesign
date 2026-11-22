import { describe, expect, it } from "vitest";
import { INVITATION_MESSAGES, readInvitation, submitAccept, submitInvite } from "../src/admin/invitationClient.js";
import {
  ACCEPT_FIELD_MESSAGES,
  checkAcceptFields,
  checkInviteFields,
  expirySentence,
  expiryWording,
  invitedAsLine,
  ruleItems,
  signedInNotice,
} from "../src/admin/invitationRules.js";

// The invite panel's and the invitation page's text and checks (story 1.4, CAP-1, CAP-4, D-4,
// D-11; review findings 8, 20, 24 and 28), and the requests the client sends, with a stub fetcher
// in place of the server. The page modules import shared/, so they are tested here, as
// setup-client.test.ts does. The flows run in browser-tests/invitation.spec.mjs.

const EMAIL = "sam.rivera@harbourside.example";
const SECRET = "A".repeat(43);

const states = (password: string, email = EMAIL) =>
  ruleItems(password, email).map((rule: { id: string; met: boolean; state: string; label: string }) => [rule.id, rule.met, rule.state]);

describe("the password rule list", () => {
  it("lists story 1.2's two rules with D-11's labels", () => {
    expect(ruleItems("", EMAIL).map((rule: { label: string }) => rule.label)).toEqual(["12 to 128 characters", "Not the same as your email"]);
  });

  it("shows both rules as not yet met for an empty password (review finding 28)", () => {
    expect(states("")).toEqual([["length", false, "Not yet met"], ["notEmail", false, "Not yet met"]]);
  });

  it("turns the length rule met at 12 characters and the email rule not met at the email", () => {
    expect(EMAIL.length).toBeGreaterThanOrEqual(12);
    expect(states("abcde")).toEqual([["length", false, "Not yet met"], ["notEmail", true, "Met"]]);
    expect(states("abcdefghijkl")).toEqual([["length", true, "Met"], ["notEmail", true, "Met"]]);
    expect(states(EMAIL)).toEqual([["length", true, "Met"], ["notEmail", false, "Not yet met"]]);
    // Ignoring case, as the server compares (story 1.2's D-9).
    expect(states(EMAIL.toUpperCase())).toEqual([["length", true, "Met"], ["notEmail", false, "Not yet met"]]);
    expect(states("x".repeat(129))[0]).toEqual(["length", false, "Not yet met"]);
  });
});

describe("the invitation page's checks", () => {
  const valid = { name: "Sam Rivera", password: "a long and good passphrase", passwordAgain: "a long and good passphrase" };

  it("passes matching passwords that meet both rules", () => {
    expect(checkAcceptFields(valid, EMAIL)).toEqual({});
  });

  it("refuses a password breaking a rule, differing passwords and an empty name, without repeating them", () => {
    expect(checkAcceptFields({ ...valid, password: "short", passwordAgain: "short" }, EMAIL)).toEqual({ password: ACCEPT_FIELD_MESSAGES.password });
    expect(checkAcceptFields({ ...valid, password: EMAIL, passwordAgain: EMAIL }, EMAIL)).toEqual({ password: ACCEPT_FIELD_MESSAGES.passwordIsEmail });
    expect(checkAcceptFields({ ...valid, passwordAgain: "something else entirely" }, EMAIL)).toEqual({ passwordAgain: "The two passwords do not match." });
    const errors = checkAcceptFields({ ...valid, name: "" }, EMAIL);
    expect(Object.keys(errors)).toEqual(["name"]);
    for (const message of Object.values(ACCEPT_FIELD_MESSAGES)) expect(message).not.toContain(valid.password);
  });
});

describe("the invite panel's checks", () => {
  it("uses inviteInput: a bad email, an empty name and an unknown role are named", () => {
    expect(checkInviteFields({ email: "sam@harbourside.example", name: "Sam", role: "standard" }).errors).toEqual({});
    expect(Object.keys(checkInviteFields({ email: "not an email", name: "", role: "owner" }).errors).sort()).toEqual(["email", "name", "role"]);
  });
});

describe("the page's and panel's wording (D-4, D-11)", () => {
  it("states the expiry as local date and time, as 28 November 2026, 22:00 (review finding 24)", () => {
    expect(expiryWording("2026-11-28T22:00:00.000Z", "UTC")).toBe("28 November 2026, 22:00");
    expect(expiryWording("2026-11-28T22:00:00.000Z", "Europe/Paris")).toBe("28 November 2026, 23:00");
    expect(expiryWording("2026-11-28T08:05:00.000Z", "UTC")).toBe("28 November 2026, 08:05");
    expect(expirySentence("2026-11-28T22:00:00.000Z", "UTC")).toBe(
      "This link works once and expires on 28 November 2026, 22:00. Anyone who has it can create this account, so pass it on privately.",
    );
  });

  it("says who invited the person and as what, and when the browser is signed in already", () => {
    expect(invitedAsLine("Robin Example", "standard")).toBe("Robin Example invited you as a standard user.");
    expect(invitedAsLine("Robin Example", "administrator")).toBe("Robin Example invited you as an administrator.");
    expect(signedInNotice("Robin Example")).toBe("You are signed in as Robin Example. Setting this password signs you out.");
    expect(INVITATION_MESSAGES.reopen).toBe("Open the invitation link again to continue.");
  });
});

type Sent = { url: string; init: RequestInit };

function stub(status: number, body: unknown) {
  const sent: Sent[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    sent.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fetcher, sent };
}

const never = ((_url: string, init: RequestInit) =>
  new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as unknown as typeof fetch;
const unreachable = (async () => { throw new TypeError("network"); }) as unknown as typeof fetch;

describe("the client's requests", () => {
  it("sends the secret only in a JSON body, with the app's header, never in the address (D-1)", async () => {
    const { fetcher, sent } = stub(200, { inviterName: "R", installationName: "H", email: EMAIL, name: "Sam", role: "standard" });
    expect((await readInvitation(SECRET, fetcher)).kind).toBe("invitation");
    const accept = stub(200, { name: "Sam" });
    expect(await submitAccept({ secret: SECRET, name: "Sam", password: "a long and good passphrase" }, accept.fetcher)).toEqual({ kind: "accepted", name: "Sam" });
    for (const [request, url] of [[sent[0]!, "/api/v1/invitations/read"], [accept.sent[0]!, "/api/v1/invitations/accept"]] as const) {
      expect(request.url).toBe(url);
      expect(request.init.method).toBe("POST");
      expect((request.init.headers as Record<string, string>)["x-site-survey-design"]).toBe("1");
      expect(JSON.parse(String(request.init.body)).secret).toBe(SECRET);
    }
  });

  it("sends the invite to its route with the app's header", async () => {
    const { fetcher, sent } = stub(200, { link: `https://h.example/invite#${SECRET}`, expiresAt: "2026-11-28T22:00:00.000Z" });
    expect((await submitInvite({ email: EMAIL, name: "Sam", role: "standard" }, fetcher)).kind).toBe("invited");
    expect(sent[0]!.url).toBe("/api/v1/invitations");
    expect((sent[0]!.init.headers as Record<string, string>)["x-site-survey-design"]).toBe("1");
  });

  it("treats no answer and a timeout as their failures: network, cannot be checked, may not have been set", async () => {
    const input = { email: EMAIL, name: "Sam", role: "standard" };
    expect(await submitInvite(input, unreachable)).toEqual({ kind: "refused", message: INVITATION_MESSAGES.network });
    expect(await submitInvite(input, never, { timeoutMs: 20 })).toEqual({ kind: "refused", message: INVITATION_MESSAGES.network });
    expect(await readInvitation(SECRET, unreachable)).toEqual({ kind: "unknown" });
    expect(await readInvitation(SECRET, never, { timeoutMs: 20 })).toEqual({ kind: "unknown" });
    const accept = { secret: SECRET, name: "Sam", password: "a long and good passphrase" };
    expect(await submitAccept(accept, unreachable)).toEqual({ kind: "failed" });
    expect(await submitAccept(accept, never, { timeoutMs: 20 })).toEqual({ kind: "failed" });
  });

  it("gives the no-answer outcome when loading the app's header stalls, and starts no request after the deadline (pull request 12, review round 1)", async () => {
    const input = { email: EMAIL, name: "Sam", role: "standard" };
    const accept = { secret: SECRET, name: "Sam", password: "a long and good passphrase" };
    const headers = { "content-type": "application/json", accept: "application/json", "x-site-survey-design": "1" };
    let requests = 0;
    const sentHeaders: unknown[] = [];
    const counted = (async (_url: string, init: RequestInit) => {
      requests += 1;
      sentHeaders.push(init.headers);
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;
    // A header load that never finishes.
    const stalled = () => new Promise<typeof headers>(() => {});
    expect(await submitInvite(input, counted, { timeoutMs: 20, loadHeaders: stalled })).toEqual({ kind: "refused", message: INVITATION_MESSAGES.network });
    expect(await readInvitation(SECRET, counted, { timeoutMs: 20, loadHeaders: stalled })).toEqual({ kind: "unknown" });
    expect(await submitAccept(accept, counted, { timeoutMs: 20, loadHeaders: stalled })).toEqual({ kind: "failed" });
    // A header load that finishes only after the deadline: the outcome is still no answer, and
    // the request is never started, then or later.
    const late: Promise<void>[] = [];
    const slow = () => {
      const loaded = new Promise<typeof headers>((resolve) => setTimeout(() => resolve(headers), 60));
      late.push(loaded.then(() => new Promise((resolve) => setTimeout(resolve, 10))));
      return loaded;
    };
    expect(await submitInvite(input, counted, { timeoutMs: 20, loadHeaders: slow })).toEqual({ kind: "refused", message: INVITATION_MESSAGES.network });
    expect(await readInvitation(SECRET, counted, { timeoutMs: 20, loadHeaders: slow })).toEqual({ kind: "unknown" });
    expect(await submitAccept(accept, counted, { timeoutMs: 20, loadHeaders: slow })).toEqual({ kind: "failed" });
    await Promise.all(late);
    expect(requests).toBe(0);
    // A header load that fails gives the no-answer outcome at once, with no request.
    const failing = () => Promise.reject(new Error("chunk failed")) as Promise<typeof headers>;
    expect(await submitInvite(input, counted, { timeoutMs: 60_000, loadHeaders: failing })).toEqual({ kind: "refused", message: INVITATION_MESSAGES.network });
    expect(await submitAccept(accept, counted, { timeoutMs: 60_000, loadHeaders: failing })).toEqual({ kind: "failed" });
    expect(requests).toBe(0);
    // A header load within the deadline sends each request as before, with the loaded headers.
    const prompt = async () => headers;
    await submitInvite(input, counted, { timeoutMs: 1000, loadHeaders: prompt });
    await readInvitation(SECRET, counted, { timeoutMs: 1000, loadHeaders: prompt });
    await submitAccept(accept, counted, { timeoutMs: 1000, loadHeaders: prompt });
    expect(requests).toBe(3);
    expect(sentHeaders).toEqual([headers, headers, headers]);
  });
});
