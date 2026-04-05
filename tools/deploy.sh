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
#   --web-root <path>       Override the web root (default: /var/www)
#   --help                  Show this help message
#
# Source trees:
#   v1:  www/html/      -> /var/www/html/
#        www/pass/      -> /var/www/pass/   (conditional: skip if already present)
#        www/scripts/   -> /var/www/scripts/
#
#   v2:  www_v2/html/       -> /var/www/html/      (React build + PHP v2 API)
#        www_v2/html/api/  -> /var/www/html/api/  (PHP v2 API, inside html tree)
#        www/pass/         -> /var/www/pass/       (shared with v1; conditional)
#        www/scripts/      -> /var/www/scripts/    (shared with v1)
#
# Examples:
#   ./tools/deploy.sh v1
#   ./tools/deploy.sh v2 --dry-run
#   ./tools/deploy.sh v1 --backup
#   ./tools/deploy.sh v2 --backup --backup-dir /home/user/backups
#   ./tools/deploy.sh v2 --web-root /srv/www

# Require bash - BASH_SOURCE and other features are not available in sh/dash
if [ -z "${BASH_VERSION:-}" ]; then
  echo "ERROR: This script requires bash. Run as: bash tools/deploy.sh" >&2
  exit 1
fi

set -eu

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

WEB_ROOT="/var/www"
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
# Deploy: html files
# ---------------------------------------------------------------------------
deploy_html() {
  local src="$1"
  local dest="${WEB_ROOT}/html"

  [[ -d "$src" ]] || die "HTML source directory not found: ${src}"

  log "Deploying html: ${src}/ -> ${dest}/"

  if $DRY_RUN; then
    rsync -av --dry-run "${src}/" "${dest}/"
    return
  fi

  sudo mkdir -p "$dest"
  sudo rsync -av --delete "${src}/" "${dest}/" \
    || die "rsync failed for html directory"

  sudo chown -R www-data:www-data "${dest}"
  sudo find "${dest}" -type d -exec chmod 755 {} \;
  sudo find "${dest}" -type f -exec chmod 644 {} \;
}

# ---------------------------------------------------------------------------
# Run composer install for v2 API (called after deploy_html for v2)
# ---------------------------------------------------------------------------
deploy_v2_composer() {
  local api_dest="${WEB_ROOT}/html/api"

  if ! sudo test -f "${api_dest}/composer.json" 2>/dev/null; then
    return
  fi

  if $DRY_RUN; then
    info "[dry-run] Would run composer install in ${api_dest}"
    return
  fi

  log "Running composer install for v2 API..."
  sudo composer install \
    --no-dev \
    --optimize-autoloader \
    --working-dir="${api_dest}" \
    || die "composer install failed"
}

# ---------------------------------------------------------------------------
# Deploy: pass files (conditional - do not overwrite if already present)
# pass/ is always sourced from www/pass/ for both v1 and v2
# ---------------------------------------------------------------------------
deploy_pass() {
  local src="${REPO_ROOT}/www/pass"
  local dest="${WEB_ROOT}/pass"
  local needs_config=false

  [[ -d "$src" ]] || die "pass/ source directory not found: ${src}"

  log "Checking pass/ directory..."

  if $DRY_RUN; then
    if sudo test -d "$dest" 2>/dev/null; then
      info "[dry-run] ${dest} already exists - would leave existing files in place"
    else
      info "[dry-run] ${dest} not present - would copy template files from ${src}/"
      rsync -av --dry-run "${src}/" "${dest}/"
    fi
    return
  fi

  if ! sudo test -d "$dest" 2>/dev/null; then
    # First-time install: copy template files and flag for configuration
    log "pass/ not found at ${dest} - copying template files..."
    sudo mkdir -p "$dest"
    sudo rsync -av "${src}/" "${dest}/" \
      || die "rsync failed for pass/ directory"
    sudo chown -R www-data:www-data "${dest}"
    sudo find "${dest}" -type d -exec chmod 750 {} \;
    sudo find "${dest}" -type f -exec chmod 640 {} \;
    needs_config=true
  else
    info "pass/ already present at ${dest} - leaving existing files in place"

    # Verify all expected pass files are present
    local src_file dest_file
    local missing=false
    for src_file in "${src}"/*; do
      [[ -f "$src_file" ]] || continue
      dest_file="${dest}/$(basename "$src_file")"
      if ! sudo test -f "$dest_file" 2>/dev/null; then
        err "Missing password file: ${dest_file}"
        missing=true
      fi
    done

    if $missing; then
      die "One or more required password files are missing from ${dest}. Copy the missing files from ${src}/ and configure them before use."
    fi
  fi

  if $needs_config; then
    warn "================================================================"
    warn "ACTION REQUIRED: Password files have been copied to ${dest}"
    warn "You must configure the following files before the system"
    warn "will work correctly:"
    local src_file
    for src_file in "${src}"/*; do
      [[ -f "$src_file" ]] && warn "  ${dest}/$(basename "$src_file")"
    done
    warn "================================================================"
  fi
}

# ---------------------------------------------------------------------------
# Deploy: scripts (always copy, must be executable)
# scripts/ is always sourced from www/scripts/ for both v1 and v2
# ---------------------------------------------------------------------------
deploy_scripts() {
  local src="${REPO_ROOT}/www/scripts"
  local dest="${WEB_ROOT}/scripts"

  [[ -d "$src" ]] || die "scripts/ source directory not found: ${src}"

  log "Deploying scripts: ${src}/ -> ${dest}/"

  if $DRY_RUN; then
    rsync -av --dry-run "${src}/" "${dest}/"
    return
  fi

  sudo mkdir -p "$dest"
  sudo rsync -av --delete "${src}/" "${dest}/" \
    || die "rsync failed for scripts/ directory"

  sudo chown -R www-data:www-data "${dest}"
  sudo find "${dest}" -type d -exec chmod 755 {} \;
  # Shell scripts need execute permission; other files do not
  sudo find "${dest}" -type f -name "*.sh" -exec chmod 755 {} \;
  sudo find "${dest}" -type f ! -name "*.sh" -exec chmod 644 {} \;
}

# ---------------------------------------------------------------------------
# Post-deploy verification (uses sudo for root-owned directories)
# ---------------------------------------------------------------------------
verify_deployment() {
  local html_dest="${WEB_ROOT}/html"
  local pass_dest="${WEB_ROOT}/pass"
  local scripts_dest="${WEB_ROOT}/scripts"
  local ready=true

  log "Verifying deployment..."

  if ! sudo test -d "$html_dest" 2>/dev/null || \
     [[ -z "$(sudo ls -A "$html_dest" 2>/dev/null)" ]]; then
    err "DEPLOYMENT NOT READY: ${html_dest} is missing or empty"
    ready=false
  fi

  if ! sudo test -d "$pass_dest" 2>/dev/null || \
     [[ -z "$(sudo ls -A "$pass_dest" 2>/dev/null)" ]]; then
    err "DEPLOYMENT NOT READY: ${pass_dest} is missing or empty - password files must be present and configured"
    ready=false
  fi

  if ! sudo test -d "$scripts_dest" 2>/dev/null || \
     [[ -z "$(sudo ls -A "$scripts_dest" 2>/dev/null)" ]]; then
    err "DEPLOYMENT NOT READY: ${scripts_dest} is missing or empty"
    ready=false
  fi

  if ! $ready; then
    die "Deployment verification failed - see errors above"
  fi

  info "Verification passed: html/, pass/, and scripts/ are all present"
}

# ---------------------------------------------------------------------------
# Deploy v1
# Source: www/html/ www/pass/ www/scripts/
# ---------------------------------------------------------------------------
deploy_v1() {
  deploy_html "${REPO_ROOT}/www/html"
  deploy_pass
  deploy_scripts
  if ! $DRY_RUN; then
    verify_deployment
  fi
  info "v1 deploy complete"
}

# ---------------------------------------------------------------------------
# Deploy v2
# Source: www_v2/html/ (React build) www_v2/api/ www/pass/ www/scripts/
# ---------------------------------------------------------------------------
deploy_v2() {
  local frontend_src="${REPO_ROOT}/www_v2/html"

  # Frontend build is required for v2
  if [[ ! -d "$frontend_src" ]] || \
     [[ -z "$(ls -A "$frontend_src" 2>/dev/null | grep -v '.gitkeep')" ]]; then
    die "Frontend build not found at ${frontend_src}. Run 'npm run build' in the frontend/ directory and copy the output to www_v2/html/ first."
  fi

  log "Deploying v2..."

  deploy_html "${frontend_src}"
  deploy_v2_composer
  deploy_pass
  deploy_scripts

  if ! $DRY_RUN; then
    verify_deployment
  fi

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
