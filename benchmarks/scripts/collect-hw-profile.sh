#!/usr/bin/env bash
# collect-hw-profile.sh
# Collects hardware and software environment details for benchmark documentation.
#
# Usage:
#   ./collect-hw-profile.sh [--label <n>] [--out <file>]
#
# Output: markdown file (stdout or --out path)
# Requires: bash, standard Linux utilities (no extra packages needed)

set -euo pipefail

LABEL=""
OUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) LABEL="$2"; shift 2 ;;
    --out)   OUT_FILE="$2"; shift 2 ;;
    *)       echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
val()  { echo "${1:-n/a}"; }
cmd()  { command -v "$1" &>/dev/null && "$@" 2>/dev/null || echo "n/a"; }
file() { [[ -f "$1" ]] && cat "$1" 2>/dev/null || echo "n/a"; }

# ---------------------------------------------------------------------------
# CPU
# ---------------------------------------------------------------------------
CPU_MODEL="$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs || echo "n/a")"
# Raspberry Pi reports 'Hardware' and 'Revision' instead of model name
if [[ "${CPU_MODEL}" == "n/a" ]]; then
  CPU_MODEL="$(grep -m1 'Hardware' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs || echo "n/a")"
fi
CPU_ARCH="$(uname -m)"
CPU_CORES="$(nproc 2>/dev/null || grep -c '^processor' /proc/cpuinfo 2>/dev/null || echo "n/a")"
CPU_BITS="$(getconf LONG_BIT 2>/dev/null || echo "n/a")"

# Clock speed: try cpufreq scaling_max_freq, fall back to /proc/cpuinfo
CPU_MAX_MHZ="n/a"
if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq ]]; then
  raw="$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq 2>/dev/null || echo "")"
  [[ -n "${raw}" ]] && CPU_MAX_MHZ="$(echo "scale=0; ${raw}/1000" | bc) MHz"
fi
if [[ "${CPU_MAX_MHZ}" == "n/a" ]]; then
  raw="$(grep -m1 'cpu MHz' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs || echo "")"
  [[ -n "${raw}" ]] && CPU_MAX_MHZ="${raw} MHz"
fi

# Current clock (may differ from max under throttling)
CPU_CUR_MHZ="n/a"
if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq ]]; then
  raw="$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null || echo "")"
  [[ -n "${raw}" ]] && CPU_CUR_MHZ="$(echo "scale=0; ${raw}/1000" | bc) MHz"
fi

# Cache sizes
L1D="$(file /sys/devices/system/cpu/cpu0/cache/index0/size)"
L1I="$(file /sys/devices/system/cpu/cpu0/cache/index1/size)"
L2="$(file /sys/devices/system/cpu/cpu0/cache/index2/size)"
L3="$(file /sys/devices/system/cpu/cpu0/cache/index3/size)"

# CPU temperature (Pi-specific but harmless elsewhere)
CPU_TEMP="n/a"
if [[ -f /sys/class/thermal/thermal_zone0/temp ]]; then
  raw="$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "")"
  [[ -n "${raw}" ]] && CPU_TEMP="$(echo "scale=1; ${raw}/1000" | bc)°C"
fi

# Throttling (Pi only — vcgencmd)
THROTTLE="n/a"
if command -v vcgencmd &>/dev/null; then
  THROTTLE="$(vcgencmd get_throttled 2>/dev/null || echo "n/a")"
fi

# ---------------------------------------------------------------------------
# Memory
# ---------------------------------------------------------------------------
MEM_TOTAL="$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{printf "%.0f MB", $2/1024}' || echo "n/a")"
MEM_AVAIL="$(grep MemAvailable /proc/meminfo 2>/dev/null | awk '{printf "%.0f MB", $2/1024}' || echo "n/a")"
MEM_TYPE="n/a"
if command -v dmidecode &>/dev/null; then
  MEM_TYPE="$(dmidecode -t memory 2>/dev/null | grep -m1 'Type:' | grep -v 'Error' | awk '{print $2}' || echo "n/a")"
fi
# Pi: memory type from /proc/cpuinfo revision is not easily parsed; leave as n/a unless dmidecode works

# ---------------------------------------------------------------------------
# Storage (boot device)
# ---------------------------------------------------------------------------
BOOT_DEV="n/a"
ROOT_DEV="n/a"

# Find the device backing /
if command -v lsblk &>/dev/null; then
  ROOT_DEV="$(lsblk -no PKNAME "$(findmnt -n -o SOURCE /)" 2>/dev/null | head -1 || echo "n/a")"
  [[ -z "${ROOT_DEV}" ]] && ROOT_DEV="$(lsblk -no NAME,MOUNTPOINT 2>/dev/null | awk '$2=="/" {print $1}' | head -1 || echo "n/a")"
fi

STORAGE_TYPE="n/a"
if [[ "${ROOT_DEV}" != "n/a" && -n "${ROOT_DEV}" ]]; then
  # Rotational: 0=SSD/flash, 1=HDD
  ROT="$(cat "/sys/block/${ROOT_DEV}/queue/rotational" 2>/dev/null || echo "")"
  if [[ "${ROT}" == "0" ]]; then
    # Distinguish SD card from SSD by transport
    if [[ "${ROOT_DEV}" == mmcblk* ]]; then
      STORAGE_TYPE="SD card (eMMC/microSD)"
    else
      STORAGE_TYPE="SSD / flash"
    fi
  elif [[ "${ROT}" == "1" ]]; then
    STORAGE_TYPE="HDD (rotational)"
  fi
fi

# SD card speed class if applicable
SD_SPEED="n/a"
SD_SPEED_FILE="$(ls /sys/class/mmc_host/mmc0/mmc0:*/speed_class 2>/dev/null | head -1 || echo "")"
if [[ -n "${SD_SPEED_FILE}" && -f "${SD_SPEED_FILE}" ]]; then
  SD_SPEED="$(cat "${SD_SPEED_FILE}" 2>/dev/null || echo "n/a")"
fi

# Disk read speed — read from a large file on the root filesystem (non-destructive)
# Prefers a tmpfs write+read cycle to test actual storage read path
DISK_READ="n/a"
if command -v dd &>/dev/null && command -v sync &>/dev/null; then
  TMP_FILE="$(mktemp)"
  if dd if=/dev/zero of="${TMP_FILE}" bs=1M count=64 2>/dev/null && sync; then
    DISK_READ="$(dd if="${TMP_FILE}" of=/dev/null bs=1M 2>&1 | sed -n 's/.*\([0-9.]*  *[MGk]B\/s\).*/\1/p' | tail -1 || echo "n/a")"
  fi
  rm -f "${TMP_FILE}"
fi

# ---------------------------------------------------------------------------
# OS and kernel
# ---------------------------------------------------------------------------
OS_NAME="$(. /etc/os-release 2>/dev/null && echo "${PRETTY_NAME}" || uname -s)"
KERNEL="$(uname -r)"
HOSTNAME="$(hostname)"

# Virtualization detection
VIRT="bare metal"
if command -v systemd-detect-virt &>/dev/null; then
  detected="$(systemd-detect-virt 2>/dev/null || echo "none")"
  [[ "${detected}" != "none" ]] && VIRT="${detected}"
fi

# ---------------------------------------------------------------------------
# Software stack
# ---------------------------------------------------------------------------
PHP_VER="$(cmd php -r 'echo PHP_VERSION;')"
PHP_SAPI="$(cmd php -r 'echo PHP_SAPI;')"
OPCACHE="n/a"
if command -v php &>/dev/null; then
  OPCACHE="$(php -r 'echo ini_get("opcache.enable") ? "enabled" : "disabled";' 2>/dev/null || echo "n/a")"
fi

APACHE_VER="$(cmd apache2 -v | sed -n 's/.*\(Apache\/[0-9.]*\).*/\1/p' | head -1)"
if [[ -z "${APACHE_VER}" ]]; then
  APACHE_VER="$(cmd httpd -v 2>/dev/null | sed -n 's/.*\(Apache\/[0-9.]*\).*/\1/p' | head -1 || echo "n/a")"
fi
[[ -z "${APACHE_VER}" ]] && APACHE_VER="n/a"

MYSQL_VER="n/a"
if command -v mysql &>/dev/null; then
  MYSQL_VER="$(mysql --version 2>/dev/null | sed -n 's/[^0-9]*\([0-9][0-9.]*\).*/\1/p' | head -1 || echo "n/a")"
fi

# ---------------------------------------------------------------------------
# Assemble output
# ---------------------------------------------------------------------------
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LABEL_LINE="${LABEL:+${LABEL} — }${HOSTNAME}"

OUT="### Hardware Profile: ${LABEL_LINE}

Collected: ${TIMESTAMP}

#### CPU

| Property | Value |
|---|---|
| Model | ${CPU_MODEL} |
| Architecture | ${CPU_ARCH} (${CPU_BITS}-bit OS) |
| Cores | ${CPU_CORES} |
| Max clock | ${CPU_MAX_MHZ} |
| Current clock | ${CPU_CUR_MHZ} |
| L1 data cache | ${L1D} |
| L1 instruction cache | ${L1I} |
| L2 cache | ${L2} |
| L3 cache | ${L3} |
| Temperature at test time | ${CPU_TEMP} |
| Throttle flags (Pi only) | ${THROTTLE} |

#### Memory

| Property | Value |
|---|---|
| Total RAM | ${MEM_TOTAL} |
| Available at test time | ${MEM_AVAIL} |
| Memory type | ${MEM_TYPE} |

#### Storage

| Property | Value |
|---|---|
| Root device | ${ROOT_DEV} |
| Storage type | ${STORAGE_TYPE} |
| SD speed class | ${SD_SPEED} |
| Sequential read (approx) | ${DISK_READ} |

#### System

| Property | Value |
|---|---|
| Hostname | ${HOSTNAME} |
| OS | ${OS_NAME} |
| Kernel | ${KERNEL} |
| Virtualization | ${VIRT} |

#### Software Stack

| Component | Value |
|---|---|
| PHP version | ${PHP_VER} |
| PHP SAPI | ${PHP_SAPI} |
| PHP opcache | ${OPCACHE} |
| Apache version | ${APACHE_VER} |
| MySQL/MariaDB version | ${MYSQL_VER} |
"

if [[ -n "${OUT_FILE}" ]]; then
  echo "${OUT}" > "${OUT_FILE}"
  echo "Written to: ${OUT_FILE}" >&2
else
  echo "${OUT}"
fi
