# Glossary

Short definitions for terms used in this project.

## React / React Native

### Component

A reusable piece of UI.

Example:

```tsx
<Scoreboard players={players} scores={scores} />
```

Memorize: components describe what appears on screen.

### Props

Data passed from a parent component to a child component.

Example:

```tsx
<LocalBattleDemoScreen players={roomPlayers} />
```

`players` is a prop.

Memorize: props flow down from parent to child.

### State

Data a component owns and can change over time.

Example:

```ts
const [guestName, setGuestName] = useState("");
```

Memorize: when state changes, React can re-render the screen.

### Hook

A reusable function that gives a component behavior or state.

Example:

```ts
const { audioStatus, playSongPreview } = usePreviewAudio();
```

Memorize: hooks are reusable behavior.

### Controlled Input

A text input where the displayed value comes from React state.

Example:

```tsx
<TextInput value={guestName} onChangeText={setGuestName} />
```

Memorize: the input and state stay synced.

### Conditional Rendering

Showing different UI depending on state.

Example:

```tsx
{hasStartedGame ? <Game /> : <RoomSetup />}
```

Memorize: screens can have multiple steps without changing files.

## TypeScript

### Type

A data shape.

Example:

```ts
type RoomMode = "remote" | "single_speaker";
```

Memorize: types help TypeScript catch invalid data.

### Interface

A named object shape.

Example:

```ts
interface Player {
  id: string;
  displayName: string;
}
```

Memorize: interfaces are contracts for objects.

### Optional Property

A property that may or may not exist.

Example:

```ts
errorMessage?: string;
```

Memorize: `?` means the value can be missing.

## App Architecture

### Screen

A full app view, usually responsible for a user flow.

Example:

```text
RoomFlowDemoScreen
```

Memorize: screens coordinate components, hooks, and state.

### Service

Code that handles business logic or provider/API logic.

Example:

```text
services/game/bracket.ts
```

Memorize: services should be testable without opening the app.

### Provider

A wrapper around an external or mock data source.

Example:

```text
AppleITunesProvider
MockSpotifyProvider
```

Memorize: providers make different music sources look the same to the app.

### Hook vs Service

A hook is React-specific and can use React state.

A service is plain logic and should not depend on React.

Memorize: hooks help screens; services hold app rules.

## Programming Concepts

### Pure Function

A function that returns the same output for the same input and does not change outside state.

Example:

```ts
getNextPowerOfTwo(6); // 8
```

Memorize: pure functions are easier to test.

### Side Effect

Something a function does outside returning a value.

Examples:

- playing audio
- calling an API
- updating React state
- writing to a database

Memorize: side effects need careful cleanup.

### Validation

Checking input before allowing an action.

Example:

```ts
if (joinCodeInput !== DEMO_ROOM_CODE) {
  setJoinError("Room code does not match.");
}
```

Memorize: validation protects the flow from bad input.

### Dependency Injection

Passing a dependency in instead of hardcoding it.

Example:

```ts
useSongSearch({ provider: spotifyProvider })
```

Memorize: dependency injection makes code easier to swap and test.

## Git

### Commit

A saved checkpoint in the project history.

Memorize: commits let you see and recover changes.

### Push

Uploading local commits to GitHub.

Memorize: local commit saves on your machine; push saves to GitHub.
