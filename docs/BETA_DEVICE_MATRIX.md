# Beta Device Matrix

Use this checklist before calling a build ready for multiplayer beta testing. The goal is not to test every Apple device ever made. The goal is to cover the device and network situations most likely to break Song Wars.

## Required Before Beta

- One recent iPhone with the newest iOS version available to the tester.
- One older supported iPhone, ideally 2 or more major iOS versions behind the newest tester device.
- One iOS Simulator for fast layout checks.
- At least two physical devices in the same online room.
- At least three total players in one online room, using either three devices or two devices plus one simulator.

## Screen Sizes

- Small iPhone screen: confirm lobby, search, judging, final winner, and keyboard behavior.
- Standard iPhone screen: confirm the full local and online game loop.
- Large iPhone screen: confirm the app does not look overly stretched or sparse.
- Landscape orientation is not a required beta target unless we explicitly add landscape support later.

## Audio Scenarios

- Device speaker playback.
- Bluetooth speaker playback.
- Hardware silent switch enabled.
- Preview starts and stops in local song submission.
- Preview starts and stops in online song submission.
- Preview stops after submit, winner pick, next matchup, next round, play again, leave room, and close room.
- Preview unavailable state is understandable and does not block the rest of the room.

## Multiplayer Scenarios

- Host creates an online room.
- Guest joins using the six-digit code.
- Guest joins using the QR/deep-link invite.
- Host changes songs per player and points to win.
- Guests see settings update live.
- Host removes a guest.
- Removed guest returns Home with a clear notice.
- Guest leaves voluntarily.
- Host closes the room.
- Everyone returns Home or sees the correct closed-room state.
- Start is blocked with fewer than three players.
- Start succeeds with at least three players.
- All devices reach Round 1 setup together.
- Full online game reaches a final winner.

## Network Scenarios

- Normal Wi-Fi.
- Cellular or personal hotspot.
- Guest temporarily backgrounds the app and returns.
- Guest loses network, appears offline, then reconnects.
- Host loses network and reconnects.
- Reopened app restores the last online room when the anonymous session still has access.
- Closed, expired, or removed rooms do not resume.

## Storefront And Search Scenarios

- Search common songs.
- Search less common artists.
- Confirm search results use playable preview URLs when available.
- Confirm duplicate songs are blocked in the same round.
- Confirm judge cannot submit songs.
- Confirm display-name duplicates are blocked in the lobby.

## App Store Readiness Scenarios

- App icon appears correctly on the Home Screen.
- Splash screen appears and does not flash broken colors.
- Privacy policy draft still matches what the app collects.
- App Store metadata draft does not promise features that are not implemented yet.
- `.env.production` exists locally for release builds and is not committed.

## Recording Results

Record the actual pass/fail notes in `docs/DEVICE_PASS_LOG.md`. This matrix defines what to test; the pass log records what happened on real hardware.
