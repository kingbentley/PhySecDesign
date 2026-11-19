// Throwaway Worker for the experiments that need Cloudflare's hosted platform:
// R9 (password-hashing cost) and the Cloudflare half of R13 (SMTP over outbound sockets).
import { connect } from "cloudflare:sockets";
import nodeCrypto from "node:crypto";

const enc = new TextEncoder(), dec = new TextDecoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function pbkdf2(iterations, hash) {
  const key = await crypto.subtle.importKey("raw", enc.encode("correct horse battery staple"), "PBKDF2", false, ["deriveBits"]);
  const t0 = Date.now();
  try {
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash, salt: enc.encode("0123456789abcdef"), iterations }, key, 256);
    return { ok: true, iterations, hash, wallMs: Date.now() - t0, firstBytes: hex(bits).slice(0, 16) };
  } catch (e) {
    return { ok: false, iterations, hash, wallMs: Date.now() - t0, error: String(e) };
  }
}

// Ways round the platform's limit of 100,000 PBKDF2 iterations per call (found by R9).
async function chained(rounds, hash) {
  // PBKDF2 run several times, each run keyed by the password and salted with the previous output.
  const key = await crypto.subtle.importKey("raw", enc.encode("correct horse battery staple"), "PBKDF2", false, ["deriveBits"]);
  let salt = enc.encode("0123456789abcdef");
  try {
    for (let i = 0; i < rounds; i++) salt = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash, salt, iterations: 100000 }, key, 256));
    return { ok: true, method: `PBKDF2 ${hash} x ${rounds} calls of 100,000`, firstBytes: hex(salt).slice(0, 16) };
  } catch (e) { return { ok: false, method: "chained", rounds, error: String(e) }; }
}
function viaNode(method, n) {
  try {
    const out = method === "scrypt"
      ? nodeCrypto.scryptSync("correct horse battery staple", "0123456789abcdef", 32, { N: n, r: 8, p: 1, maxmem: 256 * 1024 * 1024 })
      : nodeCrypto.pbkdf2Sync("correct horse battery staple", "0123456789abcdef", n, 32, "sha256");
    return { ok: true, method: `node:crypto ${method}`, n, firstBytes: out.toString("hex").slice(0, 16) };
  } catch (e) { return { ok: false, method: `node:crypto ${method}`, n, error: String(e) }; }
}

// Talks SMTP as far as it can without an account: greeting, EHLO, optional STARTTLS, EHLO again, QUIT. Sends nothing.
async function smtpProbe(host, port, mode) {
  const log = [];
  let socket = connect({ hostname: host, port }, { secureTransport: mode === "tls" ? "on" : mode === "starttls" ? "starttls" : "off" });
  await socket.opened;
  let reader = socket.readable.getReader(), writer = socket.writable.getWriter(), buf = "";
  const reply = async () => {
    for (;;) {
      const lines = buf.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) if (/^\d{3} /.test(lines[i])) {
        const out = lines.slice(0, i + 1); buf = lines.slice(i + 1).join("\r\n");
        log.push("S: " + out.map((l) => l.slice(0, 80)).join(" / ")); return Number(out[i].slice(0, 3));
      }
      const { value, done } = await reader.read();
      if (done) throw new Error("connection closed");
      buf += dec.decode(value, { stream: true });
    }
  };
  const cmd = async (line) => { log.push("C: " + line); await writer.write(enc.encode(line + "\r\n")); return reply(); };
  await reply();
  await cmd("EHLO site-studio.test");
  if (mode === "starttls") {
    const code = await cmd("STARTTLS");
    if (code !== 220) throw new Error("STARTTLS refused: " + code);
    reader.releaseLock(); writer.releaseLock();
    socket = socket.startTls(); await socket.opened;
    reader = socket.readable.getReader(); writer = socket.writable.getWriter(); buf = "";
    log.push("-- TLS started --");
    await cmd("EHLO site-studio.test");
  }
  await cmd("QUIT");
  await socket.close().catch(() => {});
  return log;
}

export default {
  async fetch(req) {
    const url = new URL(req.url), q = url.searchParams;
    if (url.pathname === "/pbkdf2") return Response.json(await pbkdf2(Number(q.get("iter") ?? 600000), q.get("hash") ?? "SHA-256"));
    if (url.pathname === "/chained") return Response.json(await chained(Number(q.get("rounds") ?? 6), q.get("hash") ?? "SHA-256"));
    if (url.pathname === "/node") return Response.json(viaNode(q.get("method"), Number(q.get("n"))));
    if (url.pathname === "/smtp") {
      const t0 = Date.now();
      try { return Response.json({ ok: true, log: await smtpProbe(q.get("host"), Number(q.get("port")), q.get("mode")), ms: Date.now() - t0 }); }
      catch (e) { return Response.json({ ok: false, error: String(e), ms: Date.now() - t0 }); }
    }
    return Response.json({ worker: "site-studio-experiments", routes: ["/pbkdf2?iter=&hash=", "/chained?rounds=&hash=", "/node?method=pbkdf2|scrypt&n=", "/smtp?host=&port=&mode=tls|starttls|plain"] });
  },
};
