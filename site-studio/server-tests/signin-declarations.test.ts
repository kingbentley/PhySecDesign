import { describe, expect, it } from "vitest";
import { API_PREFIX, ROUTE_LIST, ROUTES, type RouteDeclaration } from "../shared/routes";
import { requestContext } from "../server/api/router";
import { markerCookieName } from "../server/auth/marker";
import { sessionCookieName } from "../server/auth/session";

// The declaration sweep (story 1.3, CAP-9, V-12): every route that reads the session cookie and is
// not a GET must be `appOriginOnly`, so another site cannot drive a change made with a person's
// cookie. Only routes declared as reading the session cookie are given it.

/** The routes that break the rule: non-GET, reading the session cookie, without the origin rule. */
function unguarded(routes: readonly RouteDeclaration[]): string[] {
  return routes.filter((route) => route.readsSessionCookie && route.method !== "GET" && route.appOriginOnly !== true).map((route) => route.id);
}

describe("the route declarations", () => {
  it("make every non-GET route that reads the session cookie appOriginOnly", () => {
    expect(unguarded(ROUTE_LIST)).toEqual([]);
  });

  it("would catch a route that broke the rule", () => {
    const broken = { ...ROUTES.signOut, id: "brokenSignOut", appOriginOnly: undefined } as RouteDeclaration;
    expect(unguarded([...ROUTE_LIST, broken])).toEqual(["brokenSignOut"]);
  });

  it("declare the three sign-in routes under /api/v1/ with the flag; the session read is the only GET among them", () => {
    const flagged = ROUTE_LIST.filter((route) => route.readsSessionCookie);
    expect(flagged.map((route) => [route.id, route.method]).sort()).toEqual([
      ["session", "GET"],
      ["signIn", "POST"],
      ["signOut", "POST"],
    ]);
    for (const route of flagged) expect(route.path.startsWith(API_PREFIX)).toBe(true);
    expect(ROUTES.signIn.appOriginOnly).toBe(true);
    expect(ROUTES.signOut.appOriginOnly).toBe(true);
  });
});

describe("the request context", () => {
  const identifier = "a".repeat(32);
  const header = [
    `${sessionCookieName(identifier)}=session-value`,
    `${markerCookieName(identifier)}=marker-value`,
    "unrelated=1",
    `${sessionCookieName("b".repeat(32))}=other-installation`,
  ].join("; ");
  const request = new Request("https://survey.acme.test/api/v1/session", { headers: { cookie: header } });
  const url = new URL(request.url);

  it("passes every cookie with the session prefix to a route that reads the session cookie, and nothing else", () => {
    expect(requestContext(request, url, ROUTES.session).cookies).toEqual({
      [sessionCookieName(identifier)]: "session-value",
      [markerCookieName(identifier)]: "marker-value",
      [sessionCookieName("b".repeat(32))]: "other-installation",
    });
  });

  it("passes no cookies to a route that is not declared as reading them", () => {
    for (const route of ROUTE_LIST.filter((candidate) => !candidate.readsSessionCookie)) {
      expect(requestContext(request, url, route).cookies, route.id).toEqual({});
    }
  });
});
