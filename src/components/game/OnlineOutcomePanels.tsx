import { StyleSheet, Text, View } from "react-native";
import type { Player } from "../../types/game";
import type { MediaTrack } from "../../types/media";
import type { PlayerScore } from "../../services/game/scoring";
import { GameOverPanel } from "./GameOverPanel";
import { RoundResultPanel } from "./RoundResultPanel";
import { Scoreboard } from "./Scoreboard";

export interface OnlineRoundCompletePanelProps {
  canPrepareNextRound: boolean;
  players: Player[];
  scores: PlayerScore[];
  winningSong?: MediaTrack;
  winnerName?: string;
  onStartNextRound: () => void;
}

export function OnlineRoundCompletePanel({
  canPrepareNextRound,
  players,
  scores,
  winningSong,
  winnerName,
  onStartNextRound,
}: OnlineRoundCompletePanelProps) {
  return (
    <View style={styles.panel}>
      {winnerName && winningSong ? (
        canPrepareNextRound ? (
          <RoundResultPanel
            winnerName={winnerName}
            winningSongLabel={`Winning song: ${winningSong.title} by ${winningSong.artists.join(", ")}`}
            onStartNextRound={onStartNextRound}
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Round complete</Text>
            <Text style={styles.resultName}>{winnerName} wins</Text>
            <Text style={styles.body}>Waiting for the host to start the next round.</Text>
          </>
        )
      ) : (
        <Text style={styles.body}>Round complete.</Text>
      )}
      <Scoreboard players={players} scores={scores} />
    </View>
  );
}

export interface OnlineGameCompletePanelProps {
  gameWinnerName?: string;
  isHost: boolean;
  players: Player[];
  pointsToWin: number;
  scores: PlayerScore[];
  winningSong?: MediaTrack;
  onPlayAgain: () => void;
  onResetRoom: () => void;
}

export function OnlineGameCompletePanel({
  gameWinnerName,
  isHost,
  players,
  pointsToWin,
  scores,
  winningSong,
  onPlayAgain,
  onResetRoom,
}: OnlineGameCompletePanelProps) {
  return (
    <View style={styles.panel}>
      {isHost && gameWinnerName ? (
        <GameOverPanel
          players={players}
          pointsToWin={pointsToWin}
          scores={scores}
          winnerName={gameWinnerName}
          onPlayAgain={onPlayAgain}
          onResetRoom={onResetRoom}
        />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Game complete</Text>
          <Text style={styles.resultName}>{gameWinnerName ?? "Winner"} wins</Text>
          {winningSong ? (
            <Text style={styles.body}>
              Final song: {winningSong.title} by {winningSong.artists.join(", ")}
            </Text>
          ) : null}
          <Text style={styles.body}>Waiting for the host to play again or reset the room.</Text>
          <Scoreboard players={players} scores={scores} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  panel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  resultName: {
    color: "#F9FAFB",
    fontSize: 26,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
