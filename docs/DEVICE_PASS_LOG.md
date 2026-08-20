# Device Pass Log

Use this file during the final iPhone simulator or physical iPhone pass. The code can pass automated checks while still having mobile-only problems, so this log records what was actually tested by hand.

## Test Setup

- Date: 2026-08-20
- Tester: Gustavo Poleto
- Device or simulator: MacBook Pro iOS simulator, physical iPhone 14, and physical iPad
- iOS version: Latest available versions installed on the test devices (exact version numbers not recorded)
- Expo command used: `npm run ios`
- App build: Expo development build from `main`

## Required Pass Criteria

Mark each item as `Pass`, `Fail`, or `Needs follow-up`.

| Area | Result | Notes |
| --- | --- | --- |
| Room creation opens on the main Song Wars flow | Pass | Confirmed during the completed game pass. |
| Host name can be entered and locks after room creation | Pass | Confirmed during room setup. |
| Guests can join with room code `7392` and temporary names | Pass | Local prototype flow passed. |
| Duplicate guest names are blocked | Pass | Duplicate-name guard passed. |
| Start Game stays disabled until at least 3 players are present | Pass | Three-player minimum passed. |
| Room settings can be changed and stay within min/max limits | Pass | Settings passed during room setup. |
| Topic keyboard Done starts the battle and dismisses the keyboard | Pass | Topic entry passed. |
| Judge is skipped during song submissions | Pass | Judge role restriction passed. |
| Song search can be typed, submitted from keyboard, and submitted from button | Pass | Both search actions passed. |
| Search empty/loading/error states are understandable | Pass | Search states passed. |
| Preview audio plays inside the app | Pass | In-app preview passed. |
| Stop button stops preview while loading and while playing | Pass | Preview controls passed. |
| Preview audio stops after song submit | Pass | Audio cleanup passed. |
| Duplicate song submissions are blocked | Pass | Duplicate submission guard passed. |
| Bracket shows current, pending, complete, and bye states clearly | Pass | Bracket flow passed. |
| Preview audio stops after picking a winner | Pass | Audio cleanup passed. |
| Round result shows the correct winning song | Pass | Round result passed. |
| Round result hides stale judging instructions and the completed bracket | Pass | Completed-round layout passed. |
| Next Round uses the previous round winner as judge | Pass | Judge rotation passed. |
| Scores update correctly | Pass | Score progression passed. |
| Final winner screen appears at the points-to-win target | Pass | Full game completed. |
| Play Again starts a clean game with the same room | Pass | Reset game flow passed. |
| Reset Room returns to room creation and leaves audio idle | Pass | Full room reset passed. |
| No important text overlaps or gets cut off | Pass | Checked across the three test surfaces. |
| Keyboard does not hide the active input | Pass | Keyboard behavior passed. |
| Core buttons are easy to tap on the device | Pass | Physical-device controls passed. |
| Online room can be created with an anonymous host session | Pass | Online host creation passed. |
| Online lobby shows the room is temporary/expiring | Pass | Lobby status passed. |
| Second device can join by six-digit code | Pass | Multi-device join passed. |
| Second device can join by QR code/deep link | Pass | Invite join passed. |
| Native Share Invite opens the iOS share sheet with room code/link | Pass | Native share passed. |
| Online player list and settings sync across devices | Pass | Three-device Realtime sync passed. |
| Backgrounding and reopening a device refetches the latest room state | Pass | Resume synchronization passed. |
| Active online game shows online/offline presence summary | Pass | Presence fallback and joined count passed. |
| Home Resume Online Room returns to the correct active online room | Pass | Resume action passed. |
| Removed guest returns Home with a clear message | Pass | Removal flow passed. |
| Host can close an online room and guests return Home | Pass | Lobby close passed. |
| Host can close an online room during active gameplay | Pass | Active-room close passed. |
| Guest can leave an online room during active gameplay | Pass | Active-room leave passed. |
| Online game starts only with at least 3 players | Pass | Three-player rule passed. |
| Online judge submits topic and all devices enter submissions | Pass | Topic synchronization passed. |
| Online judge cannot submit songs | Pass | Server and UI restriction passed. |
| Online duplicate song submissions are blocked | Pass | Server duplicate guard passed. |
| Online submissions trigger bracket judging after all required songs are in | Pass | Submission transition passed. |
| Online judge-only winner picking advances the bracket | Pass | Judge authorization passed. |
| Online scores update and round winner becomes next judge | Pass | Score and role updates passed. |
| Online final winner appears at the points-to-win target | Pass | Full online game completed. |
| Online Play Again resets gameplay without changing room players | Pass | Online reset passed. |
| Remote Sync mode shows locked synced-preview progress on all devices | Pass | Remote playback UI passed. |

## Bugs Found

Record any device-only issue here before we fix it.

| Issue | Steps To Reproduce | Severity | Fixed Commit |
| --- | --- | --- | --- |
| No unresolved issues in final pass | Full three-device game flow | None | N/A |

## Final Decision

- Prototype device pass status: Pass
- Remaining fixes before frontend prototype complete: None
