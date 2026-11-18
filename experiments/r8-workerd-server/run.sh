#!/bin/sh
# start workerd in background; usage: ./run.sh [config] [extra flags]
cd "$(dirname "$0")" && mkdir -p data/do data/files
CFG="${1:-config.capnp}"; [ $# -gt 0 ] && shift
./node_modules/@cloudflare/workerd-linux-64/bin/workerd serve "$CFG" "$@" >> workerd.log 2>&1 &
echo $! > workerd.pid
for i in $(seq 1 100); do curl -s -o /dev/null http://127.0.0.1:8787/ && exit 0; sleep 0.05; done
echo "did not start"; exit 1
