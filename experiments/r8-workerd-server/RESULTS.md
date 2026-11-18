# R8 — Can the Cloudflare Worker build run on plain Linux under `workerd`?

Factual record of one experiment run. Nothing here is a recommendation.

## Versions and environment

| Item | Value |
| --- | --- |
| Date of run | 2026-11-18, 18:39–18:50 UTC |
| `workerd` npm package | `workerd@1.20261118.1` (npm `latest`, published 2026-11-18); `workerd --version` prints `workerd 2026-11-18` |
| Binary used | `@cloudflare/workerd-linux-64@1.20261118.1`, `bin/workerd` |
| Node.js / npm | v22.23.5 / 10.9.9 (used only for `npm install` and the benchmark client) |
| Host | Ubuntu 24.04.5 LTS, glibc 2.39, Linux 6.18.44 x86_64 (a Firecracker-style VM), 4 vCPU Intel Xeon 2.30 GHz, 16 GB RAM, ext4 on `/dev/vda` |
| Worker compatibility date | `2026-11-01` |

Files left in this folder: `worker.js` (Worker + Durable Object), `config.capnp` (base config),
`config-cron.capnp` (base + bundled cron Worker), `run.sh` (start helper), `bench.mjs` (throughput
client), `package.json` / `package-lock.json` (pin the workerd version). `node_modules/` and `data/`
were deleted after the run; `npm install && ./run.sh` recreates them.

How it was run: `./run.sh` = `mkdir -p data/do data/files; workerd serve config.capnp` in the
background, listening on `127.0.0.1:8787`. No `--experimental` flag was needed for anything in
section 2 or for the disk service; it was needed only for the cron test in section 3.

## 1. What the documentation says

The README bundled in the npm package is four lines and only points to GitHub. Quotes below are from
the upstream README (https://raw.githubusercontent.com/cloudflare/workerd/main/README.md, fetched
2026-11-18) and from `workerd.capnp` as shipped inside the npm package (`node_modules/workerd/workerd.capnp`,
1,491 lines, same version as the binary).

### (a) Production use / "not a hardened sandbox"

README, "You might use it":

> **As an application server**, to self-host applications designed for Cloudflare Workers.

README, heading "WARNING: `workerd` is not a hardened sandbox":

> `workerd` tries to isolate each Worker so that it can only access the resources it is configured to access. However, `workerd` on its own does not contain suitable defense-in-depth against the possibility of implementation bugs. When using `workerd` to run possibly-malicious code, you must run it inside an appropriate secure sandbox, such as a virtual machine. The Cloudflare Workers hosting service in particular uses many additional layers of defense-in-depth.

README, heading "Serving in production":

> `workerd` is designed to be unopinionated about how it runs.
>
> One good way to manage `workerd` in production is using `systemd`. Particularly useful is `systemd`'s ability to open privileged sockets on `workerd`'s behalf while running the service itself under an unprivileged user account. To help with this, `workerd` supports inheriting sockets from the parent process using the `--socket-fd` flag.

(followed by an example `workerd.service` / `workerd.socket` unit pair with `Restart=always`, `User=nobody`.)

README, design principles:

> **Always backwards compatible:** Updating `workerd` to a newer version will never break your JavaScript code. `workerd`'s version number is simply a date, corresponding to the maximum "compatibility date" supported by that version.

Cloudflare's launch blog post (https://blog.cloudflare.com/workerd-open-source-workers-runtime/, 2022-09-27):

> workerd can be used to self-host applications that you'd otherwise run on Cloudflare Workers. It is intended to be a production-ready web server for this purpose.

The same post says "As of this blog post, workerd is in beta." The current README no longer contains the word "beta".

### (b) Durable Objects and whether storage is durable

The current README does **not** discuss Durable Object durability at all. Its only mentions are in the
paragraph about serving a Wrangler config directly (quoted under (c)). The statements are in `workerd.capnp`:

`durableObjectStorage.inMemory`:

> The `state.storage` API stores in-memory only. All stored data will persist for the lifetime of the process, but will be lost upon process exit. [...] This mode is intended for local testing purposes.

`durableObjectStorage.localDisk`:

> ** EXPERIMENTAL; SUBJECT TO BACKWARDS-INCOMPATIBLE CHANGE **
>
> Durable Object data will be stored in a directory on local disk. This field is the name of a service, which must be a DiskDirectory service. For each Durable Object class, a subdirectory will be created using `uniqueKey` as the name. Within the directory, one or more files are created for each object, with names `<id>.<ext>`, where `.<ext>` may be any of a number of different extensions depending on the storage mode. (Currently, the main storage is a file with the extension `.sqlite`, and in certain situations extra files with the extensions `.sqlite-wal`, and `.sqlite-shm` may also be present.)

`DurableObjectNamespace.enableSql`:

> Whether or not Durable Objects in this namespace can use the `storage.sql` API to execute SQL queries. workerd uses SQLite to back all Durable Objects, but the SQL API is hidden by default to emulate behavior of traditional DO namespaces on Cloudflare that aren't SQLite-backed. This flag should be enabled when testing code that will run on a SQLite-backed namespace.

`DurableObjectNamespace.uniqueKey`:

> DO NOT LOSE this key, otherwise it may be difficult or impossible to recover stored data.

`DurableObjectNamespace.preventEviction`:

> By default, Durable Objects are evicted after 10 seconds of inactivity, and expire 70 seconds after all clients have disconnected. [...] Note that this is only supported in Workerd; production Durable Objects cannot toggle eviction.

New in this version (not tested here): `Config.cluster` — "workerd instances can work together in a cluster, to distribute Durable Objects among them", with shared state in an S3-compatible or GCS bucket. "Requires `--experimental`."

### (c) What is not supported compared with Cloudflare

The README has no "not supported" list. The closest statement is about serving a Wrangler config directly:

> For simple projects, `workerd serve wrangler.jsonc` also accepts a Wrangler config. `main` is bundled with esbuild, as Wrangler does. The supported fields are `name`, `main`, `compatibility_date`, `compatibility_flags`, `vars`, `durable_objects`, `exports`, `migrations`, `no_bundle`, `$schema` and, with `--experimental`, `kv_namespaces`, `triggers.crons`, `queues`, `workflows`, `d1_databases` and `assets`; any other field is an error. [...] Each KV namespace and each D1 database is one Durable Object, so its throughput is that of one object.

`r2_buckets` is not in that list (confirmed by test, section 3). Platform requirements from the README: "glibc 2.35 or higher (already included on e.g. Ubuntu 22.04, Debian Bookworm)"; "x86_64 CPU with at least SSE4.2 and CLMUL ISA extensions, or arm64 CPU with CRC extension"; tested on "Linux and macOS (x86-64 and arm64 architectures)" and "Windows (x86-64 architecture)".

## 2. Durable Object with SQLite on disk — tests

`B=http://127.0.0.1:8787`. `/o/<name>/<op>` routes to the Durable Object `idFromName(<name>)`.

### 2a. Write in one request, read in another — PASS

```
$ curl -s -X POST "$B/o/alpha/put?k=hello&v=world"
{"ok":true,"k":"hello"}
$ curl -s "$B/o/alpha/get?k=hello"
[{"k":"hello","v":"world"}]
```

### 2b. Normal stop and restart — row still present

```
$ kill -TERM <pid>          # process exited in about 7 ms (measured on a later stop)
$ ./run.sh
$ curl -s "$B/o/alpha/get?k=hello"
[{"k":"hello","v":"world"}]
```

Location: `<disk service path>/<uniqueKey>/`, i.e. `data/do/r8-project/`. While running:

```
data/do/r8-project/7dfa9a01cf2f…3b3565.sqlite        4096
data/do/r8-project/7dfa9a01cf2f…3b3565.sqlite-shm   32768
data/do/r8-project/7dfa9a01cf2f…3b3565.sqlite-wal   24752
data/do/r8-project/metadata.sqlite                   4096
data/do/r8-project/metadata.sqlite-shm              32768
data/do/r8-project/metadata.sqlite-wal               8272
```

After a SIGTERM stop only `<id>.sqlite` (16,384 bytes) and `metadata.sqlite` (8,192 bytes) remained;
the `-wal`/`-shm` files were gone. The file name is the 64-hex object id
(`idFromName("alpha").toString()` = `7dfa9a01cf2fe3120a883e3a2fc62c8e7ed27b6e6e5295d882162c165d3b3565`).
`metadata.sqlite` is one per namespace; its contents were not inspected.

### 2c. `kill -9` right after an acknowledged write

Loop 1 (as specified, 25 iterations): start workerd, `POST /o/crash/put?k=row-$i`, wait for the
`{"ok":true}` body, `kill -9`, repeat with a new key.

```
acked=25
$ curl -s "$B/o/crash/count"
{"n":25}            # keys row-1 … row-25 all listed
```

**25 of 25 acknowledged rows survived.**

Loop 2 (harsher, 20 rounds): a client writes unique rows as fast as it can, logging every key whose
response was `ok`; workerd is `kill -9`ed at a random 0.2–0.6 s into each round.

```
acked: 1342 present: 1346 acked-but-missing: 0 present-not-acked: 4
```

**1,342 of 1,342 acknowledged rows survived**; 4 extra rows were committed whose response never reached the client.

Syscall order for one write (`strace -f -tt -e fsync,fdatasync,pwrite64,writev,…`):

```
18:41:40.344547 pwrite64(21, …, 24, 8272)      # WAL frames
18:41:40.344720 pwrite64(21, …, 4096, 8296)
18:41:40.344786 pwrite64(21, …, 24, 12392)
18:41:40.344837 pwrite64(21, …, 4096, 12416)
18:41:40.344891 fsync(21)         = 0
18:41:40.345838 writev(18, ["HTTP/1.1 200 OK…", "{\"ok\":true,\"k\":\"two\"}\n"], 2) = 93
```

The WAL is `fsync`ed before the HTTP response is written. The binary contains the strings
`PRAGMA journal_mode=WAL;`, `DEFAULT_SYNCHRONOUS=2`, `DEFAULT_WAL_SYNCHRONOUS=2`.

Limit of this test: `kill -9` kills the process, not the machine. Power loss or kernel crash was not
tested, and the host is a VM whose virtual disk's flush behaviour is unknown.

### 2d. Two object ids keep separate data — PASS, one SQLite file per object

```
$ curl -s -X POST "$B/o/beta/put?k=hello&v=beta-value"
$ curl -s "$B/o/alpha/get?k=hello"   → [{"k":"hello","v":"world"}]
$ curl -s "$B/o/beta/get?k=hello"    → [{"k":"hello","v":"beta-value"}]
$ curl -s "$B/o/alpha/count"         → {"n":1}
$ curl -s "$B/o/beta/count"          → {"n":1}
$ ls data/do/r8-project/
04f5d43d3c62…e1db2c.sqlite (+ -shm, -wal)     # beta
7dfa9a01cf2f…3b3565.sqlite (+ -shm, -wal)     # alpha
metadata.sqlite (+ -shm, -wal)
```

### 2e. `ctx.storage.transactionSync` rollback — PASS

The callback inserts `tx-a`, `tx-b`, then throws, before inserting `tx-c`.

```
$ curl -s -X POST "$B/o/alpha/tx?fail=1"   → {"committed":false,"error":"Error: boom midway"}
$ curl -s "$B/o/alpha/keys"                → ["hello"]                       # neither tx-a nor tx-b
$ curl -s -X POST "$B/o/alpha/tx"          → {"committed":true}
$ curl -s "$B/o/alpha/keys"                → ["hello","tx-a","tx-b","tx-c"]
```

### 2f. Alarms — fire, and survive restart

| Case | Set for | `alarm()` ran at | Result |
| --- | --- | --- | --- |
| f1: alarm 2 s ahead, process left running | …310446 | …310447 (1 ms late) | fired |
| f2: alarm 6 s ahead, SIGTERM after 1 s, restart at …313552, no request sent to the object | …317469 | …317471 (2 ms late) | pending alarm survived a normal restart and fired on time |
| f3: alarm 3 s ahead, `kill -9` after 0.5 s, process down for 6 s, restart | …323569 | …327098 (at startup, ~3.5 s after due) | overdue alarm fired immediately on start, without any request to the object |

(Timestamps are the last six digits of epoch milliseconds 1795027……; `getAlarm()` returned `null` after each firing.)

### 2g. Throughput — 1,000 small writes over HTTP

One `INSERT OR REPLACE` per request, client is Node `fetch` with keep-alive on the same machine (`node bench.mjs`, two runs):

| Pattern | Run 1 | Run 2 |
| --- | --- | --- |
| 1,000 sequential writes, one object | 1,383 ms = 723/s (p50 1.29 ms, p99 4.17 ms, max 23 ms) | 1,211 ms = 826/s (p50 1.10 ms, p99 2.65 ms, max 28 ms) |
| 1,000 writes, 16 in flight, one object | 549 ms = 1,822/s | 542 ms = 1,845/s |
| 1,000 writes, 16 in flight, 16 objects | 588 ms = 1,701/s | 619 ms = 1,614/s |

With a new `curl` process per request (no keep-alive): 1,000 sequential writes in 6.0 s. Resident memory
of the workerd process after all tests so far: 162 MB RSS.

### 2h. WebCrypto — PASS

```
$ curl -s -w 'curl total: %{time_total}s\n' "$B/crypto"
{"sha256_abc":"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad","iterations":600000,
 "pbkdf2":"669cfe52482116fda1aa2cbe409b2f56c8e4563752b7a28f6eaab614ee005178",
 "insideMs":{"performanceNow":74,"dateNow":74}}
curl total: 0.075081s
```

- `crypto.subtle.digest('SHA-256', "abc")` returns the standard test vector.
- PBKDF2-SHA256 `deriveBits`, 600,000 iterations, 256 bits: **74 ms, 76 ms, 78 ms** over three calls (≈75 ms end to end by curl). Node's `crypto.pbkdf2Sync` with the same inputs gave the identical output in 81 ms on the same machine.
- Standalone workerd accepted 600,000 iterations. The binary contains the message `Pbkdf2 failed: iteration counts above <max> are not supported (requested <n>)`, so an iteration cap exists in the code and is set by the embedder; no cap was hit here. Whether Cloudflare's hosted platform accepts 600,000 was not tested (see "Could not determine").

## 3. Files and other bindings

### Built-in equivalents in standalone workerd (from `workerd.capnp`, the binary, and tests)

| Cloudflare product | Standalone workerd 1.20261118.1 |
| --- | --- |
| Durable Objects (SQLite) | Built in. `localDisk` storage is marked "EXPERIMENTAL; SUBJECT TO BACKWARDS-INCOMPATIBLE CHANGE" in the schema but ran without `--experimental`. |
| **R2** | **No built-in implementation.** The `r2Bucket` binding exists but only "turns operations into HTTP requests aimed at the named service"; no bundled R2 Worker exists, and `workerd serve wrangler.jsonc` rejects the field: ``wrangler.jsonc: unknown field `r2_buckets`, expected one of `$schema`, `name`, `main`, `compatibility_date`, `compatibility_flags`, `vars`, `durable_objects`, `exports`, `migrations`, `kv_namespaces`, `triggers`, `queues`, `workflows`, `d1_databases`, `no_bundle`, `assets` `` (observed). |
| D1 | Bundled Worker `/workerd/d1.js`, **experimental**. Its header: "A database is one Durable Object [...] SQLite's own limits apply, not D1's." Not tested. |
| Workflows | Bundled engine `/workerd/workflows.js` plus `Worker.workflowsEngine`, **experimental**. Not tested. |
| Queues | Bundled Worker `/workerd/queues.js`, **experimental** ("A queue is up to 1024 shards, each a Durable Object"). Not tested. |
| Cron Triggers | Bundled Worker `/workerd/cron.js`, **experimental**. Tested, works (below). |
| KV | Bundled Worker `/workerd/kv.js`, **experimental**. Not tested. |

Schema text for the bundled modules: "An ES module whose source is bundled with workerd, by name: `/workerd/kv.js`, the KV Worker, `/workerd/cron.js`, cron triggers, `/workerd/queues.js`, the Queues Worker, `/workerd/workflows.js`, a Workflows engine, or `/workerd/d1.js`, D1 databases [...] Experimental."

Without the flag workerd refuses to start (observed): "Bundled modules are an experimental feature which may change or go away in the future. You must run workerd with `--experimental` to use this feature."

### `disk` service test — 20 MB file through a Worker binding

`files` is `disk = (path = "data/files", writable = true)`, bound as `env.FILES`; the Worker forwards
method, body stream and `Range` header.

| Check | Command | Observed |
| --- | --- | --- |
| Write 20,971,520 random bytes (with Content-Length) | `curl -T blob.bin $B/files/proj1/photos/blob.bin` | `204`, 0.022 s; parent directories created; SHA-256 on disk equals source |
| Write the same bytes chunked (no Content-Length) | `cat blob.bin \| curl -T - $B/files/proj1/chunked.bin` | `204`; SHA-256 equals source |
| Stream back | `curl $B/files/proj1/photos/blob.bin` | `200`, `Content-Length: 20971520`, `Content-Type: application/octet-stream`, `Last-Modified`; 0.012 s; SHA-256 equals source |
| Range read | `-H 'Range: bytes=1000000-1000099'` | `206 Partial Content`, `Content-Range: bytes 1000000-1000099/20971520`, 100 bytes identical to source |
| Suffix / open-ended range | `bytes=-50`, `bytes=20971500-` | `206`, `Content-Range: bytes 20971470-20971519/20971520` and `bytes 20971500-20971519/20971520` |
| HEAD | `curl -I` | `200` with `Content-Length` |
| Directory listing | `GET /files/proj1/` | `[{"name":"chunked.bin","type":"file"},{"name":"photos","type":"directory"}]` |
| Delete | `curl -X DELETE` | `204`, file removed |
| `..` path, dotfile, missing file | — | `404`, `403 Unauthorized`, `404 Not Found` |

Responses carried no `ETag`. The service stores bytes only: no custom metadata, content type, checksums,
multipart upload or signed URLs were seen in the schema. Conditional requests were not tested. Schema:
"A PUT will write to a temporary file which is atomically moved into place upon successful completion of
the upload." Whether that file is fsynced before the 204 was not checked.

### `scheduled()` on a timetable — yes, with `--experimental`

`config-cron.capnp` adds a second Worker whose source is `bundled = "/workerd/cron.js"`, with bindings
`SCHEDULE` (its own SQLite Durable Object class `Schedule`), `CRONS = {"MAIN": ["* * * * *"]}` and a
service binding `MAIN` to the application Worker.

```
$ workerd serve config-cron.capnp                 # refused: needs --experimental (two messages, one for
                                                  # bundled modules, one for flag service_binding_extra_handlers)
$ workerd serve config-cron.capnp --experimental  # started 18:43:03 UTC
$ curl -s "$B/o/cron/events"                      # at 18:45:10 UTC
{"events":[{"kind":"scheduled:* * * * *","at":1795027440003},{"kind":"scheduled:* * * * *","at":1795027500002}], …}
```

The application's `scheduled()` handler ran at 18:44:00.003 and 18:45:00.002 with `event.cron = "* * * * *"`.
The module header says each schedule is a Durable Object alarm, expressions are "Cloudflare's dialect, in UTC",
an occurrence is delivered "at least once", and a failed run is retried up to 6 times. Without the bundled
module, a Durable Object alarm (not experimental, test 2f) is the other timer available.

### Side finding: `workerd serve wrangler.jsonc`

With `durable_objects` + `migrations.new_sqlite_classes` and `"no_bundle": true`, `workerd serve wrangler.jsonc`
(no `--experimental`) served the same `worker.js` on port 8787 and persisted the object across a restart in
`.wrangler/state/workerd/r8-Project/<id>.sqlite`. Without `no_bundle` it stopped with: "esbuild not found
(esbuild). wrangler configs are bundled with esbuild: install it (`npm i -D esbuild`), set WORKERD_ESBUILD to
its path, or set "no_bundle": true."

## 4. Miniflare / `wrangler dev` as a server (docs only, not tested)

https://developers.cloudflare.com/workers/testing/miniflare/ (page dated 2026-10-18):

> **Miniflare** is a simulator for developing and testing Cloudflare Workers. It is written in TypeScript and uses a local `workerd` process to implement Workers runtime APIs.

> Miniflare is not a hardened sandbox. Do not use Miniflare to run untrusted or potentially malicious Worker code directly on your machine. [...] This warning applies to default local execution with `wrangler dev`, `vite dev`, `vite preview`, direct Miniflare use, and Miniflare-based testing tools.

> Miniflare is not a security boundary for untrusted code. [...] The hosted Workers platform applies additional layers of defense in depth that Miniflare does not provide locally.

Miniflare README (https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/miniflare/README.md):

> **Miniflare** is a simulator for developing and testing Cloudflare Workers, powered by `workerd`.

`workerd serve --help` on its own `--watch` flag: "Useful for development, but not recommended in production";
on `--debug-port`: "For use by miniflare and local development only".

In the pages read, Cloudflare describes Miniflare and `wrangler dev` only as development and testing tools. No
sentence was found that says in so many words "do not host production traffic on `wrangler dev`", and none
that says it is supported.

## 5. Packaging

| Item | Observed |
| --- | --- |
| Binary size (linux x64) | 162,450,512 bytes (≈155 MiB) on disk, "not stripped"; npm tarball 46,767,001 bytes compressed |
| Platform packages (`optionalDependencies` of `workerd`) | `@cloudflare/workerd-linux-64` (linux/x64, 162 MB unpacked), `-linux-arm64` (linux/arm64, 166 MB), `-darwin-64` (macOS/x64, 158 MB), `-darwin-arm64` (macOS/arm64, 152 MB), `-windows-64` (win32/x64, 112 MB). No musl/Alpine, no 32-bit, no Windows arm64. |
| Linking | `ELF 64-bit LSB pie executable, x86-64, dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2`. `ldd`: only `libc.so.6`, `libm.so.6`, `libdl.so.2`, `librt.so.1`, `libpthread.so.0`. **Not a static binary**; it is a single file that needs glibc (README: 2.35 or higher) and nothing else. |
| Node.js needed at run time | No. The binary was run directly; `npx workerd` is a Node launcher around it. Node/npm were needed only to download it. |
| `workerd compile` | `workerd compile config.capnp > r8-server.bin` produced a 162,455,904-byte executable with config and Worker source embedded; it served the existing data with no config file present. |
| Docker | The Docker client is installed here but no daemon is running, so no image was built or run. |

## What this means

### Observed (in this run, on this machine, this workerd version)

1. An ES-module Worker with a SQLite-backed Durable Object (`ctx.storage.sql`, `transactionSync`, alarms) runs unmodified under standalone workerd with a 25-line config, storing one SQLite file per object in an ordinary directory.
2. Data survived a normal restart and 45 `kill -9`s (25 + 20 rounds); 1,367 of 1,367 acknowledged writes were present afterwards, and the WAL fsync precedes the HTTP response.
3. Alarms fire on time, persist across restart, and overdue alarms fire at startup.
4. A writable `disk` service handles 20 MB streamed uploads, downloads and range reads through a Worker binding.
5. One object handled roughly 700–800 sequential and 1,800 concurrent small writes per second over HTTP.
6. WebCrypto SHA-256 and PBKDF2 at 600,000 iterations work (≈75 ms).
7. Cron Triggers, D1, Queues, Workflows and KV have implementations bundled in this workerd, all behind `--experimental`; cron was tested and works. R2 has none.
8. The binary is one ≈155 MiB glibc-dynamic file for Linux x64/arm64, macOS x64/arm64 and Windows x64.

### Inferred (not directly observed)

- A Worker that uses only Durable Objects, alarms, WebCrypto and fetch could plausibly be the same build on Cloudflare and on Linux; only the config differs (`wrangler` config on Cloudflare, capnp or a reduced `wrangler.jsonc` under workerd).
- Any use of R2 needs either a Worker-level abstraction over "R2 on Cloudflare / `disk` service on Linux" or a self-written service speaking the R2 binding's HTTP protocol. The two APIs differ (R2 has metadata, ETags, multipart; `disk` is plain GET/PUT/DELETE).
- Depending on D1, Queues, Workflows, cron or KV under workerd means depending on features Cloudflare labels experimental ("may change or go away"). `localDisk` storage carries a similar schema warning, although it is not gated by the flag.
- A Docker image would need a glibc ≥ 2.35 base (for example Debian Bookworm or newer); Alpine/musl and `scratch` would not work with the npm binary as shipped. This follows from `ldd` and the README, not from a container run.
- The Cloudflare-specific pieces that have no workerd counterpart by construction (global routing, per-request CPU/memory limits, billing limits, the defence-in-depth sandbox) would be absent or different; none were measured.

### Could not determine

- Durability under power loss or kernel crash (only process kill was tested).
- Whether a `disk` service PUT is fsynced before its 204.
- Behaviour under real load: many objects, large databases, eviction/re-load cost, long-running stability, memory growth. The benchmark was 1,000 tiny writes.
- Whether the on-disk Durable Object format stays compatible across workerd upgrades (the schema says `localDisk` is subject to backwards-incompatible change); no upgrade was tried.
- Whether the same Worker behaves identically on Cloudflare: nothing was deployed. In particular the PBKDF2 iteration cap on the hosted platform is not stated in the Web Crypto docs page read, and was not tested.
- D1, Queues, Workflows, KV bundled Workers, cluster mode, WebSockets/hibernation, and backup/restore of the SQLite files while workerd is running: not tested.
- Running inside Docker, and on arm64: not tested (no Docker daemon; x64 host only).
- An explicit Cloudflare statement for or against hosting production traffic on `wrangler dev`/Miniflare: not found in the pages read.
- What `metadata.sqlite` holds (probably alarm scheduling, given test 2f, but not inspected).
