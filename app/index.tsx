import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Song Wars</Text>
          <Text style={styles.title}>Choose your room</Text>
          <Text style={styles.body}>
            Play the finished local prototype or start a real online lobby across phones.
          </Text>
        </View>

        <View style={styles.actions}>
          <HomeButton
            label="Create Online Room"
            detail="Host a six-digit room with anonymous sessions."
            onPress={() => router.push("/online/create")}
          />
          <HomeButton
            label="Join Online Room"
            detail="Enter a code and join from another phone."
            onPress={() => router.push("/online/join")}
          />
          <HomeButton
            label="Local Game"
            detail="Keep playing the completed offline prototype."
            onPress={() => router.push("/local")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface HomeButtonProps {
  detail: string;
  label: string;
  onPress: () => void;
}

function HomeButton({ detail, label, onPress }: HomeButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={styles.actionButton}
      onPress={onPress}
    >
      <Text style={styles.actionTitle}>{label}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 24,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
    padding: 16,
  },
  actionTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "900",
  },
  actionDetail: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
});
