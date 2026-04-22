import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { decryptQRContent, livrerEtHistoriser } from "@/lib/crypto";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-get-random-values";

type ScanResult =
  | { status: "idle" }
  | { status: "decrypting" }
  | { status: "decrypt_error"; error: string }
  | { status: "decrypt_success"; decryptedId: string }
  | { status: "confirming"; decryptedId: string }
  | { status: "delivering"; decryptedId: string }
  | { status: "delivered"; decryptedId: string };

export default function ScanQRScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const isMountedRef = useRef(true);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [result, setResult] = useState<ScanResult>({ status: "idle" });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (permission === undefined) return;
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetScan = useCallback(() => {
    setResult({ status: "idle" });
    setIsScanning(true);
  }, []);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (!isScanning) return;
      setIsScanning(false);

      // ── Étape 1 : Décryptage ──
      setResult({ status: "decrypting" });
      await new Promise((r) => {
        scanTimeoutRef.current = setTimeout(r, 300);
      });
      if (!isMountedRef.current) return;

      let decryptedId: string;
      try {
        decryptedId = decryptQRContent(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setResult({ status: "decrypt_error", error: msg });
        return;
      }
      if (!isMountedRef.current) return;

      // ── Étape 2 : Afficher le résultat du décryptage ──
      setResult({ status: "decrypt_success", decryptedId });
      await new Promise((r) => {
        scanTimeoutRef.current = setTimeout(r, 1500);
      });
      if (!isMountedRef.current) return;

      // ── Étape 3 : Aller directement à la confirmation ──
      // La vérification sera faite par le backend lors de la livraison
      setResult({ status: "confirming", decryptedId });
    },
    [isScanning],
  );

  const handleConfirmDelivery = useCallback(async () => {
    if (result.status !== "confirming") return;
    const { decryptedId } = result as Extract<
      ScanResult,
      { decryptedId: string }
    >;

    setResult({ status: "delivering", decryptedId });

    try {
      const { historyCreated } = await livrerEtHistoriser(decryptedId, "remis");
      if (!isMountedRef.current) return;
      setResult({ status: "delivered", decryptedId });
      if (!historyCreated) {
        Alert.alert(
          "Livraison enregistree",
          "La livraison a reussi, mais l'historique n'a pas pu etre cree sur le serveur.",
        );
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const msg = err instanceof Error ? err.message : JSON.stringify(err);

      console.error("ERREUR COMPLETE:", err);

      Alert.alert(
        "Erreur de livraison",
        msg 
      );

      resetScan();
    }
  }, [result, resetScan]);

  // ── Permission refusée ──
  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <IconSymbol
          size={80}
          name="camera.fill"
          color={colors.tint}
          style={styles.icon}
        />
        <ThemedText type="title" style={styles.title}>
          Accès à la caméra requis
        </ThemedText>
        <ThemedText style={styles.description}>
          L&apos;application a besoin d&apos;accéder à votre caméra pour scanner
          les codes QR.
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={requestPermission}
        >
          <ThemedText style={styles.buttonText}>
            Autoriser l&apos;accès
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // ── Overlays au-dessus de la caméra ──
  const renderProcessingOverlay = () => {
    switch (result.status) {
      case "decrypting":
        return (
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.overlayText}>
              Décryptage en cours...
            </ThemedText>
          </View>
        );

      case "decrypt_success":
        return (
          <View style={styles.overlayContent}>
            <IconSymbol
              size={56}
              name="checkmark.circle.fill"
              color="#27ae60"
            />
            <ThemedText style={styles.overlayTitle}>
              Décryptage réussi
            </ThemedText>
            <View style={styles.decryptedBox}>
              <ThemedText style={styles.decryptedLabel}>
                CONTENU DÉCHIFFRÉ
              </ThemedText>
              <ThemedText style={styles.decryptedValue}>
                {result.decryptedId}
              </ThemedText>
            </View>
            <ThemedText style={styles.overlaySubtext}>
              Vérification en cours...
            </ThemedText>
            <ActivityIndicator
              size="small"
              color={colors.tint}
              style={{ marginTop: 8 }}
            />
          </View>
        );

      case "decrypt_error":
        return (
          <View style={styles.overlayContent}>
            <IconSymbol size={60} name="xmark.circle.fill" color="#e74c3c" />
            <ThemedText style={styles.overlayTitle}>
              Échec du décryptage
            </ThemedText>
            <ThemedText style={styles.overlayDescription}>
              {result.error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={resetScan}
            >
              <ThemedText style={styles.buttonText}>Réessayer</ThemedText>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* ── Caméra — toujours montée ── */}
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={isTorchOn}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* ── Cadre de scan ── */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
      </View>

      {/* ── Bouton torche ── */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isTorchOn ? colors.tint : "rgba(0,0,0,0.5)" },
          ]}
          onPress={() => setIsTorchOn(!isTorchOn)}
        >
          <IconSymbol
            size={28}
            name={isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill"}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ── Instructions (visibles uniquement quand idle) ── */}
      {result.status === "idle" && (
        <View style={styles.instructionsContainer}>
          <ThemedText type="subtitle" style={styles.instructionsTitle}>
            Scanner un code QR
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            Pointez votre caméra vers un code QR pour le scanner
          </ThemedText>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <ThemedText style={styles.flipText}>Flip Camera</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Overlays de traitement ── */}
      {renderProcessingOverlay()}

      {/* ── Modal confirmation ── */}
      <Modal
        visible={result.status === "confirming"}
        transparent
        animationType="fade"
        onRequestClose={resetScan}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <IconSymbol
              size={56}
              name="checkmark.circle.fill"
              color={colors.tint}
            />
            <ThemedText type="title" style={styles.modalTitle}>
              Recu identifié
            </ThemedText>
            <View style={styles.decryptedBoxModal}>
              <ThemedText style={styles.decryptedLabelModal}>
                ID INTERNE
              </ThemedText>
              <ThemedText style={styles.decryptedValueModal}>
                {result.status === "confirming" ? result.decryptedId : ""}
              </ThemedText>
            </View>
            <ThemedText style={styles.modalQuestion}>
              Confirmer la livraison de cette attestation ?
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={resetScan}
              >
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleConfirmDelivery}
              >
                <ThemedText style={styles.modalButtonText}>
                  OK — Livrer
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* ── Modal livraison en cours ── */}
      <Modal
        visible={result.status === "delivering"}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Enregistrement...
            </ThemedText>
          </ThemedView>
        </View>
      </Modal>

      {/* ── Modal livraison réussie ── */}
      <Modal
        visible={result.status === "delivered"}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <IconSymbol
              size={64}
              name="checkmark.circle.fill"
              color="#27ae60"
            />
            <ThemedText type="title" style={styles.modalTitle}>
              Attestation livrée !
            </ThemedText>
            <ThemedText style={styles.modalDescription}>
              Le statut de la transaction a été mis à jour avec succès.
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={resetScan}
            >
              <ThemedText style={styles.modalButtonText}>
                Scanner un autre recu
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1, width: "100%" },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#3b82f6",
    borderRadius: 20,
    backgroundColor: "transparent",
  },

  controlsContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "transparent",
    zIndex: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  instructionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 15,
  },
  instructionsTitle: { marginBottom: 8 },
  instructionsText: { textAlign: "center", fontSize: 14, opacity: 0.7 },
  flipButton: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 16 },
  flipText: { fontSize: 16, fontWeight: "bold", color: "white" },

  icon: { marginBottom: 16, opacity: 0.6 },
  title: { marginBottom: 12, textAlign: "center" },
  description: {
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
    paddingHorizontal: 20,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // ── Overlays de traitement ──
  overlayContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    zIndex: 30,
  },
  overlayText: {
    marginTop: 16,
    color: "#fff",
    fontSize: 16,
  },
  overlayTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  overlayDescription: {
    textAlign: "center",
    marginBottom: 24,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  overlaySubtext: {
    marginTop: 20,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Box du message déchiffré (overlay sombre) ──
  decryptedBox: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  decryptedLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  decryptedValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },

  // ── Box du message déchiffré (modal clair) ──
  decryptedBoxModal: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    padding: 12,
    width: "100%",
    alignItems: "center",
  },
  decryptedLabelModal: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  decryptedValueModal: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
  },
  modalTitle: { textAlign: "center" },
  modalDescription: { textAlign: "center", opacity: 0.7 },
  modalQuestion: { textAlign: "center", fontSize: 15, fontWeight: "500" },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "rgba(150,150,150,0.3)" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
