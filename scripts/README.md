# macOS host notifier

The `host-notifier.sh` script polls the API for pending notifications and fires
real macOS "Banner" notifications via `osascript`. Use `launchd` to run it on a
schedule.

## Install

1. Edit `scripts/com.resolution.notifier.plist` and replace every
   `REPLACE_WITH_ABSOLUTE_PATH_TO_REPO` with the absolute path to this
   repository.
2. Copy the plist into place and load it:

   ```bash
   mkdir -p "$HOME/Library/LaunchAgents"
   cp scripts/com.resolution.notifier.plist "$HOME/Library/LaunchAgents/"
   launchctl unload "$HOME/Library/LaunchAgents/com.resolution.notifier.plist" 2>/dev/null || true
   launchctl load "$HOME/Library/LaunchAgents/com.resolution.notifier.plist"
   ```

3. Grant Terminal (or your automation app) permission to display notifications
   when macOS prompts.

## Test it

```bash
./scripts/host-notifier.sh          # fires once immediately
tail -f ~/.resolution-tracker/host-notifier.log
```

## Uninstall

```bash
launchctl unload "$HOME/Library/LaunchAgents/com.resolution.notifier.plist"
rm "$HOME/Library/LaunchAgents/com.resolution.notifier.plist"
```
