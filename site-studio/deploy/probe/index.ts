import { hashPassword, verifyPassword } from "../../server/auth/password";
import { FIXTURE_PASSWORD, FIXTURE_WRONG_PASSWORD, PASSWORD_FIXTURE } from "./password-fixture";

// The password probe's Worker (story 1.3, D-6, CAP-13). Two addresses:
// - GET /make hashes the fixture's known password with the production parameters, through the
//   app's own `hashPassword`, and answers the hash. Used once, under the self-hosted runtime, to
//   make the committed fixture.
// - GET /verify checks the committed fixture's password, and a wrong password, against the
//   committed hash through the app's own `verifyPassword`, and answers both results.
// The known password is test data, published in the fixture file; no real password is involved.

export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/make") return Response.json({ hash: await hashPassword(FIXTURE_PASSWORD) });
    if (path === "/verify") {
      if (!PASSWORD_FIXTURE.hash) return Response.json({ error: "no fixture yet" }, { status: 500 });
      const fixture = await verifyPassword(FIXTURE_PASSWORD, PASSWORD_FIXTURE.hash);
      const wrongPassword = await verifyPassword(FIXTURE_WRONG_PASSWORD, PASSWORD_FIXTURE.hash);
      return Response.json({ fixture, wrongPassword, runtime: navigator.userAgent });
    }
    return new Response("not found", { status: 404 });
  },
};
