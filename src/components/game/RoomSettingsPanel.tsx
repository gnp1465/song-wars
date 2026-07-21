import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MAX_POINTS_TO_WIN,
  MAX_SONGS_PER_PLAYER,
  MIN_POINTS_TO_WIN,
  MIN_SONGS_PER_PLAYER,
} from "../../services/game/room";
import type { RoomMode } from "../../types/game";

export interface RoomSettingsPanelProps {
  disabled?: boolean;
  mode: RoomMode;
  pointsToWin: number;
  songsPerPlayer: number;
  onModeChange: (mode: RoomMode) => void;
  onPointsToWinChange: (pointsToWin: number) => void;
  onSongsPerPlayerChange: (songsPerPlayer: number) => void;
}

export function RoomSettingsPanel({
  disabled = false,
  mode,
  pointsToWin,
  songsPerPlayer,
  onModeChange,
  onPointsToWinChange,
  onSongsPerPlayerChange,
}: RoomSettingsPanelProps) {
  return (
    <View style={[styles.panel, disabled ? styles.disabledPanel : undefined]}>
      <Text style={styles.sectionTitle}>Room settings</Text>
      <View style={styles.settingBlock}>
        <Text style={styles.settingLabel}>Audio mode</Text>
        <View style={styles.modeRow}>
          <ModeButton
            disabled={disabled}
            isSelected={mode === "single_speaker"}
            label="Single Speaker"
            onPress={() => onModeChange("single_speaker")}
          />
          <ModeButton
            disabled={disabled}
            isSelected={mode === "remote"}
            label="Remote Sync"
            onPress={() => onModeChange("remote")}
          />
        </View>
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingLabel}>Songs per player</Text>
          <Text style={styles.settingHint}>
            {MIN_SONGS_PER_PLAYER}-{MAX_SONGS_PER_PLAYER} songs
          </Text>
        </View>
        <SettingStepper
          label="songs per player"
          disabled={disabled}
          maxValue={MAX_SONGS_PER_PLAYER}
          minValue={MIN_SONGS_PER_PLAYER}
          value={songsPerPlayer}
          onChange={onSongsPerPlayerChange}
        />
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingLabel}>Points to win</Text>
          <Text style={styles.settingHint}>
            {MIN_POINTS_TO_WIN}-{MAX_POINTS_TO_WIN} points
          </Text>
        </View>
        <SettingStepper
          label="points to win"
          disabled={disabled}
          maxValue={MAX_POINTS_TO_WIN}
          minValue={MIN_POINTS_TO_WIN}
          value={pointsToWin}
          onChange={onPointsToWinChange}
        />
      </View>
    </View>
  );
}

interface ModeButtonProps {
  disabled: boolean;
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

function ModeButton({ disabled, isSelected, label, onPress }: ModeButtonProps) {
  const isDisabled = disabled || isSelected;

  return (
    <Pressable
      accessibilityLabel={`${label} audio mode`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      disabled={isDisabled}
      style={[
        styles.modeButton,
        isSelected ? styles.selectedModeButton : undefined,
        isDisabled && !isSelected ? styles.disabledStepperButton : undefined,
      ]}
      onPress={onPress}
    >
      <Text
        style={[styles.modeButtonText, isSelected ? styles.selectedModeButtonText : undefined]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface SettingStepperProps {
  disabled: boolean;
  label: string;
  maxValue: number;
  minValue: number;
  value: number;
  onChange: (value: number) => void;
}

function SettingStepper({
  disabled,
  label,
  maxValue,
  minValue,
  value,
  onChange,
}: SettingStepperProps) {
  const canDecrease = !disabled && value > minValue;
  const canIncrease = !disabled && value < maxValue;

  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityHint={`Decreases ${label}.`}
        accessibilityLabel={`Decrease ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        style={[styles.stepperButton, !canDecrease ? styles.disabledStepperButton : undefined]}
        onPress={() => onChange(value - 1)}
      >
        <Text style={styles.stepperText}>-</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        accessibilityHint={`Increases ${label}.`}
        accessibilityLabel={`Increase ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canIncrease }}
        disabled={!canIncrease}
        style={[styles.stepperButton, !canIncrease ? styles.disabledStepperButton : undefined]}
        onPress={() => onChange(value + 1)}
      >
        <Text style={styles.stepperText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  disabledPanel: {
    opacity: 0.72,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingCopy: {
    flex: 1,
    gap: 3,
  },
  settingBlock: {
    gap: 10,
  },
  settingLabel: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },
  settingHint: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  selectedModeButton: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  modeButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  selectedModeButtonText: {
    color: "#082F49",
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  stepperButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  disabledStepperButton: {
    opacity: 0.35,
  },
  stepperText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  stepperValue: {
    color: "#38BDF8",
    fontSize: 18,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
});
