#!/usr/bin/env python3
"""R11 probe driver. Usage: CLOUDFLARE_ACCOUNT_ID=... python3 run.py
Keeps a Worker and its Durable Objects busy, changes the deployed version part-way, and reports what ran when.
All HTTP goes through curl so that the cloud session's proxy and its saved token apply."""
import json, os, subprocess, sys, threading, time

BASE = "https://site-studio-experiments.physec-site-studio.workers.dev"
API = f"https://api.cloudflare.com/client/v4/accounts/{os.environ['CLOUDFLARE_ACCOUNT_ID']}/workers/scripts/site-studio-experiments"
AUTH = "Authorization: Bearer " + os.environ.get("CLOUDFLARE_API_TOKEN", "proxy-injected")
HERE = os.path.dirname(os.path.abspath(__file__))
now = lambda: int(time.time() * 1000)

def curl(url, *extra, timeout=30):
    r = subprocess.run(["curl", "-sS", "-m", str(timeout), *extra, url], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except Exception: return {"_error": (r.stdout or r.stderr).strip()[:160]}

def deploy(version):
    out = subprocess.run([os.path.join(HERE, "deploy.sh"), version], capture_output=True, text=True).stdout
    return json.loads(out)["success"]

def versions():
    return curl(API + "/versions", "-H", AUTH)["result"]["items"]

def roll_to(version_id):
    body = json.dumps({"strategy": "percentage", "versions": [{"version_id": version_id, "percentage": 100}]})
    return curl(API + "/deployments", "-X", "POST", "-H", AUTH, "-H", "content-type: application/json", "-d", body)

def scenario(name, objects, change, change_label, seconds=70, change_at=12):
    """Runs activity for `seconds`, calling change() after `change_at` seconds. Returns observations."""
    for o in objects: curl(f"{BASE}/o/{o}/clear")
    worker_polls, writes, long_result, stop = [], [], {}, threading.Event()
    def poll_worker():
        while not stop.is_set():
            r = curl(BASE + "/", timeout=10); worker_polls.append((now(), r.get("worker", "ERR:" + r.get("_error", "?")[:40]), r.get("isolate"))); time.sleep(0.15)
    def poll_write(o):
        while not stop.is_set():
            r = curl(f"{BASE}/o/{o}/write", timeout=10); writes.append((now(), o, r.get("object", "ERR:" + r.get("_error", "?")[:60]))); time.sleep(0.25)
    def long_request():
        long_result.update(curl(f"{BASE}/o/{objects[0]}/slow?seconds={seconds - 15}&every=500", timeout=seconds + 20)); long_result["returned_at"] = now()
    for o in objects: curl(f"{BASE}/o/{o}/alarms?seconds={seconds}&every=1000")
    threads = [threading.Thread(target=poll_worker), threading.Thread(target=long_request)] + [threading.Thread(target=poll_write, args=(o,)) for o in objects]
    t0 = now(); [t.start() for t in threads]
    time.sleep(change_at); c0 = now(); ok = change(); c1 = now()
    time.sleep(seconds - change_at); stop.set(); [t.join() for t in threads]
    time.sleep(3)
    rows = {o: curl(f"{BASE}/o/{o}/rows") for o in objects}
    before = worker_polls[0][1]; after = worker_polls[-1][1]
    rel = lambda t: round((t - c1) / 1000, 2)
    print(f"\n=== {name}: {change_label} (API call took {(c1 - c0) / 1000:.1f} s; times below are seconds after it returned; ok={ok})")
    new_polls = [p for p in worker_polls if p[1] == after]; old_polls = [p for p in worker_polls if p[1] == before]
    first_new = new_polls[0][0] if before != after else None
    print(f"Worker requests: {len(worker_polls)} polls. Version before {before}, after {after}.")
    if first_new:
        late_old = [p for p in old_polls if p[0] > first_new]
        print(f"  first answer from {after}: {rel(first_new)} s; last answer from {before}: {rel(old_polls[-1][0])} s; answers from {before} after the first from {after}: {len(late_old)}")
    errs = [p for p in worker_polls if str(p[1]).startswith("ERR")]; print(f"  failed polls: {len(errs)} {errs[:2]}")
    for o in objects:
        rs = rows[o] if isinstance(rows[o], list) else []
        seq, last = [], None
        for r in rs:
            key = (r["object"], r["instance"])
            if key != last: seq.append([r["object"], r["instance"], r["at"], r["at"], 0]); last = key
            seq[-1][3] = r["at"]; seq[-1][4] += 1
        print(f"Object {o}: {len(rs)} rows. Runs of (object version, instance): " + "; ".join(f"{v}/{i} {rel(a)}..{rel(b)} s ({n} rows)" for v, i, a, b, n in seq))
        mixed = sorted({(r["caller"], r["object"]) for r in rs if r["caller"] not in ("-", r["object"])})
        print(f"  rows where the calling Worker and the object were different versions: {[f'caller {c} object {ob}' for c, ob in mixed]} "
              f"({sum(1 for r in rs if r['caller'] not in ('-', r['object']))} rows)")
        srcs = {}
        for r in rs: srcs.setdefault((r["source"], r["object"]), [r["at"], r["at"]])[1] = r["at"]
        print("  by source: " + "; ".join(f"{s} under {v}: {rel(a)}..{rel(b)} s" for (s, v), (a, b) in sorted(srcs.items())))
        gaps = sorted(((rs[i + 1]["at"] - rs[i]["at"]) for i in range(len(rs) - 1)), reverse=True)[:1]
        print(f"  longest gap between rows: {gaps[0] if gaps else 0} ms; failed write requests: {sum(1 for w in writes if w[1] == o and str(w[2]).startswith('ERR'))}")
    print(f"Long request held open on {objects[0]}: {json.dumps({k: v for k, v in long_result.items() if k != 'returned_at'})[:200]} returned at {rel(long_result.get('returned_at', c1))} s")
    return rows

if __name__ == "__main__":
    print("versions known before:", [(v["id"][:8], v["number"]) for v in versions()][:5])
    assert deploy("A"); time.sleep(8)
    scenario("1", ["s1a", "s1b"], lambda: deploy("B"), "deploy version B over A")
    vs = versions(); a_id = next(v["id"] for v in sorted(vs, key=lambda v: -v["number"])[1:2])
    before_rows = curl(f"{BASE}/o/s1a/rows")
    scenario("2", ["s2a", "s2b"], lambda: roll_to(a_id).get("success"), "roll back to the previous version (A) with the deployments API")
    after_rows = curl(f"{BASE}/o/s1a/rows")
    print(f"\nData written before the rollback (object s1a): {len(before_rows)} rows before, {len(after_rows)} after; identical: {before_rows == after_rows[:len(before_rows)]}")
    print("Worker now answers:", curl(BASE + "/"))
    scenario("3", ["s3a", "s3b"], lambda: deploy("C"), "deploy version C over the rolled-back A")
