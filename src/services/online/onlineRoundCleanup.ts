export type OnlineRoundCleanupAction =
  | "submission_submitted"
  | "submission_removed"
  | "matchup_winner_picked"
  | "synced_preview_scheduled"
  | "next_round_started"
  | "game_restarted"
  | "room_closed"
  | "room_left"
  | "home_navigation";

export interface OnlineRoundCleanupPlan {
  audioStatus: string;
  clearPreviewCache: boolean;
  clearSearchResults: boolean;
}

export function getOnlineRoundCleanupPlan(
  action: OnlineRoundCleanupAction,
): OnlineRoundCleanupPlan {
  if (action === "submission_submitted") {
    return {
      audioStatus: "Submitted",
      clearPreviewCache: false,
      clearSearchResults: true,
    };
  }

  if (action === "submission_removed") {
    return {
      audioStatus: "Removed submission",
      clearPreviewCache: false,
      clearSearchResults: false,
    };
  }

  if (action === "matchup_winner_picked") {
    return {
      audioStatus: "Winner picked",
      clearPreviewCache: false,
      clearSearchResults: false,
    };
  }

  if (action === "synced_preview_scheduled") {
    return {
      audioStatus: "Scheduling synced preview",
      clearPreviewCache: false,
      clearSearchResults: false,
    };
  }

  return {
    audioStatus: "No preview playing",
    clearPreviewCache: true,
    clearSearchResults:
      action === "next_round_started" ||
      action === "game_restarted" ||
      action === "home_navigation",
  };
}
