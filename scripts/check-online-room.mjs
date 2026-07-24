import { dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadLocalEnv();

const SESSION_CACHE_PATH = ".cache/online-room-check-sessions.json";
const SESSION_CACHE_VERSION = 2;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const shouldVerifyCapacity = process.env.CHECK_ONLINE_ROOM_CAPACITY === "1";
const sessionCacheProjectKey = getSessionCacheProjectKey(supabaseUrl);
const sessionCache = loadSessionCache();
const rpcMigrationHints = {
  close_room: "202607140001_online_room_lobby.sql",
  complete_game: "202607190003_online_round_judging.sql",
  complete_round: "202607190003_online_round_judging.sql",
  create_room: "202607140001_online_room_lobby.sql",
  create_round_bracket: "202607190003_online_round_judging.sql",
  get_room_snapshot: "202607140001_online_room_lobby.sql",
  get_server_time: "202607210001_online_playback_events.sql",
  join_room: "202607140001_online_room_lobby.sql",
  leave_room: "202607140001_online_room_lobby.sql",
  play_again: "202607190004_online_game_reset.sql",
  prepare_next_round: "202607190003_online_round_judging.sql",
  remove_own_submission: "202607190002_online_round_submissions.sql",
  remove_room_member: "202607140001_online_room_lobby.sql",
  schedule_matchup_preview: "202607210001_online_playback_events.sql",
  select_matchup_winner: "202607190003_online_round_judging.sql",
  start_room: "202607140001_online_room_lobby.sql",
  submit_round_song: "202607190002_online_round_submissions.sql",
  submit_round_topic: "202607190001_online_round_topic.sql",
  update_room_settings: "202607140001_online_room_lobby.sql",
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  console.log("Create a hosted Supabase dev project, apply migrations, then rerun this check.");
  process.exit(1);
}

const host = await createSignedInTestClient("host");
const guestOne = await createSignedInTestClient("guest one");
const guestTwo = await createSignedInTestClient("guest two");

await verifyRoomCannotStartEarly(host);
await verifyRemovalAndLeaveRules({
  closedGuest: guestOne,
  leaveGuest: guestTwo,
  removalHost: host,
  removedGuest: guestOne,
});

if (shouldVerifyCapacity) {
  await verifyCapacityLimit({
    reusableClients: [host, guestOne, guestTwo],
  });
} else {
  console.log("Skipping capacity check. Set CHECK_ONLINE_ROOM_CAPACITY=1 to run it.");
}

await verifyGameCompletionAndPlayAgain({
  guestOne,
  guestTwo,
  host,
});

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
const hostMemberId = created.members[0].id;

await expectRpcFailure(
  guestTwo,
  "get_room_snapshot",
  {
    room_id_value: roomId,
  },
  "nonmembers should not fetch room snapshots",
);

await expectTableUpdateFailure(
  guestTwo,
  "rooms",
  { points_to_win: 7 },
  roomId,
  async () => {
    const snapshot = await rpc(host, "get_room_snapshot", {
      room_id_value: roomId,
    });

    return snapshot.room.points_to_win === 3;
  },
  "direct room table updates should not change room settings",
);

await expectRpcFailure(
  guestOne,
  "join_room",
  {
    guest_display_name: "Maya",
    room_code: "000000",
  },
  "wrong room codes should be rejected",
);

await expectRpcFailure(
  guestOne,
  "join_room",
  {
    guest_display_name: " host ",
    room_code: roomCode,
  },
  "duplicate display names should be blocked case-insensitively",
);

const joinedOne = await rpc(guestOne, "join_room", {
  guest_display_name: "Maya",
  room_code: roomCode,
});

assert(joinedOne.members.length === 2, "first guest should join");
const guestOneMemberId = joinedOne.members.find((member) => member.display_name === "Maya")?.id;

const joinedTwo = await rpc(guestTwo, "join_room", {
  guest_display_name: "Jay",
  room_code: roomCode,
});

assert(joinedTwo.members.length === 3, "second guest should join");
const guestTwoMemberId = joinedTwo.members.find((member) => member.display_name === "Jay")?.id;

await expectRpcFailure(
  guestOne,
  "update_room_settings",
  {
    points_to_win_value: 2,
    room_id_value: roomId,
    room_mode: null,
    songs_per_player_value: null,
  },
  "guests should not update settings",
);

await expectRpcFailure(
  guestOne,
  "remove_room_member",
  {
    member_id_value: hostMemberId,
    room_id_value: roomId,
  },
  "guests should not remove room members",
);

await expectRpcFailure(
  guestOne,
  "start_room",
  {
    room_id_value: roomId,
  },
  "guests should not start the room",
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
assert(
  started.current_round?.judge_member_id === hostMemberId,
  "host should become the first judge",
);

await expectRpcFailure(
  guestOne,
  "submit_round_topic",
  {
    room_id_value: roomId,
    topic_value: "Beach vibes",
  },
  "guests should not submit the round topic",
);

const topicSubmitted = await rpc(host, "submit_round_topic", {
  room_id_value: roomId,
  topic_value: " Beach vibes ",
});

assert(topicSubmitted.current_round?.topic === "Beach vibes", "judge should submit the topic");
assert(
  topicSubmitted.current_round?.status === "submitting",
  "topic submission should move the round to submissions",
);

await expectRpcFailure(
  host,
  "submit_round_topic",
  {
    room_id_value: roomId,
    topic_value: "Late topic",
  },
  "topic should lock after submission",
);

await expectRpcFailure(
  host,
  "submit_round_song",
  makeSongArgs(roomId, 1),
  "judges should not submit songs",
);

await expectRpcFailure(
  guestOne,
  "submit_round_song",
  {
    ...makeSongArgs(roomId, 1000),
    preview_url_value: "",
  },
  "songs without playable previews should be blocked",
);

const firstSubmission = await rpc(guestOne, "submit_round_song", makeSongArgs(roomId, 1));
assert(firstSubmission.submissions.length === 1, "first contestant should submit a song");

await rpc(guestOne, "remove_own_submission", {
  room_id_value: roomId,
  submission_id_value: firstSubmission.submissions[0].id,
});

const resubmitted = await rpc(guestOne, "submit_round_song", makeSongArgs(roomId, 1));
assert(resubmitted.submissions.length === 1, "contestants should remove and resubmit songs");

await expectRpcFailure(
  guestTwo,
  "submit_round_song",
  makeSongArgs(roomId, 1),
  "duplicate songs should be blocked within the round",
);

const guestOneComplete = await rpc(guestOne, "submit_round_song", makeSongArgs(roomId, 2));
assert(
  guestOneComplete.current_round?.status === "submitting",
  "round should keep accepting songs until every contestant is done",
);

await rpc(guestTwo, "submit_round_song", makeSongArgs(roomId, 3));
const submissionsComplete = await rpc(guestTwo, "submit_round_song", makeSongArgs(roomId, 4));
assert(
  submissionsComplete.current_round?.status === "judging",
  "round should move to judging after every required song is submitted",
);
assert(
  submissionsComplete.submissions.length === 4,
  "two contestants with two songs each should create four submissions",
);
assert(
  submissionsComplete.matchups.length > 0,
  "completing submissions should create the judging bracket",
);

await expectRpcFailure(
  guestOne,
  "remove_own_submission",
  {
    room_id_value: roomId,
    submission_id_value: submissionsComplete.submissions[0].id,
  },
  "submissions should lock after the round moves to judging",
);

await expectRpcFailure(
  guestOne,
  "select_matchup_winner",
  {
    matchup_id_value: getReadyMatchup(submissionsComplete).id,
    room_id_value: roomId,
    winner_submission_id_value: getReadyMatchup(submissionsComplete).left_submission_id,
  },
  "contestants should not pick matchup winners",
);

await expectRpcFailure(
  guestOne,
  "schedule_matchup_preview",
  {
    lead_ms_value: 1500,
    matchup_id_value: getReadyMatchup(submissionsComplete).id,
    room_id_value: roomId,
    submission_id_value: getReadyMatchup(submissionsComplete).left_submission_id,
  },
  "contestants should not schedule synced previews",
);

const previewScheduled = await rpc(host, "schedule_matchup_preview", {
  lead_ms_value: 1500,
  matchup_id_value: getReadyMatchup(submissionsComplete).id,
  room_id_value: roomId,
  submission_id_value: getReadyMatchup(submissionsComplete).left_submission_id,
});

assert(
  previewScheduled.playback_events.length === 1,
  "judge should schedule a synced playback event",
);
assert(
  previewScheduled.playback_events[0].server_start_at,
  "synced playback events should include a server start time",
);

let judgingSnapshot = submissionsComplete;

while (judgingSnapshot.current_round?.status === "judging") {
  const readyMatchup = getReadyMatchup(judgingSnapshot);
  const winnerSubmissionId = readyMatchup.left_submission_id ?? readyMatchup.right_submission_id;

  assert(winnerSubmissionId, "ready matchups should include a selectable winner");

  judgingSnapshot = await rpc(host, "select_matchup_winner", {
    matchup_id_value: readyMatchup.id,
    room_id_value: roomId,
    winner_submission_id_value: winnerSubmissionId,
  });
}

assert(
  judgingSnapshot.current_round?.status === "complete",
  "judge selections should complete the round after the final matchup",
);
assert(
  judgingSnapshot.current_round?.winning_member_id,
  "completed rounds should store the winning member",
);
assert(
  judgingSnapshot.current_round?.winning_submission_id,
  "completed rounds should store the winning submission",
);
assert(
  judgingSnapshot.scores.some(
    (score) => score.member_id === judgingSnapshot.current_round.winning_member_id &&
      score.points === 1,
  ),
  "round winner should receive one point",
);

const roundWinnerClient =
  judgingSnapshot.current_round?.winning_member_id === guestOneMemberId
    ? guestOne
    : judgingSnapshot.current_round?.winning_member_id === guestTwoMemberId
      ? guestTwo
      : undefined;

if (roundWinnerClient) {
  await expectRpcFailure(
    roundWinnerClient,
    "prepare_next_round",
    {
      room_id_value: roomId,
    },
    "round winners should not start the next round unless they are the host",
  );
}

const nextRound = await rpc(host, "prepare_next_round", {
  room_id_value: roomId,
});

assert(nextRound.current_round?.round_number === 2, "next round should increment round number");
assert(
  nextRound.current_round?.judge_member_id === judgingSnapshot.current_round.winning_member_id,
  "round winner should become the next judge",
);
assert(
  nextRound.current_round?.status === "waiting_for_topic",
  "next round should wait for a new topic",
);

await rpc(guestTwo, "leave_room", {
  room_id_value: roomId,
});
await expectRpcFailure(
  guestTwo,
  "join_room",
  {
    guest_display_name: "Late",
    room_code: roomCode,
  },
  "started rooms should reject old room codes because the code is cleared",
);

console.log("Online room hosted Supabase check passed.");

async function verifyRoomCannotStartEarly(shortRoomHost) {
  const shortRoom = await rpc(shortRoomHost, "create_room", {
    host_display_name: "Solo",
    points_to_win_value: 3,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });

  await expectRpcFailure(
    shortRoomHost,
    "start_room",
    {
      room_id_value: shortRoom.room.id,
    },
    "rooms should require at least three players before start",
  );
}

async function verifyRemovalAndLeaveRules({
  closedGuest,
  leaveGuest,
  removalHost,
  removedGuest,
}) {
  const removalRoom = await rpc(removalHost, "create_room", {
    host_display_name: "Host",
    points_to_win_value: 3,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });

  const removedGuestRoom = await rpc(removedGuest, "join_room", {
    guest_display_name: "Removed",
    room_code: removalRoom.room.code,
  });
  const removedMember = removedGuestRoom.members.find(
    (member) => member.display_name === "Removed",
  );

  assert(removedMember, "removed guest member should exist before removal");

  await rpc(removalHost, "remove_room_member", {
    member_id_value: removedMember.id,
    room_id_value: removalRoom.room.id,
  });

  await expectRpcFailure(
    removedGuest,
    "get_room_snapshot",
    {
      room_id_value: removalRoom.room.id,
    },
    "removed guests should lose room access",
  );

  const leaveRoom = await rpc(removalHost, "create_room", {
    host_display_name: "Second Host",
    points_to_win_value: 3,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });

  await rpc(leaveGuest, "join_room", {
    guest_display_name: "Leaver",
    room_code: leaveRoom.room.code,
  });
  await rpc(leaveGuest, "leave_room", {
    room_id_value: leaveRoom.room.id,
  });
  await expectRpcFailure(
    leaveGuest,
    "get_room_snapshot",
    {
      room_id_value: leaveRoom.room.id,
    },
    "guests who leave should lose room access",
  );

  const closeRoom = await rpc(removalHost, "create_room", {
    host_display_name: "Closer",
    points_to_win_value: 3,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });
  const closeCode = closeRoom.room.code;
  const closed = await rpc(removalHost, "close_room", {
    room_id_value: closeRoom.room.id,
  });

  assert(closed.room.status === "closed", "host should close rooms");
  assert(closed.room.code === null, "closed rooms should clear join code");

  await expectRpcFailure(
    closedGuest,
    "join_room",
    {
      guest_display_name: "Closed",
      room_code: closeCode,
    },
    "closed rooms should reject new joins",
  );
}

async function verifyCapacityLimit({ reusableClients }) {
  const [capacityHost, ...reusableGuests] = reusableClients;
  const capacityGuests = [...reusableGuests];

  for (let index = capacityGuests.length; index < 12; index += 1) {
    capacityGuests.push(await createSignedInTestClient(`capacity guest ${index + 1}`));
  }

  const capacityRoom = await rpc(capacityHost, "create_room", {
    host_display_name: "Capacity Host",
    points_to_win_value: 3,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });

  let latestSnapshot = capacityRoom;

  for (let index = 0; index < 11; index += 1) {
    latestSnapshot = await rpc(capacityGuests[index], "join_room", {
      guest_display_name: `Guest ${index + 1}`,
      room_code: capacityRoom.room.code,
    });
  }

  assert(latestSnapshot.members.length === 12, "room capacity should be twelve players");

  await expectRpcFailure(
    capacityGuests[11],
    "join_room",
    {
      guest_display_name: "Guest 12",
      room_code: capacityRoom.room.code,
    },
    "rooms should reject the thirteenth player",
  );
}

async function verifyGameCompletionAndPlayAgain({ guestOne, guestTwo, host }) {
  const restartRoom = await rpc(host, "create_room", {
    host_display_name: "Restart Host",
    points_to_win_value: 1,
    room_mode: "single_speaker",
    songs_per_player_value: 1,
  });

  await rpc(guestOne, "join_room", {
    guest_display_name: "Restart Maya",
    room_code: restartRoom.room.code,
  });
  await rpc(guestTwo, "join_room", {
    guest_display_name: "Restart Jay",
    room_code: restartRoom.room.code,
  });
  await rpc(host, "start_room", {
    room_id_value: restartRoom.room.id,
  });
  await rpc(host, "submit_round_topic", {
    room_id_value: restartRoom.room.id,
    topic_value: "Road trip",
  });
  await rpc(guestOne, "submit_round_song", makeSongArgs(restartRoom.room.id, 101));
  const readyToJudge = await rpc(
    guestTwo,
    "submit_round_song",
    makeSongArgs(restartRoom.room.id, 102),
  );
  const readyMatchup = getReadyMatchup(readyToJudge);
  const finalWinnerSubmissionId = readyMatchup.left_submission_id ?? readyMatchup.right_submission_id;

  assert(finalWinnerSubmissionId, "restart scenario should have a final winner candidate");

  const gameComplete = await rpc(host, "select_matchup_winner", {
    matchup_id_value: readyMatchup.id,
    room_id_value: restartRoom.room.id,
    winner_submission_id_value: finalWinnerSubmissionId,
  });

  assert(gameComplete.room.status === "complete", "first-to-one game should complete");
  assert(gameComplete.room.game_winner_member_id, "completed game should store a winner");

  await expectRpcFailure(
    guestOne,
    "play_again",
    {
      room_id_value: restartRoom.room.id,
    },
    "guests should not restart completed games",
  );

  const restarted = await rpc(host, "play_again", {
    room_id_value: restartRoom.room.id,
  });

  assert(restarted.room.status === "in_round", "play again should restart the game");
  assert(restarted.room.game_winner_member_id === null, "play again should clear game winner");
  assert(restarted.current_round?.round_number === 1, "play again should create a new round one");
  assert(
    restarted.current_round?.status === "waiting_for_topic",
    "play again should wait for a fresh topic",
  );
  assert(restarted.submissions.length === 0, "play again should clear submissions");
  assert(restarted.matchups.length === 0, "play again should clear matchups");
  assert(restarted.scores.length === 0, "play again should clear scores");

  const closedAfterRestart = await rpc(host, "close_room", {
    room_id_value: restartRoom.room.id,
  });

  assert(closedAfterRestart.room.status === "closed", "host should close restarted rooms");
}

async function createSignedInTestClient(label) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const cachedSession = readCachedSession(label);

  if (cachedSession?.access_token && cachedSession?.refresh_token) {
    const restoreResult = await client.auth.setSession({
      access_token: cachedSession.access_token,
      refresh_token: cachedSession.refresh_token,
    });

    if (!restoreResult.error && restoreResult.data.session) {
      saveSession(label, restoreResult.data.session);
      console.log(`Reused cached anonymous test session for ${label}.`);
      return client;
    }

    forgetSession(label);
  }

  const result = await client.auth.signInAnonymously();

  if (result.error) {
    if (result.error.message.toLowerCase().includes("anonymous sign-ins are disabled")) {
      throw new Error(
        `Could not sign in ${label}: Anonymous sign-ins are disabled. Enable them in Supabase Auth before running this check.`,
      );
    }

    if (result.error.message.toLowerCase().includes("rate limit")) {
      throw new Error(
        `Could not sign in ${label}: Supabase anonymous auth rate limit reached. Wait for the rate-limit window to reset, then rerun this check.`,
      );
    }

    throw new Error(`Could not sign in ${label}: ${result.error.message}`);
  }

  if (result.data.session) {
    saveSession(label, result.data.session);
    console.log(`Created and cached anonymous test session for ${label}.`);
  }

  return client;
}

async function rpc(client, functionName, args) {
  const result = await client.rpc(functionName, args);

  if (result.error) {
    if (result.error.message.toLowerCase().includes("could not find the function")) {
      throw new Error(
        getMissingRpcMessage(functionName),
      );
    }

    throw new Error(`${functionName} failed: ${result.error.message}`);
  }

  return result.data;
}

function getMissingRpcMessage(functionName) {
  const migrationHint = rpcMigrationHints[functionName];
  const migrationHintText = migrationHint
    ? ` This RPC is expected from \`${migrationHint}\`; to print only that file, run \`npm run print:supabase-migration -- ${migrationHint}\`.`
    : "";

  return `${functionName} failed: RPC is missing from Supabase.${migrationHintText} Run \`npm run print:supabase-migrations\`, paste the printed SQL into the Supabase SQL editor, run it, then wait for the Supabase schema cache to refresh. If the SQL editor previously failed with ERROR 42501 on realtime.messages, run \`npm run print:supabase-migrations:core\` instead to apply the core game schema first.`;
}

async function expectRpcFailure(client, functionName, args, message) {
  const result = await client.rpc(functionName, args);

  if (!result.error) {
    throw new Error(message);
  }
}

async function expectTableUpdateFailure(
  client,
  tableName,
  values,
  rowId,
  didRemainUnchanged,
  message,
) {
  const result = await client.from(tableName).update(values).eq("id", rowId);

  if (!result.error && !(await didRemainUnchanged())) {
    throw new Error(message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeSongArgs(roomId, index) {
  return {
    album_name_value: `Album ${index}`,
    artists_value: [`Artist ${index}`],
    artwork_url_value: `https://example.com/artwork-${index}.jpg`,
    preview_url_value: `https://example.com/preview-${index}.m4a`,
    provider_refs_value: [
      {
        providerId: "apple_itunes",
        providerTrackId: `apple-${index}`,
        url: `https://example.com/song-${index}`,
      },
    ],
    room_id_value: roomId,
    title_value: `Song ${index}`,
    track_id_value: `track-${index}`,
  };
}

function getReadyMatchup(snapshot) {
  const matchup = snapshot.matchups.find((item) => item.status === "ready");

  assert(matchup, "snapshot should include a ready matchup");

  return matchup;
}

function loadLocalEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadSessionCache() {
  if (!existsSync(SESSION_CACHE_PATH)) {
    return createEmptySessionCache();
  }

  try {
    const parsed = JSON.parse(readFileSync(SESSION_CACHE_PATH, "utf8"));

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return createEmptySessionCache();
    }

    if (parsed.projects && typeof parsed.projects === "object" && !Array.isArray(parsed.projects)) {
      return {
        projects: parsed.projects,
        version: SESSION_CACHE_VERSION,
      };
    }

    return migrateLegacySessionCache(parsed);
  } catch {
    return createEmptySessionCache();
  }
}

function readCachedSession(label) {
  const cachedSession = getProjectSessionCache()[sessionCacheKey(label)];

  if (
    !cachedSession ||
    typeof cachedSession !== "object" ||
    Array.isArray(cachedSession) ||
    typeof cachedSession.access_token !== "string" ||
    typeof cachedSession.refresh_token !== "string"
  ) {
    return undefined;
  }

  return cachedSession;
}

function saveSession(label, session) {
  getProjectSessionCache()[sessionCacheKey(label)] = {
    access_token: session.access_token,
    expires_at: session.expires_at ?? null,
    refresh_token: session.refresh_token,
    updated_at: new Date().toISOString(),
    user_id: session.user?.id ?? null,
  };

  writeSessionCache();
}

function forgetSession(label) {
  delete getProjectSessionCache()[sessionCacheKey(label)];
  writeSessionCache();
}

function writeSessionCache() {
  mkdirSync(dirname(SESSION_CACHE_PATH), { recursive: true });
  writeFileSync(SESSION_CACHE_PATH, `${JSON.stringify(sessionCache, null, 2)}\n`);
}

function getProjectSessionCache() {
  sessionCache.projects[sessionCacheProjectKey] ??= {};

  return sessionCache.projects[sessionCacheProjectKey];
}

function createEmptySessionCache() {
  return {
    projects: {},
    version: SESSION_CACHE_VERSION,
  };
}

function migrateLegacySessionCache(legacyCache) {
  const nextCache = createEmptySessionCache();
  const projectCache = {};

  for (const [key, value] of Object.entries(legacyCache)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.access_token === "string" &&
      typeof value.refresh_token === "string"
    ) {
      projectCache[key] = {
        access_token: value.access_token,
        expires_at: value.expires_at ?? null,
        refresh_token: value.refresh_token,
        updated_at: value.updated_at ?? null,
        user_id: value.user_id ?? null,
      };
    }
  }

  nextCache.projects[sessionCacheProjectKey] = projectCache;

  return nextCache;
}

function getSessionCacheProjectKey(projectUrl) {
  if (!projectUrl) {
    return "missing-project-url";
  }

  try {
    return new URL(projectUrl).host.toLowerCase();
  } catch {
    return "invalid-project-url";
  }
}

function sessionCacheKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
