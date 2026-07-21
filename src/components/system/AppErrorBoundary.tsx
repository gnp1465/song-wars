import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { reportAppError } from "../../services/diagnostics/logger";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  errorMessage?: string;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportAppError(error, {
      area: "react-boundary",
      detail: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <View style={styles.root}>
          <Text style={styles.eyebrow}>Something went wrong</Text>
          <Text style={styles.title}>Song Wars hit an app error.</Text>
          <Text style={styles.body}>
            You can return to the app and try again. If this repeats, record what screen you were on.
          </Text>
          <Pressable
            accessibilityLabel="Try loading Song Wars again"
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => this.setState({ errorMessage: undefined })}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 24,
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
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
  },
});
