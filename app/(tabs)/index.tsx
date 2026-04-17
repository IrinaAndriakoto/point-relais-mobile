import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Modal, Platform, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    try {
      if (Platform.OS === "web") {
        // Sur le web, utiliser AsyncStorage
        await AsyncStorage.removeItem("cashpoint_auth");
      } else {
        // Sur iOS/Android, utiliser SecureStore
        await SecureStore.deleteItemAsync("cashpoint_auth");
      }
      setShowProfileModal(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title" style={styles.greeting}>
            Point Relais
          </ThemedText>
          <ThemedText style={styles.subGreeting}>
            Découvrez nos services
          </ThemedText>
        </ThemedView>
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          style={styles.profileButton}
        >
          <IconSymbol size={28} name="person.fill" color={colors.tint} />
        </TouchableOpacity>
      </ThemedView>

      {/* Quick Actions */}
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

      {/* Info Section */}
      <ThemedView style={styles.infoContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          À venir
        </ThemedText>
        <ThemedView
          style={[styles.infoCard, { borderColor: colors.tint + "30" }]}
        >
          <IconSymbol size={24} name="shippingbox.fill" color={colors.tint} />
          <ThemedView style={styles.infoText}>
            <ThemedText type="defaultSemiBold">Suivi des colis</ThemedText>
            <ThemedText style={styles.infoDescription}>
              Visualisez tous vos colis en cours de livraison
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView
          style={[styles.infoCard, { borderColor: colors.tint + "30" }]}
        >
          <IconSymbol size={24} name="bell.fill" color={colors.tint} />
          <ThemedView style={styles.infoText}>
            <ThemedText type="defaultSemiBold">Notifications</ThemedText>
            <ThemedText style={styles.infoDescription}>
              Recevez des alertes quand un colis arrive
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            {/* <ThemedText type="title" style={styles.modalTitle}>
                Profil
              </ThemedText> */}

            {/* Information Section */}
            <TouchableOpacity style={styles.menuItem}>
              <IconSymbol size={24} name="info.circle" color={colors.tint} />
              <Link href="/infos">
                <ThemedText style={styles.menuItemText}>
                  Informations
                </ThemedText>
              </Link>
            </TouchableOpacity>

            {/* Logout Section */}
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
                Se déconnecter
              </ThemedText>
            </TouchableOpacity>

            {/* Close Button */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  infoDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    padding: 8,
  },
  // Modal styles
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
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
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
