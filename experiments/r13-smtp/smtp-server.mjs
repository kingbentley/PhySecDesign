// A throwaway SMTP server for the test: plain and STARTTLS on one port, implicit TLS on another.
// Requires AUTH PLAIN (user "studio", password "secret") unless started with --no-auth. Prints each message received.
import net from "node:net";
import tls from "node:tls";
import { readFileSync } from "node:fs";

const cert = { key: readFileSync("certs/server.key"), cert: readFileSync("certs/server.crt") };
const needAuth = !process.argv.includes("--no-auth");

function session(sock, secure, greet = true) {
  let authed = !needAuth, inData = false, buf = "", data = "", env = {};
  const say = (s) => sock.write(s + "\r\n");
  if (greet) say("220 test.local ESMTP");   // after STARTTLS the conversation restarts without a greeting
  const onData = (chunk) => {
    buf += chunk.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") { inData = false; console.log(JSON.stringify({ received: true, secure, authed, ...env, data })); data = ""; say("250 queued"); }
        else data += (line.startsWith("..") ? line.slice(1) : line) + "\n";
        continue;
      }
      const verb = line.split(" ")[0].toUpperCase();
      if (verb === "EHLO") { sock.write("250-test.local\r\n" + (secure ? "" : "250-STARTTLS\r\n") + "250 AUTH PLAIN\r\n"); }
      else if (verb === "STARTTLS" && !secure) {
        say("220 go ahead"); sock.off("data", onData);
        const t = new tls.TLSSocket(sock, { isServer: true, secureContext: tls.createSecureContext(cert) });
        t.on("error", (e) => console.log(JSON.stringify({ tlsError: String(e) })));
        session(t, true, false); return;
      }
      else if (verb === "AUTH") {
        const [, u, p] = Buffer.from(line.split(" ")[2] ?? "", "base64").toString().split("\0");
        if (!secure) say("538 encryption required for authentication");
        else if (u === "studio" && p === "secret") { authed = true; say("235 ok"); } else say("535 bad credentials");
      }
      else if (verb === "MAIL") { if (!authed) say("530 authentication required"); else { env.from = line; say("250 ok"); } }
      else if (verb === "RCPT") { env.to = line; say("250 ok"); }
      else if (verb === "DATA") { inData = true; say("354 end with ."); }
      else if (verb === "QUIT") { say("221 bye"); sock.end(); }
      else say("500 unknown");
    }
  };
  sock.on("data", onData); sock.on("error", () => {});
}
net.createServer((s) => session(s, false)).listen(2525);
tls.createServer(cert, (s) => session(s, true)).listen(4465);
console.log(JSON.stringify({ listening: { plainAndStarttls: 2525, implicitTls: 4465 }, needAuth }));
