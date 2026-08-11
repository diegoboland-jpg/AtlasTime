#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
  mkdir -p /data/backups
  chown -R node:node /data
  exec su-exec node:node "$@"
fi

exec "$@"
