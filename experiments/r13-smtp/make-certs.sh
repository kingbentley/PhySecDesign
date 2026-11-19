#!/bin/sh
# Creates a throwaway certificate authority and a server certificate for localhost and 127.0.0.1 in certs/.
cd "$(dirname "$0")" && mkdir -p certs && cd certs
openssl req -x509 -newkey rsa:2048 -nodes -days 30 -keyout ca.key -out ca.crt -subj "/CN=R13 test authority" 2>/dev/null
openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=localhost" 2>/dev/null
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\n' > ext.cnf
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 30 -out server.crt -extfile ext.cnf 2>/dev/null
