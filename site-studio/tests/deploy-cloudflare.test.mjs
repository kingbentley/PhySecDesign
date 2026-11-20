// The Cloudflare deploy command (story 1.2, CAP-1), with Wrangler and the network stubbed.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chooseAddress,
  generateSetupCode,
  parseDeployArgs,
  parseSetupState,
  readDeployOutput,
  runDeploy,
  SETUP_CODE_ALPHABET,
  SETUP_CODE_SECRET,
  waitForSetupState,
  wranglerDeployArgs,
} from "../scripts/deploy-cloudflare.mjs";

function harness({ state, targets = ["https://site-studio.example.workers.dev"], workerName = "site-studio" }) {
  const calls = { deploy: 0, asked: [], secrets: [], out: [], err: [] };
  const options = {
    deploy: async () => {
      calls.deploy += 1;
      return { workerName, targets };
    },
    askState: async (address) => {
      calls.asked.push(address);
      return state;
    },
    putSecret: async (worker, name, value) => {
      calls.secrets.push({ worker, name, value });
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
    assert.deepEqual(calls.out, []);
    assert.match(calls.err.join("\n"), /\/api\/v1\/setup\/state/);
  });

  it("asks the --url address instead of Wrangler's, and refuses one that is not https", async () => {
    const custom = harness({ state: "closed" });
    await runDeploy({ ...custom.options, url: "https://survey.example.com/some/path" });
    assert.deepEqual(custom.calls.asked, ["https://survey.example.com"]);

    const plain = harness({ state: "open", targets: ["http://site-studio.example.workers.dev"] });
    assert.equal(await runDeploy(plain.options), 1);
    assert.deepEqual(plain.calls.asked, []);
    assert.deepEqual(plain.calls.secrets, []);
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
    assert.equal(chooseAddress(["http://x.test", "https://a.workers.dev/"]), "https://a.workers.dev");
    assert.equal(chooseAddress([]), null);
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
