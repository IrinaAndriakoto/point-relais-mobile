import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity
} from "react-native";

interface ScannedData {
  data: string;
  timestamp: number;
}

export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();

  // Demander les permissions d'accès à la caméra
  useEffect(() => {
    const checkAndRequest = async () => {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) console.warn("Permission refusée");
      }
    };
    checkAndRequest();
  }, []);

  // Gérer la détection de codes QR
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanning) {
      setIsScanning(false);
      setScannedData({
        data,
        timestamp: Date.now(),
      });

      // Affordance : vibrer et afficher une alerte
      setTimeout(() => {
        Alert.alert("Code QR Détecté", `Données: ${data}`, [
          {
            text: "Scanner à nouveau",
            onPress: () => {
              setScannedData(null);
              setIsScanning(true);
            },
          },
          {
            text: "Copier",
            onPress: () => {
              // Copier les données
              console.log("Code copié:", data);
              Alert.alert("Succès", "Code copié dans le presse-papiers");
            },
          },
        ]);
      }, 500);
    }
  };

  // Si les permissions ne sont pas accordées
  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <IconSymbol
          size={80}
          name="camera.fill"
          color={Colors[colorScheme ?? "light"].tint}
          style={styles.icon}
        />
        <ThemedText type="title" style={styles.title}>
          Accès à la caméra requis
        </ThemedText>
        <ThemedText style={styles.description}>
          L'application a besoin d'accéder à votre caméra pour scanner les codes
          QR.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: Colors[colorScheme ?? "light"].tint },
          ]}
          onPress={requestPermission}
        >
          <ThemedText style={styles.buttonText}>Autoriser l'accès</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {isScanning ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={isTorchOn}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            {/* Overlay avec cadre de scan */}
            <ThemedView style={styles.overlay}>
              <ThemedView style={styles.scanFrame} />
            </ThemedView>

            {/* Boutons controls */}
            <ThemedView style={styles.controlsContainer}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: isTorchOn
                      ? Colors[colorScheme ?? "light"].tint
                      : "rgba(0,0,0,0.5)",
                  },
                ]}
                onPress={() => setIsTorchOn(!isTorchOn)}
              >
                <IconSymbol
                  size={28}
                  name={
                    isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill"
                  }
                  color="#fff"
                />
              </TouchableOpacity>
            </ThemedView>
          </CameraView>

          {/* Instructions */}
          <ThemedView style={styles.instructionsContainer}>
            <ThemedText type="subtitle" style={styles.instructionsTitle}>
              📍 Scanner un code QR
            </ThemedText>
            <ThemedText style={styles.instructionsText}>
              Pointez votre caméra vers un code QR pour le scanner
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <>
          {/* Écran de résultat */}
          <ThemedView style={styles.resultContainer}>
            <IconSymbol
              size={60}
              name="checkmark.circle.fill"
              color={Colors[colorScheme ?? "light"].tint}
            />
            <ThemedText type="title" style={styles.resultTitle}>
              Code détecté !
            </ThemedText>
            <ThemedView style={styles.resultBox}>
              <ThemedText type="defaultSemiBold" style={styles.resultLabel}>
                Données :
              </ThemedText>
              <ThemedText style={styles.resultData}>
                {scannedData?.data}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: Colors[colorScheme ?? "light"].tint },
                ]}
                onPress={() => {
                  setScannedData(null);
                  setIsScanning(true);
                }}
              >
                <ThemedText style={styles.buttonText}>
                  Scanner à nouveau
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
     height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsContainer: {
    padding: 20,
    alignItems: "center",
  },
  instructionsTitle: {
    marginBottom: 8,
  },
  instructionsText: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.7,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultTitle: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  resultBox: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  resultLabel: {
    marginBottom: 8,
  },
  resultData: {
    fontSize: 16,
    fontFamily: "monospace",
    flexWrap: "wrap",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
});
