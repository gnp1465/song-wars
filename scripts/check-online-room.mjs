import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  console.log("Create a hosted Supabase dev project, apply migrations, then rerun this check.");
  process.exit(1);
}

const host = createTestClient();
const guestOne = createTestClient();
const guestTwo = createTestClient();
const outsider = createTestClient();

await signInAnonymously(host, "host");
await signInAnonymously(guestOne, "guest one");
await signInAnonymously(guestTwo, "guest two");
await signInAnonymously(outsider, "outsider");

const created = await rpc(host, "create_room", {
  host_display_name: "Host",
  points_to_win_value: 3,
  room_mode: "single_speaker",
  songs_per_player_value: 1,
});

assert(created.room.code && /^\d{6}$/.test(created.room.code), "room code should be six digits");
assert(created.members.length === 1, "created room should start with host only");

const roomId = created.room.id;
const roomCode = created.room.code;

await expectRpcFailure(
  guestOne,
  "join_room",
  {
    guest_display_name: "host",
    room_code: roomCode,
  },
  "duplicate display names should be blocked",
);

const joinedOne = await rpc(guestOne, "join_room", {
  guest_display_name: "Maya",
  room_code: roomCode,
});

assert(joinedOne.members.length === 2, "first guest should join");

const joinedTwo = await rpc(guestTwo, "join_room", {
  guest_display_name: "Jay",
  room_code: roomCode,
});

assert(joinedTwo.members.length === 3, "second guest should join");

await expectRpcFailure(
  outsider,
  "update_room_settings",
  {
    points_to_win_value: 2,
    room_id_value: roomId,
    room_mode: null,
    songs_per_player_value: null,
  },
  "nonmembers should not update settings",
);

const updated = await rpc(host, "update_room_settings", {
  points_to_win_value: 2,
  room_id_value: roomId,
  room_mode: "remote",
  songs_per_player_value: 2,
});

assert(updated.room.mode === "remote", "host should update room mode");
assert(updated.room.points_to_win === 2, "host should update points to win");
assert(updated.room.songs_per_player === 2, "host should update songs per player");

const started = await rpc(host, "start_room", {
  room_id_value: roomId,
});

assert(started.room.status === "in_round", "host should start the room");
assert(started.room.code === null, "started room should clear join code");
assert(started.current_round?.round_number === 1, "starting room should create round one");

console.log("Online room hosted Supabase check passed.");

function createTestClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function signInAnonymously(client, label) {
  const result = await client.auth.signInAnonymously();

  if (result.error) {
    throw new Error(`Could not sign in ${label}: ${result.error.message}`);
  }
}

async function rpc(client, functionName, args) {
  const result = await client.rpc(functionName, args);

  if (result.error) {
    throw new Error(`${functionName} failed: ${result.error.message}`);
  }

  return result.data;
}

async function expectRpcFailure(client, functionName, args, message) {
  const result = await client.rpc(functionName, args);

  if (!result.error) {
    throw new Error(message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
