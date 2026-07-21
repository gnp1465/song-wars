# Beta Build Record

Use this file when deciding whether a specific build is ready for beta testers. The build record connects code, backend, device testing, and known limitations to one decision.

## Build Identity

- Decision date:
- Decision owner:
- Git commit SHA:
- App version:
- iOS build number:
- EAS build profile:
- EAS build URL:
- Supabase project:
- Supabase migration status:

## Verification Evidence

Mark each item as `Pass`, `Fail`, or `Needs follow-up`.

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm run verify` |  |  |
| `npm run check:online-room` |  |  |
| `npm run check:device-pass-log` |  |  |
| `npm run check:eas-build-config` |  |  |
| GitHub Actions verify workflow |  |  |
| Two-device online room test |  |  |
| Full online game to final winner |  |  |
| Preview audio stop behavior |  |  |
| Privacy policy review |  |  |
| App Store metadata review |  |  |

## Test Coverage

- Tester names:
- Physical devices tested:
- Simulator devices tested:
- iOS versions tested:
- Network scenarios tested:
- Audio routes tested:

## Known Accepted Limitations

Every beta can have limitations, but they must be intentional.

| Limitation | User impact | Accepted by |
| --- | --- | --- |
|  |  |  |

## Final Decision

- Beta build status:
- Remaining blockers:
- Release notes for testers:
