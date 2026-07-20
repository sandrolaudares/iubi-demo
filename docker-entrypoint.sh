#!/bin/sh
set -e

# Se um authkey do Tailscale for fornecido, sobe o daemon em modo userspace e
# expõe um proxy HTTP local. O servidor Node usa OUTBOUND_HTTP_PROXY para
# alcançar o gateway IUBI (100.x) através do Tailscale.
if [ -n "$TAILSCALE_AUTHKEY" ]; then
  echo "[entrypoint] iniciando Tailscale (userspace)…"
  /usr/local/bin/tailscaled \
    --state=/var/lib/tailscale/tailscaled.state \
    --socket=/var/run/tailscale/tailscaled.sock \
    --tun=userspace-networking \
    --outbound-http-proxy-listen=localhost:1055 &

  until /usr/local/bin/tailscale --socket=/var/run/tailscale/tailscaled.sock status >/dev/null 2>&1; do
    sleep 0.3
  done

  /usr/local/bin/tailscale --socket=/var/run/tailscale/tailscaled.sock up \
    --authkey="${TAILSCALE_AUTHKEY}" \
    --hostname="${TAILSCALE_HOSTNAME:-iubi-demo-fly}" \
    --accept-routes

  export OUTBOUND_HTTP_PROXY="http://localhost:1055"
  echo "[entrypoint] Tailscale ativo; OUTBOUND_HTTP_PROXY=$OUTBOUND_HTTP_PROXY"
else
  echo "[entrypoint] TAILSCALE_AUTHKEY ausente — sem proxy de rede privada."
fi

exec node server/index.js
