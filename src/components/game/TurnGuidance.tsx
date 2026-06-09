import { StyleSheet, Text, View } from "react-native";

export interface TurnGuidanceProps {
  actorName: string;
  detail?: string;
  instruction: string;
  phaseLabel: string;
}

export function TurnGuidance({
  actorName,
  detail,
  instruction,
  phaseLabel,
}: TurnGuidanceProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.phasePill}>{phaseLabel}</Text>
        <Text numberOfLines={1} style={styles.actorName}>
          {actorName}
        </Text>
      </View>
      <Text style={styles.instruction}>{instruction}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#172033",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  phasePill: {
    backgroundColor: "#0E7490",
    borderRadius: 8,
    color: "#ECFEFF",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  actorName: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  instruction: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  detail: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
});
