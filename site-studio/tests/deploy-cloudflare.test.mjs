// The Cloudflare deploy command (story 1.2, CAP-1), with Wrangler and the network stubbed.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  childEnvironment,
  chooseAddress,
  createKeyStateActions,
  createMainOptions,
  createWranglerActions,
  DEPLOYMENT_KEY_ENV,
  DEPLOYMENT_KEY_SECRET,
  generateDeploymentKey,
  generateSetupCode,
  hasExplicitPort,
  isDeploymentKey,
  isWholeHostTarget,
  STATE_RETRY_MS,
  KEY_LINES,
  KEY_SETTLE_MIN_REPLIES,
  KEY_SETTLE_MS,
  KEY_SETTLE_TIMEOUT_MS,
  keyConfirmed,
  parseDeployArgs,
  parseKeyState,
  parseSecretList,
  parseSetupState,
  readDeployOutput,
  runDeploy,
  SETUP_CODE_ALPHABET,
  SETTLE_NOTICE,
  SETUP_CODE_SECRET,
  waitForKeyState,
  waitForSettledKeyState,
  waitForSetupState,
  wranglerDeployArgs,
  wranglerSpawn,
} from "../scripts/deploy-cloudflare.mjs";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function harness({ state, targets = ["https://site-studio.example.workers.dev"], workerName = "site-studio" }) {
  const calls = { deploy: 0, asked: [], secrets: [], deleted: [], out: [], err: [] };
  const options = {
    env: {},
    deploy: async () => {
      calls.deploy += 1;
      return { workerName, targets };
    },
    // The Worker already holds a deployment key, so the key steps print only the "kept" line.
    listSecrets: async () => [DEPLOYMENT_KEY_SECRET],
    askKeyState: async () => {
      throw new Error("the key state is not asked when the Worker holds a key");
    },
    askState: async (address) => {
      calls.asked.push(address);
      return state;
    },
    putSecret: async (worker, name, value) => {
      calls.secrets.push({ worker, name, value });
    },
    deleteSecret: async (worker, name) => {
      calls.deleted.push({ worker, name });
    },
    print: (line) => calls.out.push(line),
    printError: (line) => calls.err.push(line),
  };
  return { calls, options };
}

describe("set-up code", () => {
  it("has at least 20 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateSetupCode();
      assert.ok(code.length >= 20, code);
      assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
    assert.equal(SETUP_CODE_ALPHABET.length, 32);
    assert.equal(new Set(SETUP_CODE_ALPHABET).size, 32);
  });

  it("comes from the random source it is given, using every byte", () => {
    const seen = [];
    const code = generateSetupCode((size) => {
      seen.push(size);
      return Buffer.from(Array.from({ length: size }, (_, index) => index));
    });
    assert.deepEqual(seen, [code.length]);
    assert.equal(code, SETUP_CODE_ALPHABET.slice(0, code.length));
  });

  it("differs every time and uses the whole alphabet", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateSetupCode()));
    assert.equal(codes.size, 500);
    const symbols = new Set([...codes].join(""));
    assert.equal(symbols.size, 32);
  });
});

describe("the deploy command", () => {
  it("issues, supplies and prints one code when set-up is open", async () => {
    const { calls, options } = harness({ state: "open" });
    const exit = await runDeploy(options);
    assert.equal(exit, 0);
    assert.equal(calls.deploy, 1);
    assert.deepEqual(calls.asked, ["https://site-studio.example.workers.dev"]);
    assert.equal(calls.secrets.length, 1);
    const [{ worker, name, value }] = calls.secrets;
    assert.equal(worker, "site-studio");
    assert.equal(name, SETUP_CODE_SECRET);
    assert.ok(value.length >= 20);
    const printed = calls.out.join("\n");
    assert.equal(printed.split(value).length - 1, 1, "the code is printed exactly once");
    assert.deepEqual(calls.err, []);
  });

  it("tells the installer to wait about a minute before using a new code (D-7)", async () => {
    const { calls, options } = harness({ state: "open" });
    await runDeploy(options);
    assert.equal(calls.out.at(-1), SETTLE_NOTICE);
    assert.match(SETTLE_NOTICE, /^Wait about a minute before using it/);
    const closed = harness({ state: "closed" });
    await runDeploy(closed.options);
    assert.ok(!closed.calls.out.includes(SETTLE_NOTICE));
  });

  it("issues a new code on each deploy while set-up stays open", async () => {
    const first = harness({ state: "open" });
    const second = harness({ state: "open" });
    await runDeploy(first.options);
    await runDeploy(second.options);
    assert.notEqual(first.calls.secrets[0].value, second.calls.secrets[0].value);
  });

  it("prints and supplies no code when set-up is closed", async () => {
    const { calls, options } = harness({ state: "closed" });
    let generated = 0;
    const exit = await runDeploy({ ...options, generate: () => { generated += 1; return "X".repeat(24); } });
    assert.equal(exit, 0);
    assert.equal(calls.deploy, 1);
    assert.equal(generated, 0);
    assert.deepEqual(calls.secrets, []);
    assert.ok(!/code:/i.test(calls.out.join("\n")));
    assert.match(calls.out.join("\n"), /already complete/);
  });

  it("issues no code and fails when the state route never answers", async () => {
    const { calls, options } = harness({ state: null });
    const exit = await runDeploy(options);
    assert.equal(exit, 1);
    assert.deepEqual(calls.secrets, []);
    // Nothing of the set-up code is printed: only the first line and the key steps' "kept" line.
    assert.deepEqual(calls.out, [KEY_LINES.oneAtATime, KEY_LINES.kept]);
    assert.match(calls.err.join("\n"), /\/api\/v1\/setup\/state/);
  });

  it("asks the --url address instead of Wrangler's, and refuses one that is not https", async () => {
    // Wrangler reports the custom domain, so --url may name it (pull request 13, review round 1).
    const custom = harness({ state: "closed", targets: ["https://site-studio.example.workers.dev", "survey.example.com (custom domain)"] });
    await runDeploy({ ...custom.options, url: "https://survey.example.com/some/path" });
    assert.deepEqual(custom.calls.asked, ["https://survey.example.com"]);

    const plain = harness({ state: "open", targets: ["http://site-studio.example.workers.dev"] });
    assert.equal(await runDeploy(plain.options), 1);
    assert.deepEqual(plain.calls.asked, []);
    assert.deepEqual(plain.calls.secrets, []);
  });
});

/**
 * Two installations behind two addresses (pull request 13, review round 1): the Worker Wrangler
 * deployed ("worker-a", whose secret list is `listA`) and another one at `https://b.example.net`
 * whose key state is `stateB`. Key-state reads answer by address: `a.example.net` (the deployed
 * Worker's own) answers `stateA`. Every effect is recorded in one event log.
 */
function twoInstallations({ targets, listA = [], stateA = { fingerprint: "stored", key: "none" }, stateB, supplied = null }) {
  const events = [];
  const stateFor = (address) => (address === "https://b.example.net" ? stateB : stateA);
  const options = {
    env: supplied === null ? {} : { [DEPLOYMENT_KEY_ENV]: supplied },
    deploy: async () => ({ workerName: "worker-a", targets }),
    listSecrets: async (worker) => { events.push(["list", worker]); return listA; },
    askKeyState: async (address) => { events.push(["ask", address]); return stateFor(address); },
    settleKeyState: async (address) => { events.push(["settle", address]); return stateFor(address); },
    askState: async (address) => { events.push(["setup-state", address]); return "closed"; },
    putSecret: async (worker, name) => { events.push(["put", worker, name]); },
    deleteSecret: async (worker, name) => { events.push(["delete", worker, name]); },
    generateKey: () => { events.push(["generate"]); return generateDeploymentKey(); },
    print: (line) => events.push(["out", line]),
    printError: (line) => events.push(["err", line]),
  };
  return { events, options };
}

const effects = (events) => events.filter(([kind]) => ["list", "ask", "settle", "put", "delete", "generate", "setup-state"].includes(kind));

describe("--url is tied to the Worker Wrangler deployed (pull request 13, review round 1)", () => {
  // A workers.dev address: since review round 4 the only target read without --url.
  const A_TARGET = "https://a.example.workers.dev";

  it("refuses an address of another installation that would have the original key put and then deleted on its mismatch", async () => {
    const { events, options } = twoInstallations({
      targets: [A_TARGET],
      stateB: { fingerprint: "stored", key: "mismatch" },
      supplied: generateDeploymentKey(),
    });
    const exit = await runDeploy({ ...options, url: "https://b.example.net" });
    assert.equal(exit, 1);
    assert.deepEqual(effects(events), [], "nothing listed, asked, put or deleted, and no set-up step");
    assert.deepEqual(events.filter(([kind]) => kind === "err").map(([, line]) => line), [KEY_LINES.urlNotReported("https://b.example.net", "worker-a")]);
  });

  it("refuses an address of another installation that holds nothing, so no fresh key is generated over this Worker's stored secrets", async () => {
    const { events, options } = twoInstallations({ targets: [A_TARGET], stateB: { fingerprint: "none", key: "none" } });
    const exit = await runDeploy({ ...options, url: "https://b.example.net" });
    assert.equal(exit, 1);
    assert.deepEqual(effects(events), []);
  });

  const accepted = [
    ["an https:// address Wrangler reported", ["https://a.example.net"], "https://a.example.net"],
    ["a custom domain Wrangler reported", ["https://a.workers.dev", "a.example.net (custom domain)"], "https://a.example.net/path"],
    ["a route without a wildcard", ["https://a.workers.dev", "a.example.net/* (zone name: example.net)"], "https://a.example.net"],
    ["a reported host given in capitals", ["a.example.net (custom domain - zone name: example.net)"], "https://A.Example.NET"],
  ];
  for (const [name, targets, url] of accepted) {
    it(`accepts ${name} and reads the key state there`, async () => {
      const { events, options } = twoInstallations({ targets, listA: [DEPLOYMENT_KEY_SECRET] });
      const exit = await runDeploy({ ...options, url });
      assert.equal(exit, 0);
      assert.deepEqual(effects(events), [["list", "worker-a"], ["setup-state", "https://a.example.net"]]);
    });
  }

  const refused = [
    ["a wildcard route", ["https://a.workers.dev", "*.example.net/* (zone name: example.net)"], "https://a.example.net"],
    ["a different host", ["https://a.workers.dev", "a.example.net (custom domain)"], "https://c.example.net"],
    ["a look-alike host that ends with a reported one", ["a.example.net (custom domain)"], "https://xa.example.net"],
    ["a look-alike host that starts with a reported one", ["a.example.net (custom domain)"], "https://a.example.net.attacker.test"],
    ["a reported parent domain", ["example.net/* (zone name: example.net)"], "https://a.example.net"],
    // Review layer of round 1: a route limited to a path leaves the origin's root to something else.
    ["a route limited to a path", ["https://a.workers.dev", "a.example.net/survey/* (zone name: example.net)"], "https://a.example.net"],
    ["a reported host with an explicit port", ["a.example.net (custom domain)"], "https://a.example.net:8443"],
  ];
  for (const [name, targets, url] of refused) {
    it(`refuses ${name}, before any key step`, async () => {
      const { events, options } = twoInstallations({ targets, listA: [], stateB: { fingerprint: "none", key: "none" } });
      const exit = await runDeploy({ ...options, url });
      assert.equal(exit, 1);
      assert.deepEqual(effects(events), []);
      assert.equal(events.filter(([kind]) => kind === "err").length, 1);
    });
  }

  it("without --url reads the workers.dev address Wrangler reported (review round 4: the only default)", async () => {
    const { events, options } = twoInstallations({ targets: ["schedule: */5 * * * *", A_TARGET], listA: [DEPLOYMENT_KEY_SECRET] });
    assert.equal(await runDeploy(options), 0);
    assert.deepEqual(effects(events), [["list", "worker-a"], ["setup-state", A_TARGET]]);
  });
});

describe("the default address (pull request 13, review round 4)", () => {
  it("stops after the deploy, with nothing listed, asked, put or deleted, when Wrangler reports no workers.dev address", async () => {
    const { events, options } = twoInstallations({ targets: ["https://a.example.net", "https://a.example.net/*", "a.example.net (custom domain)"], listA: [], stateB: { fingerprint: "none", key: "none" } });
    assert.equal(await runDeploy(options), 1);
    assert.deepEqual(effects(events), []);
    assert.deepEqual(events.filter(([kind]) => kind === "err").map(([, line]) => line), ["The deployment reported no https:// address. Run again with --url <https address>."]);
  });
});

describe("a settled answer must complete within the limit (pull request 13, review round 1)", () => {
  // Replies are `mismatch` from `from` on (500 before), one every 3 s of a fake clock; the first
  // request takes `firstLatency` ms. A run that starts at 120 s has its 21st reply at 180 s.
  async function settleWith({ firstLatency }) {
    let clock = 0;
    let requests = 0;
    const fetchImpl = async () => {
      requests += 1;
      if (requests === 1) clock += firstLatency;
      const at = clock;
      return at >= 120_000 ? new Response(JSON.stringify({ fingerprint: "stored", key: "mismatch" }), { status: 200 }) : new Response("", { status: 500 });
    };
    return waitForSettledKeyState("https://a.example.net", { fetchImpl, now: () => clock, sleep: async (ms) => { clock += ms; } });
  }

  it("settles when the settling reply completes exactly at the limit", async () => {
    assert.deepEqual(await settleWith({ firstLatency: 0 }), { fingerprint: "stored", key: "mismatch" });
  });

  it("answers null, so nothing is deleted, when the settling reply completes 1 ms after the limit", async () => {
    assert.equal(await settleWith({ firstLatency: 1 }), null);
  });
});

describe("pull request 13, review round 2", () => {
  // A workers.dev address: since review round 4 the only target read without --url.
  const A_TARGET = "https://a.example.workers.dev";

  for (const [name, targets, url] of [
    ["a reported host written with the default port :443", ["a.example.net (custom domain)"], "https://a.example.net:443"],
    ["a route written with its scheme and limited to a path", ["https://a.workers.dev", "https://a.example.net/survey/* (zone name: example.net)"], "https://a.example.net"],
  ]) {
    it(`refuses ${name}, before any key step`, async () => {
      const { events, options } = twoInstallations({ targets, listA: [], stateB: { fingerprint: "none", key: "none" } });
      assert.equal(await runDeploy({ ...options, url }), 1);
      assert.deepEqual(effects(events), []);
    });
  }

  it("reads a port written in any spelling the URL parser accepts, and only a written one", () => {
    for (const raw of ["https://a.example.net:443", "https://a.example.net:8443/x", "https:a.example.net:443", "https:/a.example.net:443", "https:\\\\a.example.net:443", " \u0001https://a.example.net:443", "HTTPS://user:pw@a.example.net:443", "https://a.example.net:"]) {
      assert.equal(hasExplicitPort(raw), true, raw);
    }
    for (const raw of ["https://a.example.net", "https://a.example.net/path:443", "https://user:pw@a.example.net", "https://a.example.net?port=:443", "https://[::1]"]) {
      assert.equal(hasExplicitPort(raw), false, raw);
    }
  });

  it("counts an https target as the whole host only for a bare address or /*", () => {
    assert.equal(isWholeHostTarget("https://a.workers.dev"), true);
    assert.equal(isWholeHostTarget("https://a.example.net/* (zone name: example.net)"), true);
    for (const target of ["https://a.example.net/", "https://a.example.net/survey/*", "https://*.example.net/*", "a.example.net/*", "http://a.example.net"]) {
      assert.equal(isWholeHostTarget(target), false, target);
    }
  });

  it("without --url, skips an https route limited to a path and asks the workers.dev target (review round 4)", async () => {
    const { events, options } = twoInstallations({ targets: ["https://a.example.net/survey/* (zone name: example.net)", "https://a.workers.dev"], listA: [DEPLOYMENT_KEY_SECRET] });
    assert.equal(await runDeploy(options), 0);
    assert.deepEqual(effects(events), [["list", "worker-a"], ["setup-state", "https://a.workers.dev"]]);
  });

  it("accepts a whole-host route written with its scheme", async () => {
    const { events, options } = twoInstallations({ targets: ["https://a.workers.dev", "https://a.example.net/* (zone name: example.net)"], listA: [DEPLOYMENT_KEY_SECRET] });
    assert.equal(await runDeploy({ ...options, url: "https://a.example.net" }), 0);
    assert.deepEqual(effects(events), [["list", "worker-a"], ["setup-state", "https://a.example.net"]]);
  });

  it("reads the key state from an accepted custom domain when the Worker lists no key", async () => {
    const { events, options } = twoInstallations({
      targets: ["https://a.workers.dev", "a.example.net (custom domain)"],
      listA: [],
      stateA: { fingerprint: "none", key: "none" },
    });
    assert.equal(await runDeploy({ ...options, url: "https://A.example.net/path" }), 0);
    assert.deepEqual(effects(events).slice(0, 2), [["list", "worker-a"], ["ask", "https://a.example.net"]]);
  });

  it("starts no key-state request after the settle limit", async () => {
    let clock = 0;
    const started = [];
    // Replies that never settle (500), each taking 2.5 s, polled 3 s after each reply: one reply
    // arrives at 178.5 s, after which a request would start at 181.5 s.
    const fetchImpl = async () => {
      started.push(clock);
      clock += 2_500;
      return new Response("", { status: 500 });
    };
    const settled = await waitForSettledKeyState(A_TARGET, { fetchImpl, now: () => clock, sleep: async (ms) => { clock += ms; } });
    assert.equal(settled, null);
    assert.ok(started.length > 0);
    assert.ok(started.every((at) => at <= KEY_SETTLE_TIMEOUT_MS), "a request started after the limit");
  });

  /**
   * The Worker's own address redirects every request to another Worker, which answers `mismatch`
   * against its own stored fingerprint. Following the redirect is what `fetch` does by default; the
   * fake follows it unless the request says `redirect: "error"`, as real `fetch` then fails.
   */
  function redirectingFetch(calls) {
    return async (url, init = {}) => {
      calls.push({ url, redirect: init.redirect });
      if (init.redirect === "error") throw new TypeError("fetch failed: unexpected redirect");
      return Response.json({ fingerprint: "stored", key: "mismatch" });
    };
  }

  it("refuses redirects on the key-state read: a redirect to another Worker's mismatch puts and deletes nothing", async () => {
    let clock = 0;
    const calls = [];
    const { events, options } = twoInstallations({ targets: [A_TARGET], listA: [], supplied: generateDeploymentKey() });
    const actions = createKeyStateActions({ fetchImpl: redirectingFetch(calls), sleep: async (ms) => { clock += ms; }, now: () => clock });
    const exit = await runDeploy({ ...options, askKeyState: actions.askKeyState, settleKeyState: actions.settleKeyState });
    assert.equal(exit, 1);
    assert.ok(calls.length > 0 && calls.every((call) => call.redirect === "error"));
    assert.equal(events.filter(([kind]) => kind === "put" || kind === "delete").length, 0, "nothing put or deleted");
    assert.deepEqual(events.filter(([kind]) => kind === "err").map(([, line]) => line), [KEY_LINES.stateUnreadable(A_TARGET)]);
  });

  it("refuses redirects on the set-up state read too", async () => {
    let clock = 0;
    const calls = [];
    const state = await waitForSetupState(A_TARGET, {
      fetchImpl: async (url, init = {}) => {
        calls.push(init.redirect);
        if (init.redirect === "error") throw new TypeError("fetch failed: unexpected redirect");
        return Response.json({ state: "open" });
      },
      now: () => clock,
      sleep: async (ms) => { clock += ms; },
    });
    assert.equal(state, null, "a redirect is no answer");
    assert.ok(calls.length > 0 && calls.every((redirect) => redirect === "error"));
  });
});

describe("pull request 13, review round 3", () => {

  it("starts no key-state request after the limit when a sleep ends late", async () => {
    let clock = 0;
    const started = [];
    const fetchImpl = async () => {
      started.push(clock);
      return new Response("", { status: 500 });
    };
    // Every sleep ends 20 s late: the last one that may start before the limit ends after it.
    const settled = await waitForSettledKeyState("https://a.example.net", { fetchImpl, now: () => clock, sleep: async (ms) => { clock += ms + 20_000; } });
    assert.equal(settled, null);
    assert.ok(started.length > 1);
    assert.ok(started.every((at) => at <= KEY_SETTLE_TIMEOUT_MS), `a request started after the limit: ${started.at(-1)}`);
  });

  it("still settles on a reply that arrives exactly at the limit", async () => {
    let clock = 0;
    const fetchImpl = async () => Response.json({ fingerprint: "stored", key: "matches" });
    const settled = await waitForSettledKeyState("https://a.example.net", {
      fetchImpl,
      now: () => clock,
      sleep: async (ms) => { clock = Math.min(clock + ms, KEY_SETTLE_TIMEOUT_MS); },
      retryMs: KEY_SETTLE_TIMEOUT_MS / 4,
      minReplies: 5,
      settleMs: KEY_SETTLE_TIMEOUT_MS,
    });
    assert.deepEqual(settled, { fingerprint: "stored", key: "matches" });
  });
});

describe("the deploy command when Wrangler reports little", () => {
  it("issues no code when the deployment reports nothing, even with --url", async () => {
    const { calls, options } = harness({ state: "open" });
    const exit = await runDeploy({ ...options, deploy: async () => null, url: "https://survey.example.com" });
    assert.equal(exit, 1);
    assert.deepEqual(calls.secrets, []);
    assert.match(calls.err.join("\n"), /Worker's name/);
  });

  it("refuses an unreadable --url without throwing", async () => {
    const { calls, options } = harness({ state: "open" });
    assert.equal(await runDeploy({ ...options, url: "survey.example.com" }), 1);
    assert.deepEqual(calls.asked, []);
    assert.deepEqual(calls.secrets, []);
  });
});

describe("deploy helpers", () => {
  it("accepts only a state reply with exactly one field", () => {
    assert.equal(parseSetupState({ state: "open" }), "open");
    assert.equal(parseSetupState({ state: "closed" }), "closed");
    assert.equal(parseSetupState({ state: "open", users: 0 }), null);
    assert.equal(parseSetupState({ state: "maybe" }), null);
    assert.equal(parseSetupState(null), null);
    assert.equal(parseSetupState(["open"]), null);
  });

  it("reads the deploy entry from Wrangler's output file", () => {
    const text = [
      JSON.stringify({ type: "wrangler-session", version: 1 }),
      "not json",
      JSON.stringify({ type: "deploy", worker_name: "site-studio", targets: ["https://a.workers.dev", "https://b.example.com"] }),
    ].join("\n");
    assert.deepEqual(readDeployOutput(text), { workerName: "site-studio", targets: ["https://a.workers.dev", "https://b.example.com"] });
    assert.equal(readDeployOutput(""), null);
    // Wrangler 4.164 prefixes https:// to the workers.dev host only, with no path (`cli.js`, "Append
    // protocol only on workers.dev domains"); an https target with a path is a route (review round 2).
    assert.equal(chooseAddress(["http://x.test", "https://a.workers.dev"]), "https://a.workers.dev");
    assert.equal(chooseAddress(["http://x.test", "https://a.workers.dev/"]), null);
    assert.equal(chooseAddress([]), null);
  });

  it("without --url reads only a workers.dev address, whatever else Wrangler reports (review round 4)", () => {
    assert.equal(chooseAddress(["https://example.com/*"]), null, "a scheme-prefixed whole-host route is not a default");
    assert.equal(chooseAddress(["https://example.com"]), null, "a bare https custom host is not a default");
    assert.equal(chooseAddress(["https://example.com/*", "https://example.com", "https://a.workers.dev"]), "https://a.workers.dev", "a workers.dev address listed later is chosen");
    assert.equal(chooseAddress(["https://A.Workers.Dev"]), "https://a.workers.dev", "the host is compared lower-cased");
    assert.equal(chooseAddress(["https://workers.dev.example.com"]), null, "a host that only contains workers.dev");
    assert.equal(chooseAddress(["https://aworkers.dev"]), null, "a host that ends in workers.dev without the dot");
    assert.equal(chooseAddress(["https://workers.dev.example.com/*", "a.example.net (custom domain)"]), null);
    assert.equal(chooseAddress(["https://workers.dev"]), null, "the bare workers.dev apex");
    assert.equal(chooseAddress(["https://a.workers.dev/survey/*"]), null, "a workers.dev target limited to a path");
    assert.equal(chooseAddress(["https://a.workers.dev/*"]), "https://a.workers.dev", "a workers.dev target written as a whole-host route");
    // --url is unchanged: any https address the operator names is the one asked (checked against the
    // reported hosts by the deploy).
    assert.equal(chooseAddress(["https://example.com/*"], "https://example.com"), "https://example.com");
  });

  it("keeps asking a new Worker until it answers, and gives up at the deadline", async () => {
    let clock = 0;
    const answers = [new Error("not reachable"), new Response("nothing here", { status: 404 }), Response.json({ state: "open" })];
    const found = await waitForSetupState("https://a.test", {
      fetchImpl: async (url, init) => {
        assert.equal(url, "https://a.test/api/v1/setup/state");
        assert.ok(init.signal instanceof AbortSignal, "each request has a time limit");
        const next = answers.shift();
        if (next instanceof Error) throw next;
        return next;
      },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
      timeoutMs: 60_000,
      retryMs: 1_000,
    });
    assert.equal(found, "open");
    assert.equal(clock, 2_000);

    clock = 0;
    const never = await waitForSetupState("https://a.test", {
      fetchImpl: async () => Response.json({ state: "open", extra: true }),
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
      timeoutMs: 5_000,
      retryMs: 1_000,
    });
    assert.equal(never, null);
  });
});

describe("the deploy command's options", () => {
  it("deploys under --name when given, and under the configured name otherwise", () => {
    assert.deepEqual(parseDeployArgs([]), { url: undefined, name: undefined });
    assert.deepEqual(wranglerDeployArgs(undefined), ["deploy"]);
    const named = parseDeployArgs(["--name", "site-studio-test-b"]);
    assert.deepEqual(named, { url: undefined, name: "site-studio-test-b" });
    assert.deepEqual(wranglerDeployArgs(named.name), ["deploy", "--name", "site-studio-test-b"]);
    assert.deepEqual(parseDeployArgs(["--url", "https://survey.example.com", "--name", "w"]), { url: "https://survey.example.com", name: "w" });
  });

  it("refuses an option without a value or an unknown option, so nothing is deployed", () => {
    for (const argv of [["--name"], ["--name", "--url", "https://a.test"], ["--url"], ["--name", " "], ["--nmae", "w"], ["w"]]) {
      assert.ok(typeof parseDeployArgs(argv).error === "string", argv.join(" "));
    }
  });
});

describe("starting Wrangler", () => {
  it("runs Wrangler's entry script with Node and no shell, on every platform", () => {
    const root = path.join(path.sep, "Users", "Kevin Smith", "My Projects", "site-studio");
    const spawned = wranglerSpawn(root, ["deploy"], { execPath: "/usr/bin/node" });
    assert.equal(spawned.command, "/usr/bin/node");
    assert.deepEqual(spawned.args, [path.join(root, "node_modules", "wrangler", "bin", "wrangler.js"), "deploy"]);
    assert.equal(spawned.options.shell, false);
    assert.equal(spawned.options.cwd, root);
    assert.ok(!spawned.command.endsWith(".cmd"));
  });

  it("passes a path with spaces and a Worker name with shell characters as single, unchanged arguments", () => {
    const root = path.join(path.sep, "Users", "Kevin Smith", "site studio");
    const hostile = 'w & calc.exe | "x" %PATH% ^ > out';
    const spawned = wranglerSpawn(root, wranglerDeployArgs(hostile));
    assert.deepEqual(spawned.args.slice(1), ["deploy", "--name", hostile]);
    assert.ok(spawned.args[0].startsWith(root), "the repository path stays one argument");
    assert.equal(spawned.options.shell, false);
    const secret = wranglerSpawn(root, ["secret", "put", SETUP_CODE_SECRET, "--name", hostile]);
    assert.deepEqual(secret.args.slice(1), ["secret", "put", "SETUP_CODE", "--name", hostile]);
  });
});

// Story 1.5, spec 6: the deploy command's deployment key (CAP-11, D-17, D-18). Every outside
// effect is a fake; keys are generated at run time and never written to a file.
const ADDRESS = "https://site-studio.example.workers.dev";

/** A fake Worker whose secret list grows when a secret is put, shared across runs. */
function fakeWorker(names = []) {
  return { secrets: new Set(names) };
}

/**
 * One run of the command against fakes that share one ordered event log (prints, puts, deletes,
 * generate calls, key-state asks and settles; each event carries `at`, the injected clock's time,
 * when `now` is given). `keyStates` are the key-state replies in order: the first ask takes the
 * next one; a settle skips to the next `stored` `matches` or `mismatch`, as if it had settled on
 * it, and answers null when none is left. `askKeyState` and `settleKeyState` replace the fakes.
 */
function keyHarness({ worker = fakeWorker(), keyStates = [], supplied, setup = "closed", workerName = "site-studio", putFails = false, storeBeforeFailing = false, deleteFails = false, askKeyState, settleKeyState, now } = {}) {
  const log = [];
  const events = { push: (event) => log.push(now ? { ...event, at: now() } : event) };
  const generated = [];
  const queue = [...keyStates];
  const options = {
    env: supplied === undefined ? {} : { [DEPLOYMENT_KEY_ENV]: supplied },
    deploy: async () => {
      events.push({ type: "deploy" });
      return { workerName, targets: [ADDRESS] };
    },
    listSecrets: async (name) => {
      events.push({ type: "list", name });
      return [...worker.secrets];
    },
    askKeyState: async (address, ...rest) => {
      events.push({ type: "keyState", address });
      assert.deepEqual(rest, [], "the first ask takes any exact reply");
      if (askKeyState) return askKeyState(address);
      return queue.shift() ?? null;
    },
    settleKeyState: async (address) => {
      events.push({ type: "settle", address });
      if (settleKeyState) return settleKeyState(address);
      while (queue.length > 0) {
        const reply = queue.shift();
        if (keyConfirmed(reply)) return reply;
      }
      return null;
    },
    askState: async () => {
      events.push({ type: "setupState" });
      return setup;
    },
    putSecret: async (target, name, value) => {
      events.push({ type: "put", worker: target, name, value });
      if (putFails) {
        if (storeBeforeFailing) worker.secrets.add(name);
        throw new Error("wrangler secret exited with 1.");
      }
      worker.secrets.add(name);
    },
    deleteSecret: async (target, name) => {
      events.push({ type: "delete", worker: target, name });
      if (deleteFails) throw new Error("wrangler secret exited with 1.");
      worker.secrets.delete(name);
    },
    generateKey: () => {
      const key = generateDeploymentKey();
      generated.push(key);
      events.push({ type: "generate" });
      return key;
    },
    print: (line) => events.push({ type: "out", line }),
    printError: (line) => events.push({ type: "err", line }),
  };
  const out = () => log.filter((event) => event.type === "out").map((event) => event.line);
  const err = () => log.filter((event) => event.type === "err").map((event) => event.line);
  const puts = (name = DEPLOYMENT_KEY_SECRET) => log.filter((event) => event.type === "put" && event.name === name);
  const deletes = () => log.filter((event) => event.type === "delete");
  const settles = () => log.filter((event) => event.type === "settle");
  return { events: log, generated, options, out, err, puts, deletes, settles, worker, supplied };
}

function occurrences(lines, text) {
  return lines.join("\n").split(text).length - 1;
}

/**
 * The checks every row shares: the first line is the "one deploy at a time" line; a generated key
 * is printed exactly once and in no error line; a supplied key is printed nowhere; and nothing is
 * deleted unless the row says so (`deleted: true`, only the mismatch rows that delete the key the
 * run put).
 */
function assertNoLeak(run, { deleted = false } = {}) {
  const out = run.out();
  const err = run.err();
  if (!deleted) assert.deepEqual(run.deletes(), [], "no secret is deleted");
  assert.equal(out[0], KEY_LINES.oneAtATime, "every run first prints the one-deploy-at-a-time line");
  for (const key of run.generated) {
    assert.equal(occurrences(out, key), 1, "a generated key is printed exactly once");
    assert.equal(occurrences(out, KEY_LINES.generated(key)), 1, "only on its own line");
    assert.equal(occurrences(err, key), 0, "a generated key is in no error line");
  }
  if (run.supplied) {
    assert.equal(occurrences(out, run.supplied), 0, "a supplied key is never printed");
    assert.equal(occurrences(err, run.supplied), 0, "a supplied key is in no error line");
  }
}

function index(run, predicate) {
  return run.events.findIndex(predicate);
}

/**
 * A fake `spawn` that records each child's command, arguments, options and standard input, and
 * ends each with the code `closeCode(args)` gives for its Wrangler arguments (default 0). For a
 * deploy it writes a deploy entry to WRANGLER_OUTPUT_FILE_PATH; for a listing it writes
 * `listOutput` to the child's standard output. When `stdinError(args)` holds, the child's standard
 * input emits an EPIPE `error` before the close.
 */
function fakeSpawn({ listOutput = "[]", closeCode = () => 0, stdinError = () => false } = {}) {
  const children = [];
  const spawnImpl = (command, args, options) => {
    const record = { command, args, options, input: undefined };
    children.push(record);
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.end = (value) => { record.input = value; };
    setImmediate(() => {
      if (args[1] === "deploy") {
        writeFileSync(options.env.WRANGLER_OUTPUT_FILE_PATH, JSON.stringify({ type: "deploy", worker_name: "site-studio", targets: [ADDRESS] }) + "\n");
      }
      if (args[1] === "secret" && args[2] === "list") child.stdout.emit("data", Buffer.from(listOutput));
      if (stdinError(args.slice(1))) {
        // The child exited before reading its standard input.
        child.stdin.emit("error", Object.assign(new Error("write EPIPE"), { code: "EPIPE" }));
      }
      child.emit("close", closeCode(args.slice(1)));
    });
    return child;
  };
  return { children, spawn: spawnImpl };
}

describe("the deploy command's deployment key (story 1.5, CAP-11)", () => {
  it("First deploy: the key is printed once with the keep-a-copy lines before it is put, put once, then the set-up code", async () => {
    const run = keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.equal(run.generated.length, 1);
    const [key] = run.generated;
    assert.deepEqual(run.puts().map(({ worker, value }) => ({ worker, value })), [{ worker: "site-studio", value: key }]);
    const printedKey = index(run, (event) => event.type === "out" && event.line === KEY_LINES.generated(key));
    const printedCopy = index(run, (event) => event.type === "out" && event.line === KEY_LINES.keepCopy);
    const put = index(run, (event) => event.type === "put" && event.name === DEPLOYMENT_KEY_SECRET);
    assert.ok(index(run, (event) => event.type === "deploy") < printedKey);
    assert.ok(printedKey < printedCopy && printedCopy < put, "the key and the keep-a-copy lines come before the put");
    const setupLine = index(run, (event) => event.type === "out" && event.line.startsWith("Deployed to "));
    assert.ok(put < setupLine, "the set-up lines come after the key lines");
    assert.equal(run.puts(SETUP_CODE_SECRET).length, 1);
    assert.deepEqual(run.err(), []);
  });

  it("Put fails after generating: the key is printed once and the may-or-may-not line, exit 1", async () => {
    const run = keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }], setup: "open", putFails: true });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.equal(run.generated.length, 1);
    assert.equal(run.puts().length, 1);
    assert.deepEqual(run.err(), [KEY_LINES.putFailed]);
    assert.ok(!run.events.some((event) => event.type === "setupState"), "the set-up steps do not run");
  });

  it("Rerun with that key: the list now holds it, so it is not put; the kept and not-used lines, exit 0", async () => {
    const worker = fakeWorker();
    const first = keyHarness({ worker, keyStates: [{ fingerprint: "none", key: "none" }], putFails: true, storeBeforeFailing: true });
    assert.equal(await runDeploy(first.options), 1);
    const [key] = first.generated;
    // Nothing is encrypted yet: the first ask answers fingerprint "none", so nothing is compared or settled.
    const second = keyHarness({ worker, supplied: key, keyStates: [{ fingerprint: "none", key: "present" }] });
    assert.equal(await runDeploy(second.options), 0);
    assertNoLeak(second);
    assert.deepEqual(second.generated, []);
    assert.deepEqual(second.puts(), []);
    assert.equal(second.events.filter((event) => event.type === "keyState").length, 1);
    assert.deepEqual(second.settles(), [], "nothing is stored, so nothing is compared or settled");
    assert.deepEqual(second.out().slice(0, 3), [KEY_LINES.oneAtATime, KEY_LINES.kept, KEY_LINES.notUsed]);
  });

  it("Redeploy, key kept: no generate, no put, the kept line; the set-up steps as before", async () => {
    const run = keyHarness({ worker: fakeWorker([DEPLOYMENT_KEY_SECRET, SETUP_CODE_SECRET]), setup: "closed" });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.generated, []);
    assert.deepEqual(run.puts(), []);
    assert.ok(!run.events.some((event) => event.type === "keyState"));
    assert.deepEqual(run.out(), [
      KEY_LINES.oneAtATime,
      KEY_LINES.kept,
      `Deployed to ${ADDRESS}. Set-up is already complete, so no set-up code was issued.`,
    ]);
  });

  it("Supplied, no key yet: that key is put; nothing generated or printed", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }] });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.generated, []);
    assert.deepEqual(run.puts().map((event) => event.value), [supplied]);
    assert.ok(run.out().includes(KEY_LINES.supplied));
    assert.ok(!run.out().some((line) => line.startsWith("  Deployment key:")));
  });

  it("Supplied, key exists: not put; the not-used line", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "none", key: "present" }] });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.puts(), []);
    assert.deepEqual(run.generated, []);
    assert.ok(run.out().includes(KEY_LINES.kept));
    assert.ok(run.out().includes(KEY_LINES.notUsed));
    assert.deepEqual(run.err(), []);
  });

  it("Supplied, malformed: 42 characters, or 43 that do not re-encode the same, deploy nothing, exit 1 with the line", async () => {
    const valid = generateDeploymentKey();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const last = alphabet.indexOf(valid.at(-1));
    const nonCanonical = valid.slice(0, 42) + alphabet[last ^ 1];
    for (const supplied of [valid.slice(0, 42), nonCanonical, valid + "A", valid.slice(0, 42) + "="]) {
      const run = keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }] });
      assert.equal(await runDeploy(run.options), 1, supplied.length + " characters");
      assertNoLeak(run);
      assert.ok(!run.events.some((event) => event.type === "deploy"), "nothing deployed");
      assert.deepEqual(run.err(), [KEY_LINES.malformed]);
      assert.deepEqual(run.puts(), []);
      assert.deepEqual(run.generated, []);
    }
  });

  it("Stored, supplied, matches: put, then confirmed against the fingerprint; the supplied line", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({
      supplied,
      setup: "closed",
      keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }],
    });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.puts().map((event) => event.value), [supplied]);
    assert.equal(run.events.filter((event) => event.type === "keyState").length, 1);
    assert.equal(run.settles().length, 1);
    const checking = index(run, (event) => event.type === "out" && event.line === KEY_LINES.checking);
    const settle = index(run, (event) => event.type === "settle");
    assert.ok(index(run, (event) => event.type === "put") < checking && checking < settle, "put, the checking line, then the settled answer");
    assert.ok(run.out().includes(KEY_LINES.supplied));
    assert.deepEqual(run.generated, []);
    assert.ok(run.events.some((event) => event.type === "setupState"), "the set-up steps follow");
  });

  it("Stored, supplied, mismatch, delete succeeds: put; then deleted again; the not-the-original, removed-again line, exit 1", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run, { deleted: true });
    assert.equal(run.puts().length, 1);
    assert.deepEqual(run.deletes().map(({ worker, name }) => ({ worker, name })), [{ worker: "site-studio", name: DEPLOYMENT_KEY_SECRET }]);
    const confirm = index(run, (event) => event.type === "settle");
    assert.ok(index(run, (event) => event.type === "put") < confirm && confirm < index(run, (event) => event.type === "delete"), "put, settled, then deleted");
    assert.ok(!run.worker.secrets.has(DEPLOYMENT_KEY_SECRET), "the Worker no longer holds the wrong key");
    assert.deepEqual(run.err(), [KEY_LINES.notOriginal]);
    assert.match(KEY_LINES.notOriginal, /so it was removed from the Worker again/);
    assert.ok(!run.out().includes(KEY_LINES.supplied));
    assert.ok(!run.events.some((event) => event.type === "setupState"));
  });

  it("Stored, supplied, mismatch, delete fails: put; delete tried once; the could-not-be-removed line naming the Worker, exit 1", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, deleteFails: true, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run, { deleted: true });
    assert.equal(run.puts().length, 1);
    assert.equal(run.deletes().length, 1, "the delete is tried once");
    assert.deepEqual(run.err(), [KEY_LINES.notRemoved("site-studio")]);
    assert.match(run.err()[0], /`wrangler secret delete DEPLOYMENT_KEY --name site-studio`/);
    assert.ok(!run.events.some((event) => event.type === "setupState"));
  });

  it("Rerun with the original after a removed key: list lacks it; state stored; the original put and matches; the supplied line", async () => {
    const worker = fakeWorker();
    const wrong = keyHarness({ worker, supplied: generateDeploymentKey(), keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] });
    assert.equal(await runDeploy(wrong.options), 1);
    assertNoLeak(wrong, { deleted: true });
    assert.ok(!worker.secrets.has(DEPLOYMENT_KEY_SECRET));
    const original = generateDeploymentKey();
    const rerun = keyHarness({ worker, supplied: original, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }] });
    assert.equal(await runDeploy(rerun.options), 0);
    assertNoLeak(rerun);
    assert.deepEqual(rerun.puts().map((event) => event.value), [original]);
    assert.ok(rerun.out().includes(KEY_LINES.supplied));
    assert.deepEqual(rerun.err(), []);
    assert.ok(worker.secrets.has(DEPLOYMENT_KEY_SECRET));
  });

  it("Stored, supplied, matches, through main's key-state builder: createKeyStateActions gives the first ask and the settled answer the same fetch and clock", async () => {
    const supplied = generateDeploymentKey();
    let clock = 0;
    const answers = [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "none" }];
    const urls = [];
    const actions = createKeyStateActions({
      fetchImpl: async (url) => { urls.push(url); return Response.json(answers.shift() ?? { fingerprint: "stored", key: "matches" }); },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
    });
    const run = keyHarness({ supplied, ...actions });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.puts().map((event) => event.value), [supplied]);
    // The first ask took the first reply at once; the settle saw two more `none`, then `matches`
    // from 6 s on, settling 60 s later on the 21st reply.
    assert.equal(urls.length, 1 + 2 + KEY_SETTLE_MIN_REPLIES);
    assert.equal(clock, 6_000 + KEY_SETTLE_MS);
    assert.ok(urls.every((url) => url === ADDRESS + "/api/v1/deployment-key/state"));
    assert.ok(run.out().includes(KEY_LINES.supplied));
    assert.deepEqual(run.err(), []);
  });

  it("Stored, supplied, matches, set-up open: SETUP_CODE is put only after the confirmation", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, setup: "open", keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }] });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    // The key write must have happened, once, with the supplied key, before its place is compared:
    // a missing write would index at -1 and pass the order check.
    const keyPuts = run.puts(DEPLOYMENT_KEY_SECRET);
    assert.equal(keyPuts.length, 1, "exactly one deployment-key write");
    assert.ok(keyPuts[0].value === supplied, "the deployment-key write carries the supplied key");
    const confirm = index(run, (event) => event.type === "settle");
    const keyPut = index(run, (event) => event.type === "put" && event.name === DEPLOYMENT_KEY_SECRET);
    const codePut = index(run, (event) => event.type === "put" && event.name === SETUP_CODE_SECRET);
    assert.ok(keyPut >= 0 && keyPut < confirm && confirm < codePut, "the key is put, confirmed, then the set-up code is put");
    assert.equal(run.puts(SETUP_CODE_SECRET).length, 1);
  });

  it("Key in list, supplied, fingerprint none: not put, not deleted; the kept and not-used lines, exit 0", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "none", key: "present" }] });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.puts(), []);
    assert.equal(run.events.filter((event) => event.type === "keyState").length, 1);
    assert.deepEqual(run.settles(), [], "nothing is compared, so nothing settles");
    assert.deepEqual(run.out().slice(0, 3), [KEY_LINES.oneAtATime, KEY_LINES.kept, KEY_LINES.notUsed]);
    assert.deepEqual(run.err(), []);
  });

  it("Key in list, supplied, matches: not put, not deleted; the kept and not-used lines, exit 0", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({
      supplied,
      worker: fakeWorker([DEPLOYMENT_KEY_SECRET]),
      keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }],
    });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.deepEqual(run.puts(), []);
    assert.equal(run.settles().length, 1);
    assert.deepEqual(run.out().slice(0, 4), [KEY_LINES.oneAtATime, KEY_LINES.checking, KEY_LINES.kept, KEY_LINES.notUsed]);
    assert.deepEqual(run.err(), []);
    assert.ok(run.events.some((event) => event.type === "setupState"), "the set-up steps follow");
  });

  it("Key in list, supplied, mismatch: not put, not deleted; the Worker's-key-is-not-the-original line naming the Worker, exit 1", async () => {
    const supplied = generateDeploymentKey();
    const run = keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "stored", key: "mismatch" }, { fingerprint: "stored", key: "mismatch" }] });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.deepEqual(run.puts(), []);
    assert.equal(run.settles().length, 1);
    assert.ok(run.worker.secrets.has(DEPLOYMENT_KEY_SECRET), "the Worker's key is left as it was");
    assert.deepEqual(run.out(), [KEY_LINES.oneAtATime, KEY_LINES.checking], "not the kept line");
    assert.deepEqual(run.err(), [KEY_LINES.workerKeyNotOriginal("site-studio")]);
    assert.ok(!run.events.some((event) => event.type === "setupState"));
  });

  it("Key in list, supplied, no answer: the real settle sees no settling state in time; not put, not deleted; the kept and Worker's-key-not-confirmed lines, exit 1", async () => {
    const supplied = generateDeploymentKey();
    let clock = 0;
    const run = keyHarness({
      supplied,
      worker: fakeWorker([DEPLOYMENT_KEY_SECRET]),
      ...createKeyStateActions({
        fetchImpl: async () => Response.json({ fingerprint: "stored", key: "none" }),
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
      }),
    });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.deepEqual(run.puts(), []);
    assert.deepEqual(run.out(), [KEY_LINES.oneAtATime, KEY_LINES.checking, KEY_LINES.kept]);
    assert.deepEqual(run.err(), [KEY_LINES.workerKeyNotConfirmed]);
    assert.equal(clock, KEY_SETTLE_TIMEOUT_MS, "it kept asking until the settle limit");

    // No readable first answer: the kept and not-confirmed lines, with no settle.
    const unreadable = keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [] });
    assert.equal(await runDeploy(unreadable.options), 1);
    assertNoLeak(unreadable);
    assert.deepEqual(unreadable.settles(), []);
    assert.deepEqual(unreadable.out(), [KEY_LINES.oneAtATime, KEY_LINES.kept]);
    assert.deepEqual(unreadable.err(), [KEY_LINES.workerKeyNotConfirmed]);
  });

  it("Supplied put fails, then rerun: the supplied-key may-or-may-not line, exit 1; the rerun finds it in the list, kept and not used, exit 0", async () => {
    const worker = fakeWorker();
    const supplied = generateDeploymentKey();
    const first = keyHarness({ worker, supplied, keyStates: [{ fingerprint: "none", key: "none" }], putFails: true, storeBeforeFailing: true });
    assert.equal(await runDeploy(first.options), 1);
    assertNoLeak(first);
    assert.equal(first.puts().length, 1);
    assert.deepEqual(first.err(), [KEY_LINES.suppliedPutFailed]);
    assert.ok(!first.out().includes(KEY_LINES.supplied));
    assert.ok(!first.events.some((event) => event.type === "setupState"));

    const rerun = keyHarness({ worker, supplied, keyStates: [{ fingerprint: "stored", key: "matches" }, { fingerprint: "stored", key: "matches" }] });
    assert.equal(await runDeploy(rerun.options), 0);
    assertNoLeak(rerun);
    assert.deepEqual(rerun.puts(), []);
    assert.deepEqual(rerun.out().slice(0, 4), [KEY_LINES.oneAtATime, KEY_LINES.checking, KEY_LINES.kept, KEY_LINES.notUsed]);

    // The same line when a fingerprint is stored: no confirmation is asked after a failed put.
    const stored = keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }], putFails: true });
    assert.equal(await runDeploy(stored.options), 1);
    assertNoLeak(stored);
    assert.deepEqual(stored.err(), [KEY_LINES.suppliedPutFailed]);
    assert.equal(stored.events.filter((event) => event.type === "keyState").length, 1);
    assert.deepEqual(stored.settles(), []);
    assert.ok(!stored.out().includes(KEY_LINES.checking));
  });

  it("Stored, supplied, no answer: the real settle never sees matches or mismatch in time; put; not deleted; the not-confirmed line, exit 1", async () => {
    const supplied = generateDeploymentKey();
    let clock = 0;
    const urls = [];
    const run = keyHarness({
      supplied,
      ...createKeyStateActions({
        fetchImpl: async (url) => { urls.push(url); return Response.json({ fingerprint: "stored", key: "none" }); },
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
      }),
    });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.equal(run.puts().length, 1);
    assert.deepEqual(run.err(), [KEY_LINES.notConfirmed]);
    assert.ok(run.worker.secrets.has(DEPLOYMENT_KEY_SECRET), "the key stays");
    assert.equal(clock, KEY_SETTLE_TIMEOUT_MS, "the settle kept asking until its limit");
    assert.ok(urls.every((url) => url === ADDRESS + "/api/v1/deployment-key/state"));
  });

  it("Stored, nothing supplied: nothing generated or put; the encrypted-values line, exit 1", async () => {
    const run = keyHarness({ keyStates: [{ fingerprint: "stored", key: "none" }], setup: "open" });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.deepEqual(run.generated, []);
    assert.deepEqual(run.puts(), []);
    assert.deepEqual(run.puts(SETUP_CODE_SECRET), []);
    assert.deepEqual(run.err(), [KEY_LINES.encryptedNoKey]);
  });

  it("State unreadable: a 404 then 200 { none, none } is retried and a key generated", async () => {
    let clock = 0;
    const answers = [new Response("nothing here", { status: 404 }), Response.json({ fingerprint: "none", key: "none" })];
    const run = keyHarness({
      askKeyState: (address) => waitForKeyState(address, {
        fetchImpl: async () => answers.shift(),
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
        timeoutMs: 60_000,
        retryMs: 1_000,
      }),
    });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.equal(clock, 1_000, "retried once");
    assert.equal(run.generated.length, 1);
    assert.deepEqual(run.puts().map((event) => event.value), run.generated);
  });

  it("State never readable: only 404s until the time limit; nothing generated or put; the state-unreadable line, exit 1", async () => {
    let clock = 0;
    const run = keyHarness({
      askKeyState: (address) => waitForKeyState(address, {
        fetchImpl: async () => new Response("nothing here", { status: 404 }),
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
        timeoutMs: 5_000,
        retryMs: 1_000,
      }),
    });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.deepEqual(run.generated, []);
    assert.deepEqual(run.puts(), []);
    assert.deepEqual(run.err(), [`${ADDRESS}/api/v1/deployment-key/state did not say whether this installation holds encrypted values, so no deployment key was generated or supplied. Run the command again.`]);
  });

  it("Listing fails: listSecrets throws, or Wrangler prints no JSON array; nothing generated or put, exit 1 with the line", async () => {
    const thrown = keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }] });
    thrown.options.listSecrets = async () => { throw new Error("wrangler secret exited with 1."); };
    assert.equal(await runDeploy(thrown.options), 1);
    assertNoLeak(thrown);
    assert.deepEqual(thrown.generated, []);
    assert.deepEqual(thrown.puts(), []);
    assert.deepEqual(thrown.err(), [KEY_LINES.listingFailed]);

    const fake = fakeSpawn({ listOutput: "[WARNING] You are not logged in.\nNothing to show\n" });
    const actions = createWranglerActions("/repo", { outputDir: "/unused", env: {}, spawnImpl: fake.spawn });
    const noArray = keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }] });
    noArray.options.listSecrets = actions.listSecrets;
    assert.equal(await runDeploy(noArray.options), 1);
    assertNoLeak(noArray);
    assert.deepEqual(noArray.generated, []);
    assert.deepEqual(noArray.puts(), []);
    assert.deepEqual(noArray.err(), [KEY_LINES.listingFailed]);
  });

  it("No Worker name: the deploy reports none and set-up is closed; nothing listed, generated or put, exit 1", async () => {
    const run = keyHarness({ workerName: null, keyStates: [{ fingerprint: "none", key: "none" }], setup: "closed" });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.ok(!run.events.some((event) => event.type === "list" || event.type === "keyState" || event.type === "setupState"));
    assert.deepEqual(run.generated, []);
    assert.deepEqual(run.puts(), []);
    assert.match(run.err().join("\n"), /Worker's name/);
  });

  it("Child environment: SITE_SURVEY_DEPLOYMENT_KEY is absent from every Wrangler child's environment (deploy, listing, both puts, delete)", async () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), "site-survey-deploy-test-"));
    try {
      const supplied = generateDeploymentKey();
      const env = { PATH: "/usr/bin", [DEPLOYMENT_KEY_ENV]: supplied, site_survey_deployment_key: supplied };
      const fake = fakeSpawn({ listOutput: JSON.stringify([{ name: SETUP_CODE_SECRET, type: "secret_text" }], null, "  ") + "\n" });
      const actions = createWranglerActions("/repo", { outputDir, env, spawnImpl: fake.spawn });
      const run = keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" });
      Object.assign(run.options, { env, deploy: actions.deploy, listSecrets: actions.listSecrets, putSecret: actions.putSecret });
      assert.equal(await runDeploy(run.options), 0);
      assertNoLeak(run);
      const kinds = fake.children.map((child) => child.args.slice(1, 3).join(" "));
      assert.deepEqual(kinds, ["deploy", "secret list", "secret put", "secret put"]);
      for (const child of fake.children) {
        const names = Object.keys(child.options.env).map((name) => name.toUpperCase());
        assert.ok(!names.includes(DEPLOYMENT_KEY_ENV), `${child.args.slice(1, 3).join(" ")} received the key's variable`);
        assert.ok(!Object.values(child.options.env).includes(supplied));
        assert.ok(!child.args.some((arg) => arg.includes(supplied)), "no key on a command line");
        assert.equal(child.options.env.PATH, "/usr/bin", "the rest of the environment is passed on");
      }
      assert.ok(fake.children[0].options.env.WRANGLER_OUTPUT_FILE_PATH, "the deploy still gets its output file");
      const keyPut = fake.children[2];
      assert.deepEqual(keyPut.args.slice(1), ["secret", "put", DEPLOYMENT_KEY_SECRET, "--name", "site-studio"]);
      assert.equal(keyPut.input, supplied, "the key goes on standard input only");
      assert.equal(fake.children[1].options.stdio[1], "pipe", "the listing's standard output is captured");
      assert.equal(fake.children[1].options.stdio[2], "inherit", "the listing's errors reach the operator");

      // A second run whose supplied key the key state reports as a mismatch: the delete child too.
      const deleting = fakeSpawn({ listOutput: "[]\n" });
      const deleteActions = createWranglerActions("/repo", { outputDir, env, spawnImpl: deleting.spawn });
      const mismatch = keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] });
      Object.assign(mismatch.options, { env, deploy: deleteActions.deploy, listSecrets: deleteActions.listSecrets, putSecret: deleteActions.putSecret, deleteSecret: deleteActions.deleteSecret });
      assert.equal(await runDeploy(mismatch.options), 1);
      assertNoLeak(mismatch, { deleted: true });
      assert.deepEqual(deleting.children.map((child) => child.args.slice(1, 3).join(" ")), ["deploy", "secret list", "secret put", "secret delete"]);
      for (const child of deleting.children) {
        assert.ok(!Object.keys(child.options.env).map((name) => name.toUpperCase()).includes(DEPLOYMENT_KEY_ENV), `${child.args.slice(1, 3).join(" ")} received the key's variable`);
        assert.ok(!Object.values(child.options.env).includes(supplied));
        assert.ok(!child.args.some((arg) => arg.includes(supplied)), "no key on a command line");
      }
      const deleteChild = deleting.children[3];
      assert.deepEqual(deleteChild.args.slice(1), ["secret", "delete", DEPLOYMENT_KEY_SECRET, "--name", "site-studio"]);
      assert.equal(deleteChild.input, "", "standard input is piped and ended, so Wrangler does not ask");
      assert.equal(deleteChild.options.stdio[0], "pipe");
      assert.deepEqual(mismatch.err(), [KEY_LINES.notOriginal]);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it("Two runs: the second run's list holds the key, so the key is printed only by the first", async () => {
    const worker = fakeWorker();
    const first = keyHarness({ worker, keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" });
    assert.equal(await runDeploy(first.options), 0);
    const second = keyHarness({ worker, keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" });
    assert.equal(await runDeploy(second.options), 0);
    assertNoLeak(first);
    assertNoLeak(second);
    assert.equal(first.generated.length, 1);
    assert.deepEqual(second.generated, []);
    assert.deepEqual(second.puts(), []);
    assert.equal(occurrences(second.out(), first.generated[0]), 0);
    assert.ok(!second.out().some((line) => line.startsWith("  Deployment key:")));
    assert.ok(second.out().includes(KEY_LINES.kept));
  });

  it("Output: every run prints the one-deploy-at-a-time line first, and a key only on its one printed line, never in errors", async () => {
    const supplied = generateDeploymentKey();
    // Each row with the exit code it must give.
    const table = [
      [keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" }), 0],
      [keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }], putFails: true }), 1],
      [keyHarness({ worker: fakeWorker([DEPLOYMENT_KEY_SECRET]) }), 0],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }] }), 0],
      [keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "none", key: "present" }] }), 0],
      [keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "stored", key: "matches" }, { fingerprint: "stored", key: "matches" }] }), 0],
      [keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [{ fingerprint: "stored", key: "mismatch" }, { fingerprint: "stored", key: "mismatch" }] }), 1],
      [keyHarness({ supplied, worker: fakeWorker([DEPLOYMENT_KEY_SECRET]), keyStates: [] }), 1],
      [keyHarness({ supplied: supplied.slice(1) }), 1],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "matches" }] }), 0],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] }), 1, { deleted: true }],
      [keyHarness({ supplied, deleteFails: true, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] }), 1, { deleted: true }],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }] }), 1],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }], putFails: true }), 1],
      [keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }], putFails: true }), 1],
      [keyHarness({ keyStates: [{ fingerprint: "stored", key: "none" }] }), 1],
      [keyHarness({ keyStates: [] }), 1],
      [keyHarness({ workerName: null }), 1],
    ];
    // A row marked `{ deleted: true }` is one of the two mismatch rows, the only ones that delete.
    for (const [number, [run, exit, { deleted = false } = {}]] of table.entries()) {
      assert.equal(await runDeploy(run.options), exit, `row ${number} exits ${exit}`);
      assertNoLeak(run, { deleted });
      if (deleted) assert.equal(run.deletes().length, 1, `row ${number} deletes once`);
    }
    assert.equal(table.filter(([, , marks]) => marks?.deleted).length, 2, "two deleting rows");
    assert.equal(table[0][0].generated.length + table[1][0].generated.length, 2, "the two generating rows each generated one key");
  });

  it("main's options: createMainOptions with a supplied key and fingerprint none puts that key, generates nothing, exit 0", async () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), "site-survey-deploy-test-"));
    try {
      const supplied = generateDeploymentKey();
      const fake = fakeSpawn({ listOutput: "[]\n" });
      const urls = [];
      const out = [];
      const err = [];
      let clock = 0;
      const options = createMainOptions({
        root: "/repo",
        outputDir,
        env: { PATH: "/usr/bin", [DEPLOYMENT_KEY_ENV]: supplied },
        spawnImpl: fake.spawn,
        fetchImpl: async (url) => {
          urls.push(url);
          return url.endsWith("/api/v1/deployment-key/state") ? Response.json({ fingerprint: "none", key: "none" }) : Response.json({ state: "closed" });
        },
        sleep: async (ms) => { clock += ms; },
        now: () => clock,
        print: (line) => out.push(line),
        printError: (line) => err.push(line),
      });
      assert.equal(await runDeploy(options), 0);
      assert.deepEqual(fake.children.map((child) => child.args.slice(1, 4).join(" ")), ["deploy", "secret list --name", "secret put DEPLOYMENT_KEY"]);
      assert.equal(fake.children[2].input, supplied, "the supplied key is the value put");
      assert.deepEqual(urls, [ADDRESS + "/api/v1/deployment-key/state", ADDRESS + "/api/v1/setup/state"]);
      assert.ok(!out.some((line) => line.startsWith("  Deployment key:")), "nothing generated or printed");
      assert.equal(occurrences([...out, ...err], supplied), 0, "the supplied key is never printed");
      assert.deepEqual(out, [KEY_LINES.oneAtATime, KEY_LINES.supplied, `Deployed to ${ADDRESS}. Set-up is already complete, so no set-up code was issued.`]);
      assert.deepEqual(err, []);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it("Wrangler closing with a non-zero code: a supplied put, a generated put and the delete after a settled mismatch each give their own line, exit 1 (the last two after an EPIPE on standard input)", async () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), "site-survey-deploy-test-"));
    const failing = (command) => (args) => (args.slice(0, 3).join(" ") === command ? 1 : 0);
    const withWrangler = (run, closeCode, stdinError) => {
      const fake = fakeSpawn({ closeCode, stdinError });
      const actions = createWranglerActions("/repo", { outputDir, env: {}, spawnImpl: fake.spawn });
      Object.assign(run.options, { deploy: actions.deploy, listSecrets: actions.listSecrets, putSecret: actions.putSecret, deleteSecret: actions.deleteSecret });
      return fake;
    };
    try {
      const supplied = generateDeploymentKey();
      const suppliedRun = keyHarness({ supplied, keyStates: [{ fingerprint: "none", key: "none" }] });
      withWrangler(suppliedRun, failing("secret put DEPLOYMENT_KEY"));
      assert.equal(await runDeploy(suppliedRun.options), 1);
      assertNoLeak(suppliedRun);
      assert.deepEqual(suppliedRun.err(), [KEY_LINES.suppliedPutFailed]);

      const generatedRun = keyHarness({ keyStates: [{ fingerprint: "none", key: "none" }], setup: "open" });
      // An EPIPE on the child's standard input does not crash the command: the exit code decides.
      withWrangler(generatedRun, failing("secret put DEPLOYMENT_KEY"), failing("secret put DEPLOYMENT_KEY"));
      assert.equal(await runDeploy(generatedRun.options), 1);
      assertNoLeak(generatedRun);
      assert.equal(generatedRun.generated.length, 1);
      assert.deepEqual(generatedRun.err(), [KEY_LINES.putFailed]);

      const deleteRun = keyHarness({ supplied, keyStates: [{ fingerprint: "stored", key: "none" }, { fingerprint: "stored", key: "mismatch" }] });
      const deleting = withWrangler(deleteRun, failing("secret delete DEPLOYMENT_KEY"), failing("secret delete DEPLOYMENT_KEY"));
      assert.equal(await runDeploy(deleteRun.options), 1);
      assertNoLeak(deleteRun, { deleted: true });
      assert.deepEqual(deleting.children.map((child) => child.args.slice(1, 3).join(" ")), ["deploy", "secret list", "secret put", "secret delete"]);
      assert.deepEqual(deleteRun.err(), [KEY_LINES.notRemoved("site-studio")]);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});

// The orchestrator ruling on stale replies (2026-11-22): a decision against the stored fingerprint
// rests only on a settled answer. These rows run the real `waitForSettledKeyState` through
// `createKeyStateActions`, against a fake route that answers by a fake clock.
const MATCHES = { fingerprint: "stored", key: "matches" };
const MISMATCH = { fingerprint: "stored", key: "mismatch" };

/**
 * A run with the real key-state steps: the first request answers `first`; every later request
 * answers `settleReply(t)` (a reply, a Response or an Error), t being the fake clock's time, which
 * `sleep` advances. Every event of the run carries the clock's time.
 */
function settleRun({ inList = false, first = { fingerprint: "stored", key: "none" }, settleReply }) {
  let clock = 0;
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    if (requests === 1) return Response.json(first);
    const reply = settleReply(clock);
    if (reply instanceof Error) throw reply;
    return reply instanceof Response ? reply : Response.json(reply);
  };
  const run = keyHarness({
    supplied: generateDeploymentKey(),
    worker: fakeWorker(inList ? [DEPLOYMENT_KEY_SECRET] : []),
    now: () => clock,
    ...createKeyStateActions({ fetchImpl, sleep: async (ms) => { clock += ms; }, now: () => clock }),
  });
  return { run, clock: () => clock };
}

/** Replies that alternate between mismatch and matches on each 3-second request. */
const alternating = (t) => (Math.floor(t / 3_000) % 2 === 0 ? MISMATCH : MATCHES);

describe("the deploy command's settled answer (orchestrator ruling on stale replies)", () => {
  it("Settle: flip within the window: mismatch for 30 s, then matches steadily; settles on matches; nothing deleted; the supplied line", async () => {
    const { run, clock } = settleRun({ settleReply: (t) => (t < 30_000 ? MISMATCH : MATCHES) });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.equal(run.puts().length, 1);
    assert.ok(run.out().includes(KEY_LINES.checking));
    assert.ok(run.out().includes(KEY_LINES.supplied));
    assert.deepEqual(run.err(), []);
    assert.equal(clock(), 30_000 + KEY_SETTLE_MS, "settled 60 s after the first matches");
  });

  it("Settle: 59 seconds then a change: mismatch until 59 s, then matches steadily; the window restarts; settles on matches; nothing deleted", async () => {
    const { run, clock } = settleRun({ settleReply: (t) => (t < 59_000 ? MISMATCH : MATCHES) });
    assert.equal(await runDeploy(run.options), 0);
    assertNoLeak(run);
    assert.ok(run.out().includes(KEY_LINES.supplied));
    assert.deepEqual(run.err(), []);
    assert.equal(clock(), 60_000 + KEY_SETTLE_MS, "the 60 seconds restarted at the first matches, at 60 s");
  });

  it("Settle: steady mismatch: deleted once, after the 60-second window, not before; the removed-again line, exit 1", async () => {
    const { run } = settleRun({ settleReply: () => MISMATCH });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run, { deleted: true });
    const deletes = run.deletes();
    assert.equal(deletes.length, 1);
    const steadyFrom = run.settles()[0].at;
    assert.ok(deletes[0].at - steadyFrom >= KEY_SETTLE_MS, "the delete comes only after 60 s of steady mismatch");
    assert.equal(deletes[0].at, KEY_SETTLE_MS);
    assert.deepEqual(run.err(), [KEY_LINES.notOriginal]);
  });

  it("Settle: alternating to the limit: mismatch and matches alternating until 180 s; not confirmed; nothing deleted, exit 1", async () => {
    const { run, clock } = settleRun({ settleReply: alternating });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run);
    assert.equal(run.puts().length, 1, "the key stays");
    assert.deepEqual(run.err(), [KEY_LINES.notConfirmed]);
    assert.equal(clock(), KEY_SETTLE_TIMEOUT_MS);
  });

  it("Settle: unreadable reply restarts: mismatch, a 404 at 40 s, then mismatch; deleted only 60 s after the next readable reply, exit 1", async () => {
    // Requests come every 3 s, so the one at 42 s is the 404 and the run restarts at 45 s.
    const { run } = settleRun({ settleReply: (t) => (t >= 40_000 && t < 43_000 ? new Response("nothing here", { status: 404 }) : MISMATCH) });
    assert.equal(await runDeploy(run.options), 1);
    assertNoLeak(run, { deleted: true });
    const [deleted] = run.deletes();
    assert.equal(run.deletes().length, 1);
    assert.ok(deleted.at >= 45_000 + KEY_SETTLE_MS, "not before 60 s after the first readable reply after the 404");
    assert.equal(deleted.at, 45_000 + KEY_SETTLE_MS);
    assert.deepEqual(run.err(), [KEY_LINES.notOriginal]);
  });

  it("Settle in rule 3: key in list, supplied, stored: flip and change settle on matches, steady mismatch says not the original only after the window, alternating is not confirmed; never a put or delete", async () => {
    const cases = [
      { name: "flip", reply: (t) => (t < 30_000 ? MISMATCH : MATCHES), exit: 0 },
      { name: "change", reply: (t) => (t < 59_000 ? MISMATCH : MATCHES), exit: 0 },
      { name: "steady mismatch", reply: () => MISMATCH, exit: 1 },
      { name: "alternating", reply: alternating, exit: 1 },
    ];
    for (const { name, reply, exit } of cases) {
      const { run, clock } = settleRun({ inList: true, settleReply: reply });
      assert.equal(await runDeploy(run.options), exit, name);
      assertNoLeak(run);
      assert.deepEqual(run.puts(), [], `${name}: never a put`);
      assert.ok(run.worker.secrets.has(DEPLOYMENT_KEY_SECRET), `${name}: the Worker's key stays`);
      assert.equal(run.out()[1], KEY_LINES.checking, `${name}: the checking line before the settle`);
      if (name === "flip" || name === "change") {
        assert.deepEqual(run.out().slice(0, 4), [KEY_LINES.oneAtATime, KEY_LINES.checking, KEY_LINES.kept, KEY_LINES.notUsed], name);
        assert.deepEqual(run.err(), [], name);
      } else if (name === "steady mismatch") {
        assert.deepEqual(run.out(), [KEY_LINES.oneAtATime, KEY_LINES.checking], name);
        assert.deepEqual(run.err(), [KEY_LINES.workerKeyNotOriginal("site-studio")], name);
        const said = run.events.find((event) => event.type === "err");
        assert.ok(said.at >= KEY_SETTLE_MS, "the not-the-original line only after the window");
      } else {
        assert.deepEqual(run.out(), [KEY_LINES.oneAtATime, KEY_LINES.checking, KEY_LINES.kept], name);
        assert.deepEqual(run.err(), [KEY_LINES.workerKeyNotConfirmed], name);
        assert.equal(clock(), KEY_SETTLE_TIMEOUT_MS, name);
      }
    }
  });
});

describe("deployment key helpers", () => {
  it("generates 43 base64url characters from 32 random bytes", () => {
    const seen = [];
    const key = generateDeploymentKey((size) => { seen.push(size); return Buffer.alloc(size, 7); });
    assert.deepEqual(seen, [32]);
    assert.equal(key, Buffer.alloc(32, 7).toString("base64url"));
    const keys = new Set(Array.from({ length: 50 }, () => generateDeploymentKey()));
    assert.equal(keys.size, 50);
    for (const each of keys) {
      assert.match(each, /^[A-Za-z0-9_-]{43}$/);
      assert.ok(isDeploymentKey(each));
    }
    assert.equal(isDeploymentKey(""), false);
    assert.equal(isDeploymentKey(undefined), false);
  });

  it("accepts only a key-state reply that is exactly { fingerprint, key } with known values", () => {
    assert.deepEqual(parseKeyState({ fingerprint: "none", key: "present" }), { fingerprint: "none", key: "present" });
    assert.deepEqual(parseKeyState({ key: "matches", fingerprint: "stored" }), { fingerprint: "stored", key: "matches" });
    assert.equal(parseKeyState({ fingerprint: "stored", key: "matches", value: "x" }), null);
    assert.equal(parseKeyState({ fingerprint: "maybe", key: "none" }), null);
    assert.equal(parseKeyState({ fingerprint: "none", key: "absent" }), null);
    assert.equal(parseKeyState({ fingerprint: "none" }), null);
    assert.equal(parseKeyState(null), null);
    assert.equal(parseKeyState([]), null);
  });

  it("reads the secret names from Wrangler's JSON listing, skipping a [WARNING] line, and refuses anything else", () => {
    const listing = JSON.stringify([{ name: "SETUP_CODE", type: "secret_text" }, { name: "DEPLOYMENT_KEY", type: "secret_text" }], null, "  ");
    assert.deepEqual(parseSecretList(listing), ["SETUP_CODE", "DEPLOYMENT_KEY"]);
    assert.deepEqual(parseSecretList(`[WARNING] Something [odd] happened\n${listing}\n`), ["SETUP_CODE", "DEPLOYMENT_KEY"]);
    assert.deepEqual(parseSecretList("[]"), []);
    assert.deepEqual(parseSecretList(JSON.stringify([{ name: "A]B", type: "secret_text" }])), ["A]B"]);
    assert.equal(parseSecretList(""), null);
    assert.equal(parseSecretList("no listing here"), null);
    assert.equal(parseSecretList("[1, 2]"), null);
    assert.equal(parseSecretList(JSON.stringify([{ type: "secret_text" }])), null);
    assert.equal(parseSecretList(JSON.stringify([{ name: 5 }])), null);
    assert.equal(parseSecretList(undefined), null);
  });

  it("copies an environment without SITE_SURVEY_DEPLOYMENT_KEY in any letter case", () => {
    const env = { PATH: "/bin", SITE_SURVEY_DEPLOYMENT_KEY: "a", Site_Survey_Deployment_Key: "b", OTHER: "c" };
    assert.deepEqual(childEnvironment(env), { PATH: "/bin", OTHER: "c" });
    assert.ok("SITE_SURVEY_DEPLOYMENT_KEY" in env, "the original is unchanged");
  });

  it("asks the key-state route until it answers an exact key state, and gives up at the deadline", async () => {
    let clock = 0;
    const answers = [new Error("not reachable"), new Response("nothing here", { status: 404 }), Response.json({ fingerprint: "stored", key: "matches" })];
    const found = await waitForKeyState("https://a.test", {
      fetchImpl: async (url, init) => {
        assert.equal(url, "https://a.test/api/v1/deployment-key/state");
        assert.ok(init.signal instanceof AbortSignal, "each request has a time limit");
        const next = answers.shift();
        if (next instanceof Error) throw next;
        return next;
      },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
      timeoutMs: 60_000,
      retryMs: 1_000,
    });
    assert.deepEqual(found, { fingerprint: "stored", key: "matches" });
    assert.equal(clock, 2_000);

    clock = 0;
    const never = await waitForKeyState("https://a.test", {
      fetchImpl: async () => Response.json({ fingerprint: "none", key: "none", extra: true }),
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
      timeoutMs: 5_000,
      retryMs: 1_000,
    });
    assert.equal(never, null);
  });

  it("settles only on the same answer over 60 s and at least 21 replies (60 s at 3 s, counting both ends)", async () => {
    assert.equal(KEY_SETTLE_MS, 60_000);
    assert.equal(KEY_SETTLE_TIMEOUT_MS, 180_000);
    assert.equal(KEY_SETTLE_MIN_REPLIES, 21);
    let clock = 0;
    let requests = 0;
    const settled = await waitForSettledKeyState("https://a.test", {
      fetchImpl: async (url, init) => {
        assert.equal(url, "https://a.test/api/v1/deployment-key/state");
        assert.ok(init.signal instanceof AbortSignal, "each request has a time limit");
        requests += 1;
        return Response.json(MATCHES);
      },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
    });
    assert.deepEqual(settled, MATCHES);
    assert.equal(requests, 21);
    assert.equal(clock, 60_000);

    // A `fingerprint: "none"` or `present` reply is not an answer and restarts the run.
    clock = 0;
    const replies = [MATCHES, { fingerprint: "none", key: "present" }];
    const restarted = await waitForSettledKeyState("https://a.test", {
      fetchImpl: async () => Response.json(replies.shift() ?? MATCHES),
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
    });
    assert.deepEqual(restarted, MATCHES);
    assert.equal(clock, 6_000 + 60_000);
  });

  it("does not settle on fewer than 21 replies over 60 s (slow requests)", async () => {
    let clock = 0;
    let requests = 0;
    const settled = await waitForSettledKeyState("https://a.test", {
      // Each request takes 10 s, so a reply comes every 13 s: 60 s are spanned, but never with 21 replies.
      fetchImpl: async () => { requests += 1; clock += 10_000; return Response.json(MISMATCH); },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
    });
    assert.equal(settled, null);
    assert.ok(requests < KEY_SETTLE_MIN_REPLIES, `${requests} replies`);
    // It waited until no further request could start within the limit (review round 2: no request
    // starts after it), not past it.
    assert.ok(clock + STATE_RETRY_MS > KEY_SETTLE_TIMEOUT_MS && clock <= KEY_SETTLE_TIMEOUT_MS, `stopped at ${clock}`);
  });

  it("does not settle on a single reply followed by 60 s of failed requests", async () => {
    let clock = 0;
    let requests = 0;
    const settled = await waitForSettledKeyState("https://a.test", {
      fetchImpl: async () => {
        requests += 1;
        if (requests === 1) return Response.json(MISMATCH);
        throw new Error("not reachable");
      },
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
    });
    assert.equal(settled, null);
    assert.equal(clock, KEY_SETTLE_TIMEOUT_MS);
  });
});
