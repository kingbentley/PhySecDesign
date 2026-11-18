#!/bin/sh
# start workerd in background; usage: ./run.sh [config] [extra flags]
cd "$(dirname "$0")" && mkdir -p data/do data/files
CFG="${1:-config.capnp}"; [ $# -gt 0 ] && shift
if curl -s -o /dev/null --max-time 1 http://127.0.0.1:8787/; then echo "port 8787 already answers; stop that instance first"; exit 1; fi
./node_modules/@cloudflare/workerd-linux-64/bin/workerd serve "$CFG" "$@" >> workerd.log 2>&1 &
PID=$!; echo $PID > workerd.pid
for i in $(seq 1 100); do
  kill -0 $PID 2>/dev/null || { echo "workerd exited; see workerd.log"; exit 1; }
  curl -s -o /dev/null --max-time 1 http://127.0.0.1:8787/ && exit 0; sleep 0.05
done
echo "did not start"; exit 1
