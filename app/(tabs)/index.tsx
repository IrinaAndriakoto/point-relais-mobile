import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

type InDeliveryTransaction = {
  id?: string | number;
  idInterne?: string;
  status?: string;
  nom?: string;
  numero?: string;
  [key: string]: unknown;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [transactions, setTransactions] = useState<InDeliveryTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null,
  );

  const loadTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);

    try {
      // Récupérer le signatureCashpoint depuis le stockage
      let caissier = "";
      try {
        if (Platform.OS === "web") {
          const authData = await AsyncStorage.getItem("cashpoint_auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            caissier = parsed.signatureCashpoint || "";
          }
        } else {
          const authData = await SecureStore.getItemAsync("cashpoint_auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            caissier = parsed.signatureCashpoint || "";
          }
        }
      } catch (storageError) {
        console.warn(
          "Erreur lors de la récupération du caissier:",
          storageError,
        );
      }

      const IN_DELIVERY_ENDPOINT = `${apiUrl}/getInDelivery?caissier=${encodeURIComponent(caissier)}`;

      const response = await fetch(IN_DELIVERY_ENDPOINT, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Chargement impossible (${response.status}): ${errorText}`,
        );
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      setTransactions(normalized as InDeliveryTransaction[]);
      setTransactionsError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setTransactionsError(message);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const handleLogout = async () => {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem("cashpoint_auth");
      } else {
        await SecureStore.deleteItemAsync("cashpoint_auth");
      }
      setShowProfileModal(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderTransactionsTable = () => {
    if (isLoadingTransactions) {
      return (
        <View style={styles.tableState}>
          <ActivityIndicator size="small" color={colors.tint} />
          <ThemedText style={styles.tableStateText}>
            Chargement des transactions...
          </ThemedText>
        </View>
      );
    }

    if (transactionsError) {
      console.error(
        "[accueil] Erreur lors du chargement des transactions:",
        transactionsError,
      );
      return (
        <View style={styles.tableState}>
          <ThemedText type="defaultSemiBold" style={styles.errorText}>
            Impossible de charger la liste
          </ThemedText>
          <ThemedText style={styles.tableStateText}>
            {transactionsError}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={loadTransactions}
          >
            <ThemedText style={styles.retryButtonText}>Reessayer</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.tableState}>
          <ThemedText style={styles.tableStateText}>
            Aucune transaction en cours de livraison.
          </ThemedText>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View
            style={[
              styles.tableRow,
              styles.tableHeader,
              { borderBottomColor: colors.tint + "30" },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={styles.idColumn}>
              ID Interne
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.nameColumn}>
              Ref Contrat
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.phoneColumn}>
              Ref Transaction
            </ThemedText>
          </View>

          {transactions.map((transaction, index) => (
            <View
              key={String(
                transaction.idInterne ?? transaction.id ?? `row-${index}`,
              )}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.tint + "15" },
              ]}
            >
              <ThemedText style={styles.idColumn}>
                {String(transaction.idInterne ?? transaction.id ?? "-")}
              </ThemedText>
              <ThemedText style={styles.nameColumn}>
                {String(transaction.refContrat ?? "-")}
              </ThemedText>
              <ThemedText style={styles.phoneColumn}>
                {String(transaction.refTransaction ?? "-")}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedView>
            <ThemedText type="title" style={styles.greeting}>
              Point Relais
            </ThemedText>
            <ThemedText style={styles.subGreeting}>
              Decouvrez nos services
            </ThemedText>
          </ThemedView>
          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            style={styles.profileButton}
          >
            <IconSymbol size={28} name="person.fill" color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.actionsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions rapides
          </ThemedText>
          <ThemedView style={styles.actions}>
            <Link href="/scanqr">
              <ThemedView
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.tint + "15" },
                ]}
              >
                <IconSymbol size={32} name="qrcode" color={colors.tint} />
                <ThemedText type="defaultSemiBold" style={styles.actionLabel}>
                  Scanner un colis
                </ThemedText>
              </ThemedView>
            </Link>
            <Link href="/historique">
              <ThemedView
                style={[
                  styles.actionCard,
                  { backgroundColor: colors.tint + "15" },
                ]}
              >
                <IconSymbol size={32} name="clock" color={colors.tint} />
                <ThemedText type="defaultSemiBold" style={styles.actionLabel}>
                  Historique
                </ThemedText>
              </ThemedView>
            </Link>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Liste des transactions en cours de livraison
          </ThemedText>
          <ThemedView
            style={[styles.tableContainer, { borderColor: colors.tint + "20" }]}
          >
            {renderTransactionsTable()}
          </ThemedView>
        </ThemedView>

        <Modal
          visible={showProfileModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <TouchableOpacity style={styles.menuItem}>
                <IconSymbol size={24} name="info.circle" color={colors.tint} />
                <Link href="/infos">
                  <ThemedText style={styles.menuItemText}>
                    Informations
                  </ThemedText>
                </Link>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <IconSymbol
                  size={24}
                  name="door.left.hand.open"
                  color="#d32f2f"
                />
                <ThemedText style={[styles.menuItemText, styles.logoutText]}>
                  Se deconnecter
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProfileModal(false)}
              >
                <ThemedText style={styles.closeButtonText}>Fermer</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Modal>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  profileButton: {
    padding: 8,
  },
  greeting: {
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
  },
  actionLabel: {
    textAlign: "center",
    fontSize: 14,
  },
  infoContainer: {
    gap: 12,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  table: {
    minWidth: 720,
  },
  tableHeader: {
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  idColumn: {
    width: 140,
  },
  nameColumn: {
    width: 220,
  },
  phoneColumn: {
    width: 160,
  },
  statusColumn: {
    width: 160,
  },
  tableState: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  tableStateText: {
    textAlign: "center",
    opacity: 0.7,
  },
  errorText: {
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    maxHeight: "50%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
  },
  logoutItem: {
    marginTop: 12,
  },
  logoutText: {
    color: "#d32f2f",
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
