#!/usr/bin/env bash
# deploy.sh - Deploy piClinic v1 or v2 to the local web server
#
# Usage:
#   ./tools/deploy.sh <version> [options]
#
# Arguments:
#   version         Required. One of: v1, v2
#
# Options:
#   --dry-run               Show what would be copied without making changes
#   --backup                Back up current deployment before deploying
#                           (uses default backup dir: /var/backups/piclinic)
#   --backup-dir <path>     Back up to a specific directory
#   --web-root <path>       Override the web root (default: /var/www/html)
#   --help                  Show this help message
#
# Examples:
#   ./tools/deploy.sh v1
#   ./tools/deploy.sh v2 --dry-run
#   ./tools/deploy.sh v1 --backup
#   ./tools/deploy.sh v2 --backup --backup-dir /home/user/backups
#   ./tools/deploy.sh v2 --web-root /srv/www/html

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

WEB_ROOT="/var/www/html"
DEFAULT_BACKUP_DIR="/var/backups/piclinic"
BACKUP_DIR=""
VERSION=""
DRY_RUN=false
DO_BACKUP=false
APACHE_WAS_RUNNING=false

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[deploy] $*"; }
info() { echo "[deploy] INFO:  $*"; }
warn() { echo "[deploy] WARN:  $*" >&2; }
err()  { echo "[deploy] ERROR: $*" >&2; }

usage() {
  sed -n '/^# Usage:/,/^[^#]/{ /^#/{ s/^# \?//; p } }' "$0"
  exit 0
}

die() {
  err "$*"
  apache_restart_if_was_running
  exit 1
}

# ---------------------------------------------------------------------------
# Apache helpers
# ---------------------------------------------------------------------------
apache_is_running() {
  systemctl is-active --quiet apache2 2>/dev/null
}

apache_stop() {
  if $DRY_RUN; then
    info "[dry-run] Would stop apache2"
    return
  fi
  log "Stopping apache2..."
  sudo systemctl stop apache2 || die "Failed to stop apache2"
}

apache_start() {
  if $DRY_RUN; then
    info "[dry-run] Would start apache2"
    return
  fi
  log "Starting apache2..."
  sudo systemctl start apache2 || err "Failed to start apache2 - manual intervention required"
}

apache_restart_if_was_running() {
  if $APACHE_WAS_RUNNING; then
    apache_start
  fi
}

# ---------------------------------------------------------------------------
# Backup helper
# ---------------------------------------------------------------------------
do_backup() {
  local target_dir="${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}"
  local timestamp
  timestamp="$(date +%Y%m%d_%H%M%S)"
  local backup_path="${target_dir}/piclinic_${VERSION}_${timestamp}"

  if $DRY_RUN; then
    info "[dry-run] Would back up ${WEB_ROOT} to ${backup_path}"
    return
  fi

  if [[ ! -d "$WEB_ROOT" ]]; then
    warn "Web root ${WEB_ROOT} does not exist - skipping backup"
    return
  fi

  log "Backing up ${WEB_ROOT} to ${backup_path}..."
  sudo mkdir -p "$target_dir" || die "Cannot create backup directory: ${target_dir}"
  sudo cp -a "$WEB_ROOT" "$backup_path" || die "Backup failed"
  info "Backup saved to: ${backup_path}"
}

# ---------------------------------------------------------------------------
# Deploy functions
# ---------------------------------------------------------------------------
deploy_v1() {
  local src="${REPO_ROOT}/www/html"

  [[ -d "$src" ]] || die "V1 source directory not found: ${src}"

  log "Deploying v1 from ${src} to ${WEB_ROOT}..."

  if $DRY_RUN; then
    info "[dry-run] Would rsync: ${src}/ -> ${WEB_ROOT}/"
    rsync -av --dry-run "${src}/" "${WEB_ROOT}/"
    return
  fi

  sudo rsync -av --delete "${src}/" "${WEB_ROOT}/" \
    || die "rsync failed for v1"

  sudo chown -R www-data:www-data "${WEB_ROOT}" \
    || warn "Could not set ownership on ${WEB_ROOT}"

  sudo find "${WEB_ROOT}" -type d -exec chmod 755 {} \; \
    || warn "Could not set directory permissions"

  sudo find "${WEB_ROOT}" -type f -exec chmod 644 {} \; \
    || warn "Could not set file permissions"

  info "v1 deploy complete"
}

deploy_v2() {
  local api_src="${REPO_ROOT}/www/html/api/v2"
  local frontend_src="${REPO_ROOT}/frontend/dist"
  local api_dest="${WEB_ROOT}/api/v2"

  # Frontend build is required for v2
  if [[ ! -d "$frontend_src" ]]; then
    die "Frontend build not found at ${frontend_src}. Run 'npm run build' in the frontend/ directory first."
  fi

  # v2 API directory may not exist yet during early development - warn but continue
  if [[ ! -d "$api_src" ]]; then
    warn "v2 API source not found at ${api_src} - skipping API deploy"
  fi

  log "Deploying v2..."

  if $DRY_RUN; then
    if [[ -d "$api_src" ]]; then
      info "[dry-run] Would rsync: ${api_src}/ -> ${api_dest}/"
      rsync -av --dry-run "${api_src}/" "${api_dest}/"
    fi
    info "[dry-run] Would rsync: ${frontend_src}/ -> ${WEB_ROOT}/"
    rsync -av --dry-run "${frontend_src}/" "${WEB_ROOT}/"
    return
  fi

  # Deploy v2 API
  if [[ -d "$api_src" ]]; then
    sudo mkdir -p "$api_dest"
    sudo rsync -av --delete "${api_src}/" "${api_dest}/" \
      || die "rsync failed for v2 API"

    # Run composer install for v2 dependencies
    if [[ -f "${api_src}/composer.json" ]]; then
      log "Running composer install for v2 API..."
      sudo composer install \
        --no-dev \
        --optimize-autoloader \
        --working-dir="${api_dest}" \
        || die "composer install failed"
    fi
  fi

  # Deploy React frontend (static files)
  sudo rsync -av --delete \
    --exclude='api/' \
    "${frontend_src}/" "${WEB_ROOT}/" \
    || die "rsync failed for v2 frontend"

  sudo chown -R www-data:www-data "${WEB_ROOT}" \
    || warn "Could not set ownership on ${WEB_ROOT}"

  sudo find "${WEB_ROOT}" -type d -exec chmod 755 {} \; \
    || warn "Could not set directory permissions"

  sudo find "${WEB_ROOT}" -type f -exec chmod 644 {} \; \
    || warn "Could not set file permissions"

  info "v2 deploy complete"
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[[ $# -eq 0 ]] && usage

while [[ $# -gt 0 ]]; do
  case "$1" in
    v1|v2)
      VERSION="$1"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --backup)
      DO_BACKUP=true
      shift
      ;;
    --backup-dir)
      DO_BACKUP=true
      [[ -n "${2:-}" ]] || die "--backup-dir requires a path argument"
      BACKUP_DIR="$2"
      shift 2
      ;;
    --web-root)
      [[ -n "${2:-}" ]] || die "--web-root requires a path argument"
      WEB_ROOT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      die "Unknown argument: $1. Run with --help for usage."
      ;;
  esac
done

[[ -n "$VERSION" ]] || die "Version argument required (v1 or v2). Run with --help for usage."

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if ! $DRY_RUN; then
  command -v rsync >/dev/null 2>&1 || die "rsync is required but not installed"
  command -v sudo  >/dev/null 2>&1 || die "sudo is required"
fi

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
log "Starting deploy: version=${VERSION}, web-root=${WEB_ROOT}, dry-run=${DRY_RUN}, backup=${DO_BACKUP}"

# Record Apache state before touching anything
if apache_is_running; then
  APACHE_WAS_RUNNING=true
fi

# Backup before stopping Apache so the backup reflects the live state
if $DO_BACKUP; then
  do_backup
fi

# Stop Apache (only if it was running)
if $APACHE_WAS_RUNNING; then
  apache_stop
fi

# Deploy
case "$VERSION" in
  v1) deploy_v1 ;;
  v2) deploy_v2 ;;
esac

# Restart Apache if it was running before
apache_restart_if_was_running

if $DRY_RUN; then
  info "Dry run complete - no changes made"
else
  info "Deploy finished successfully"
fi
