import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function HistoriqueScreen() {
  return (
    <ThemedView style={styles.historiqueContainer}>
      <ThemedText type="title" style={styles.heading}>
        Historique des transactions
      </ThemedText>
      <ThemedText>
        Affichage de l&apos;historique des transactions à venir...
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  historiqueContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    marginBottom: 12,
  },
});
