#!/bin/sh
# R13: start the test mail server and the runtime, then try each way of sending. Usage: npm install && ./run.sh
cd "$(dirname "$0")"
[ -f certs/server.crt ] || sh make-certs.sh
node smtp-server.mjs > server.out 2>&1 & SRV=$!
./node_modules/@cloudflare/workerd-linux-64/bin/workerd serve config.capnp > workerd.out 2>&1 & WD=$!
trap 'kill $SRV $WD 2>/dev/null' EXIT
for i in $(seq 1 100); do curl -s -o /dev/null --max-time 1 http://127.0.0.1:8792/ && break; sleep 0.1; done
Q='from=studio%40example.test&to=kevin%40example.test&subject=Invitation%20to%20Site%20Studio&body=Hello%0A.dot%20line%0A%C3%BCn%C3%AFcode%20%E2%9C%93'
try() { echo "== $1"; curl -s --max-time 30 "http://127.0.0.1:8792/?$2&$Q"; echo; }
try "implicit TLS (port 465 style), with sign-in"        "host=localhost&port=4465&mode=tls&user=studio&pass=secret"
try "STARTTLS (port 587 style), with sign-in"            "host=localhost&port=2525&mode=starttls&user=studio&pass=secret"
try "wrong password"                                     "host=localhost&port=4465&mode=tls&user=studio&pass=wrong"
try "no encryption, sign-in refused by the server"       "host=localhost&port=2525&mode=plain&user=studio&pass=secret"
try "by address 127.0.0.1, which the certificate names"  "host=127.0.0.1&port=4465&mode=tls&user=studio&pass=secret"
try "by address 127.0.0.2, which the certificate does not name" "host=127.0.0.2&port=4465&mode=tls&user=studio&pass=secret"
try "nothing listening"                                  "host=localhost&port=2599&mode=tls"
try "STARTTLS by address 127.0.0.2, which the certificate does not name" "host=127.0.0.2&port=2525&mode=starttls&user=studio&pass=secret"
./node_modules/@cloudflare/workerd-linux-64/bin/workerd serve config-untrusted.capnp > workerd-untrusted.out 2>&1 & WD2=$!
trap 'kill $SRV $WD $WD2 2>/dev/null' EXIT
for i in $(seq 1 100); do curl -s -o /dev/null --max-time 1 http://127.0.0.1:8793/ && break; sleep 0.1; done
echo "== certificate authority not trusted by the runtime, implicit TLS"; curl -s --max-time 30 "http://127.0.0.1:8793/?host=localhost&port=4465&mode=tls&user=studio&pass=secret&$Q"; echo
echo "== certificate authority not trusted by the runtime, STARTTLS"; curl -s --max-time 30 "http://127.0.0.1:8793/?host=localhost&port=2525&mode=starttls&user=studio&pass=secret&$Q"; echo
echo "== received by the test server"; cat server.out
echo "== runtime log"; grep -o "error: .*" workerd.out workerd-untrusted.out | cut -c1-260
