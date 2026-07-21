# Device Pass Log

Use this file during the final iPhone simulator or physical iPhone pass. The code can pass automated checks while still having mobile-only problems, so this log records what was actually tested by hand.

## Test Setup

- Date:
- Tester:
- Device or simulator:
- iOS version:
- Expo command used:
- App build:

## Required Pass Criteria

Mark each item as `Pass`, `Fail`, or `Needs follow-up`.

| Area | Result | Notes |
| --- | --- | --- |
| Room creation opens on the main Song Wars flow |  |  |
| Host name can be entered and locks after room creation |  |  |
| Guests can join with room code `7392` and temporary names |  |  |
| Duplicate guest names are blocked |  |  |
| Start Game stays disabled until at least 3 players are present |  |  |
| Room settings can be changed and stay within min/max limits |  |  |
| Topic keyboard Done starts the battle and dismisses the keyboard |  |  |
| Judge is skipped during song submissions |  |  |
| Song search can be typed, submitted from keyboard, and submitted from button |  |  |
| Search empty/loading/error states are understandable |  |  |
| Preview audio plays inside the app |  |  |
| Stop button stops preview while loading and while playing |  |  |
| Preview audio stops after song submit |  |  |
| Duplicate song submissions are blocked |  |  |
| Bracket shows current, pending, complete, and bye states clearly |  |  |
| Preview audio stops after picking a winner |  |  |
| Round result shows the correct winning song |  |  |
| Round result hides stale judging instructions and the completed bracket |  |  |
| Next Round uses the previous round winner as judge |  |  |
| Scores update correctly |  |  |
| Final winner screen appears at the points-to-win target |  |  |
| Play Again starts a clean game with the same room |  |  |
| Reset Room returns to room creation and leaves audio idle |  |  |
| No important text overlaps or gets cut off |  |  |
| Keyboard does not hide the active input |  |  |
| Core buttons are easy to tap on the device |  |  |
| Online room can be created with an anonymous host session |  |  |
| Second device can join by six-digit code |  |  |
| Second device can join by QR code/deep link |  |  |
| Online player list and settings sync across devices |  |  |
| Backgrounding and reopening a device refetches the latest room state |  |  |
| Home Resume Online Room returns to the correct active online room |  |  |
| Removed guest returns Home with a clear message |  |  |
| Host can close an online room and guests return Home |  |  |
| Online game starts only with at least 3 players |  |  |
| Online judge submits topic and all devices enter submissions |  |  |
| Online judge cannot submit songs |  |  |
| Online duplicate song submissions are blocked |  |  |
| Online submissions trigger bracket judging after all required songs are in |  |  |
| Online judge-only winner picking advances the bracket |  |  |
| Online scores update and round winner becomes next judge |  |  |
| Online final winner appears at the points-to-win target |  |  |
| Online Play Again resets gameplay without changing room players |  |  |
| Remote Sync mode shows locked synced-preview progress on all devices |  |  |

## Bugs Found

Record any device-only issue here before we fix it.

| Issue | Steps To Reproduce | Severity | Fixed Commit |
| --- | --- | --- | --- |
|  |  |  |  |

## Final Decision

- Prototype device pass status:
- Remaining fixes before frontend prototype complete:
