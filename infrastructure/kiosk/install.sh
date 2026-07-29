#!/usr/bin/env bash

set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  printf 'Run this installer with sudo.\n' >&2
  exit 1
fi

if [[ $# -ne 0 ]]; then
  printf 'Usage: sudo %s\n' "$0" >&2
  exit 1
fi

readonly SERVICE_NAME="ofsm-kiosk.service"
readonly SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if ! id pi >/dev/null 2>&1; then
  printf 'The required pi user does not exist.\n' >&2
  exit 1
fi

if [[ ! -x /usr/bin/chromium ]]; then
  printf 'Chromium is required. Install it with: sudo apt install chromium\n' >&2
  exit 1
fi

install -o pi -g pi -m 0755 "$SCRIPT_DIRECTORY/ofsm-kiosk.sh" /home/pi/ofsm-kiosk.sh
install -m 0644 "$SCRIPT_DIRECTORY/ofsm-kiosk.service" /etc/systemd/system/ofsm-kiosk.service

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

printf 'Enabled %s.\n' "$SERVICE_NAME"
