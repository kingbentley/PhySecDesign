#!/bin/sh
# Starts worker.js under the open-source runtime installed for experiment R13 and tries the hashing routes.
cd "$(dirname "$0")"
../r13-smtp/node_modules/@cloudflare/workerd-linux-64/bin/workerd serve config-local.capnp > local.out 2>&1 & WD=$!
trap 'kill $WD 2>/dev/null' EXIT
for i in $(seq 1 100); do curl -s -o /dev/null --max-time 1 http://127.0.0.1:8794/ && break; sleep 0.1; done
for r in "/pbkdf2?iter=600000" "/pbkdf2?iter=100000" "/chained?rounds=6" "/node?method=pbkdf2&n=600000" "/node?method=scrypt&n=131072" "/node?method=scrypt&n=65536"; do
  printf "%s -> " "$r"; curl -s -m 60 -w ' [%{time_total}s]' "http://127.0.0.1:8794$r" | tr -d '\n'; echo
done
