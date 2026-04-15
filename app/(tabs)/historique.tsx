import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  fetchTrackedTransactionsHistory,
  type TransactionHistoryEntry,
} from "@/lib/transaction-history";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoriqueScreen() {
  const [entries, setEntries] = useState<TransactionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const history = await fetchTrackedTransactionsHistory();
      setEntries(history);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur inconnue lors du chargement";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.helperText}>
            Chargement de l&apos;historique...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <ThemedText type="subtitle" style={styles.centerTitle}>
            Impossible de charger l&apos;historique
          </ThemedText>
          <ThemedText style={styles.helperText}>{error}</ThemedText>
        </View>
      );
    }

    if (entries.length === 0) {
      return (
        <View style={styles.centerContent}>
          <ThemedText type="subtitle" style={styles.centerTitle}>
            Aucun scan historisé
          </ThemedText>
          <ThemedText style={styles.helperText}>
            Les transactions livrées apparaitront ici.
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {entries.map((entry) => (
          <ThemedView key={entry.idHistory} style={styles.card}>
            <ThemedText type="defaultSemiBold">
              Transaction #{entry.idTransaction}
            </ThemedText>
            <ThemedText style={styles.status}>
              Statut: {entry.status}
            </ThemedText>
            <ThemedText style={styles.date}>
              {formatDate(entry.changedAt)}
            </ThemedText>
          </ThemedView>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadHistory(true)}
          />
        }
      >
        <ThemedView style={styles.historiqueContainer}>
          <ThemedText type="title" style={styles.heading}>
            Historique de scans
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Les scans de transactions livrés sont historisés ici pour vous permettre de suivre vos activités récentes.
          </ThemedText>
          {renderContent()}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  historiqueContainer: {
    flex: 1,
    padding: 20,
  },
  heading: {
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.7,
  },
  centerContent: {
    flex: 1,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  centerTitle: {
    textAlign: "center",
  },
  helperText: {
    marginTop: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  status: {
    fontSize: 14,
  },
  date: {
    fontSize: 13,
    opacity: 0.65,
  },
});
