import { loginCashpoint } from "@/lib/auth-api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground, Platform, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const storeAuthData = async (data: any) => {
  try {
      // Sur iOS/Android, utiliser SecureStore
      await SecureStore.setItemAsync("cashpoint_auth", JSON.stringify(data));
    
  } catch (error) {
    console.error("Erreur lors du stockage des données:", error);
    throw error;
  }
};

export default function LoginScreen() {
  const [numero, setNumero] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!numero.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await loginCashpoint(numero, password);

      if (result.success && result.cashpoint) {
        // Store the cashpoint data
        await storeAuthData(result.cashpoint);

        // Navigate to home
        router.replace("/(tabs)");
      } else {
        setError(result.error || "Authentification échouée");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/splash_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Connexion</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Numéro de Cashpoint</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre numéro"
              value={numero}
              onChangeText={setNumero}
              editable={!loading}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor="#999"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0b2f5c",
    marginBottom: 30,
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginTop: -10,
  },
  loginButton: {
    backgroundColor: "#0b2f5c",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
