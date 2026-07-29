# OpenFireStationManager Kiosk

This deployment package adapts [geerlingguy/pi-kiosk](https://github.com/geerlingguy/pi-kiosk)
for the OpenFireStationManager production site at `https://ofsm.simonhauck.de`.

It runs Chromium in fullscreen kiosk mode after the Pi's graphical desktop starts. The service
restarts Chromium whenever it exits.

## Prerequisites

- A Raspberry Pi running Raspberry Pi OS with Desktop (Bookworm or newer).
- The `pi` desktop user automatically logs in to the graphical session.
- Network access to `https://ofsm.simonhauck.de`.

Install Chromium if it is not already present:

```bash
sudo apt update
sudo apt install chromium
```

Configure automatic desktop login for `pi` with Raspberry Pi Configuration or `raspi-config`
before enabling the service. Ensure `sudo` requires `pi`'s password.

## Deploy

Copy or clone this repository onto the Pi, then run the installer from this directory.

```bash
cd OpenFireStationManager/infrastructure/kiosk
sudo ./install.sh
```

The installer copies the launcher to `/home/pi/ofsm-kiosk.sh`, installs the systemd unit at
`/etc/systemd/system/ofsm-kiosk.service`, then enables and starts `ofsm-kiosk.service`.

Reboot to confirm that the kiosk starts automatically with the graphical session:

```bash
sudo reboot
```

## Operations

```bash
# Show status.
sudo systemctl status ofsm-kiosk

# Follow Chromium and service logs.
journalctl -u ofsm-kiosk -f

# Restart after changing the launcher.
sudo systemctl restart ofsm-kiosk

# Disable the kiosk and stop it now.
sudo systemctl disable --now ofsm-kiosk
```

To update the kiosk package, pull the desired repository revision and rerun the installer. It
replaces the installed launcher and unit, reloads systemd, and restarts the service.

## Troubleshooting

- If Chromium does not appear after boot, verify automatic desktop login and inspect the service
  logs with `journalctl` above.
- If the display uses a session other than `:0`, change `DISPLAY=:0` in
  `ofsm-kiosk.service`, rerun the installer, and restart the service.
- The service intentionally relaunches Chromium after it exits. Stop the service with
  `sudo systemctl stop ofsm-kiosk` before exiting Chromium for maintenance.
