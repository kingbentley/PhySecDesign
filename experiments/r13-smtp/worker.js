// R13 experiment worker: a minimal SMTP client over the runtime's outbound TCP sockets.
import { connect } from "cloudflare:sockets";

const enc = new TextEncoder(), dec = new TextDecoder();

// Reads one SMTP reply (possibly several lines: "250-..." continues, "250 ..." ends).
function lineReader(socket) {
  const reader = socket.readable.getReader();
  let buf = "";
  return {
    async reply() {
      for (;;) {
        const lines = buf.split("\r\n");
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^\d{3} /.test(lines[i])) {
            const out = lines.slice(0, i + 1); buf = lines.slice(i + 1).join("\r\n");
            return { code: Number(out[i].slice(0, 3)), lines: out };
          }
        }
        const { value, done } = await reader.read();
        if (done) throw new Error("connection closed; had: " + JSON.stringify(buf));
        buf += dec.decode(value, { stream: true });
      }
    },
    release() { reader.releaseLock(); },
  };
}

async function send({ host, port, mode, user, pass, from, to, subject, body }) {
  const log = [];
  let socket = connect({ hostname: host, port }, { secureTransport: mode === "tls" ? "on" : mode === "starttls" ? "starttls" : "off" });
  await socket.opened.catch((e) => { throw new Error("could not connect: " + (e?.message ?? e)); });
  let r = lineReader(socket), w = socket.writable.getWriter();
  const expect = async (want, what) => {
    const rep = await r.reply(); log.push(`S: ${rep.lines.join(" / ")}`);
    if (rep.code !== want) throw new Error(`${what}: expected ${want}, got ${rep.lines.join(" / ")}`);
    return rep;
  };
  const cmd = async (line, want, shown = line) => { log.push(`C: ${shown}`); await w.write(enc.encode(line + "\r\n")); return expect(want, shown); };

  await expect(220, "greeting");
  let ehlo = await cmd("EHLO site-studio.test", 250);
  if (mode === "starttls") {
    if (!ehlo.lines.some((l) => /STARTTLS/i.test(l))) throw new Error("server does not offer STARTTLS");
    await cmd("STARTTLS", 220);
    r.release(); w.releaseLock();
    socket = socket.startTls({ expectedServerHostname: host });
    await socket.opened.catch((e) => { throw new Error("TLS did not start: " + (e?.message ?? e)); });
    r = lineReader(socket); w = socket.writable.getWriter();
    log.push("-- TLS started --");
    ehlo = await cmd("EHLO site-studio.test", 250);
  }
  if (user) await cmd("AUTH PLAIN " + btoa(`\0${user}\0${pass}`), 235, "AUTH PLAIN <hidden>");
  await cmd(`MAIL FROM:<${from}>`, 250);
  await cmd(`RCPT TO:<${to}>`, 250);
  await cmd("DATA", 354);
  const message = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "",
    ...body.split("\n").map((l) => (l.startsWith(".") ? "." + l : l))].join("\r\n");
  await cmd(message + "\r\n.", 250, `<message, ${message.length} bytes>`);
  await cmd("QUIT", 221);
  await socket.close();
  return log;
}

export default {
  async fetch(req) {
    const p = Object.fromEntries(new URL(req.url).searchParams);
    const started = Date.now();
    try {
      const log = await send({ ...p, port: Number(p.port) });
      return Response.json({ ok: true, ms: Date.now() - started, log });
    } catch (e) {
      return Response.json({ ok: false, ms: Date.now() - started, error: String(e) });
    }
  },
};
