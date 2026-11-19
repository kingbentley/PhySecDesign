#!/bin/sh
# Installs each runtime version the experiment uses into runtimes/<version>/. Usage: ./install.sh && node run.mjs
cd "$(dirname "$0")"
for v in 1.20250109.0 1.20250701.0 1.20260101.0 1.20260701.1 1.20261119.1; do
  mkdir -p runtimes/$v && (cd runtimes/$v && npm init -y >/dev/null 2>&1 && npm install --silent --no-audit --no-fund @cloudflare/workerd-linux-64@$v)
done
