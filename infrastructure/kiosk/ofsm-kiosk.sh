#!/usr/bin/env bash

set -euo pipefail

readonly KIOSK_URL="https://ofsm.simonhauck.de"

# Pi OS Bookworm can start the graphical session before Chromium is ready.
sleep 8

exec /usr/bin/chromium \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --app="$KIOSK_URL"
