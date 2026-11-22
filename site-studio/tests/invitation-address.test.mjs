import assert from "node:assert/strict";
import { test } from "node:test";

const SECRET = "aB_0-".repeat(8) + "xyz";

// Import a fresh instance to model loading a new document, with just the browser APIs it uses.
async function loadAddress(t, { pathname, hash }) {
  const state = { entry: "keep this history state" };
  const location = { pathname, hash, reload: t.mock.fn() };
  const history = { state, replaceState: t.mock.fn((_state, _title, url) => {
    const next = new URL(url, "https://survey.example");
    location.hash = next.hash;
    location.pathname = next.pathname;
  }) };
  const window = new EventTarget();
  for (const [key, value] of Object.entries({ location, history, window })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else delete globalThis[key];
    });
  }
  const address = await import(`../src/admin/invitationAddress.js?${encodeURIComponent(t.name)}`);
  return { ...address, location, history, window };
}

test("loading an invitation captures its fragment and keeps the current history state", async (t) => {
  const { invitationSecret, location, history, window } = await loadAddress(t, { pathname: "/invite/", hash: "#" + SECRET });
  assert.equal(invitationSecret(), SECRET);
  assert.equal(location.hash, "");
  assert.deepEqual(history.replaceState.mock.calls.map(({ arguments: args }) => args), [[history.state, "", "/invite/"]]);

  location.hash = "#" + "b".repeat(43);
  window.dispatchEvent(new Event("hashchange"));
  assert.equal(location.reload.mock.callCount(), 1);
});

test("loading the invitation page without a fragment has no secret or reload loop", async (t) => {
  const { invitationSecret, location, window } = await loadAddress(t, { pathname: "/invite", hash: "" });
  assert.equal(invitationSecret(), null);
  window.dispatchEvent(new Event("hashchange"));
  assert.equal(location.reload.mock.callCount(), 0);
});

test("an invite-like path leaves a fragment for the page that owns it", async (t) => {
  const { invitationSecret, location, history, window } = await loadAddress(t, { pathname: "/invite/preview", hash: "#preview" });
  assert.equal(invitationSecret(), null);
  assert.equal(location.hash, "#preview");
  assert.equal(history.replaceState.mock.callCount(), 0);
  window.dispatchEvent(new Event("hashchange"));
  assert.equal(location.reload.mock.callCount(), 0);
});
