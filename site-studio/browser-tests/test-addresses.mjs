// The network address a browser test's requests are counted under (story 1.5's follow-up before its
// pull request). Kept out of any *.spec.mjs file, which Playwright would register as tests.
//
// The local runtime (Miniflare) sets `CF-Connecting-IP` to the client's address, 127.0.0.1, on a
// request that has none (node_modules/miniflare/dist/src/workers/core/entry.worker.js, miniflare
// 5.20261116.0-beta under wrangler 4.164.0). So every request without its own header is counted
// under one known address: with the sign-in limit of 20 failures over 15 minutes (shared/signin.ts)
// on the sign-in servers, and the set-up code's limit of 5 (server/installation/setupStore.ts) on
// the set-up server, and the failures of every spec file on a server add up. A test that produces
// failures (a wrong password, a wrong code, a sign-in left at its second step) sends its own
// address instead, so no file depends on how many failures the others leave. The server counts an
// IPv6 address by its /64 prefix (server/api/clientAddress.ts), so the first four groups hold
// everything that makes the address distinct: the spec file, the repeat under `--repeat-each`, and
// the test's line in its file. The project is left out: each project has its own servers
// (playwright.config.mjs). `second-step.spec.mjs` keeps its own IPv4 `addressFor` (10.0.0.0/8),
// which this cannot overlap. The tests that exercise a per-address limit on purpose keep their own
// fixed addresses (192.0.2.0/24); they, and the email lock in signin.spec.mjs's marker test, are
// not made safe for `--repeat-each`. A file listed below without a failure-producing test today
// (invitation.spec.mjs) keeps its number, so the scheme does not shift when one is added.
import { basename } from "node:path";

const FILES = {
  "invitation.spec.mjs": 1,
  "setup.spec.mjs": 2,
  "signin.spec.mjs": 3,
  "two-step.spec.mjs": 4,
};

/** This test's own address: `fd00:<file>:<repeat>:<line>::1`, distinct per file, test and repeat. */
export function addressFor(testInfo) {
  const file = FILES[basename(testInfo.file)];
  if (!file) throw new Error(`No address scheme for ${basename(testInfo.file)}: add it to test-addresses.mjs.`);
  return `fd00:${file.toString(16)}:${testInfo.repeatEachIndex.toString(16)}:${testInfo.line.toString(16)}::1`;
}

/** Makes every request the page sends count under this test's own address. */
export async function useOwnAddress(page, testInfo) {
  await page.setExtraHTTPHeaders({ "CF-Connecting-IP": addressFor(testInfo) });
}
