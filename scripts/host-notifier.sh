#!/usr/bin/env bash
# Polls the Resolution Tracker API for pending notifications and fires a native
# macOS notification via osascript. Designed to be launched by launchd on a
# recurring schedule (see scripts/com.resolution.notifier.plist).
set -euo pipefail

API_BASE="${RT_API_BASE:-http://127.0.0.1:8080}"
STATE_DIR="${RT_STATE_DIR:-${HOME}/.resolution-tracker}"
SEEN_FILE="${STATE_DIR}/seen-notifications"
LOG_FILE="${STATE_DIR}/host-notifier.log"

mkdir -p "${STATE_DIR}"
touch "${SEEN_FILE}" "${LOG_FILE}"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "${LOG_FILE}"
}

notify() {
  local title="$1"
  local message="$2"
  local escaped_title
  local escaped_message
  escaped_title="${title//\"/\\\"}"
  escaped_message="${message//\"/\\\"}"
  /usr/bin/osascript \
    -e "display notification \"${escaped_message}\" with title \"${escaped_title}\""
}

if ! command -v curl >/dev/null 2>&1; then
  log "curl not found; aborting"
  exit 1
fi

response=$(curl --fail --silent --show-error --max-time 5 "${API_BASE}/api/notifications/pending" || true)

if [[ -z "${response}" ]]; then
  log "empty response or API unreachable"
  exit 0
fi

python3 - <<'PY' "${response}" "${SEEN_FILE}" "${API_BASE}"
import json
import os
import subprocess
import sys
import urllib.request

payload, seen_path, api_base = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    items = json.loads(payload) or []
except json.JSONDecodeError:
    items = []

seen_ids = set()
if os.path.exists(seen_path):
    with open(seen_path, "r", encoding="utf-8") as handle:
        seen_ids = {line.strip() for line in handle if line.strip()}

new_ids = []
for item in items:
    identifier = str(item.get("id"))
    message = str(item.get("message", "")).replace('"', '\\"')
    if identifier in seen_ids:
        continue
    subprocess.run(
        [
            "/usr/bin/osascript",
            "-e",
            f'display notification "{message}" with title "Resolution Tracker"',
        ],
        check=False,
    )
    new_ids.append(identifier)
    try:
        req = urllib.request.Request(
            f"{api_base}/api/notifications/{identifier}/read", method="POST"
        )
        urllib.request.urlopen(req, timeout=5).close()
    except Exception:
        # Best effort; the next poll will retry.
        pass

if new_ids:
    with open(seen_path, "a", encoding="utf-8") as handle:
        for identifier in new_ids:
            handle.write(identifier + "\n")
PY

log "poll complete"
