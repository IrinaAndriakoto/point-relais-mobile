import CryptoJS from "crypto-js";
import "react-native-get-random-values";

// ═══════════════════════════════════════════════════════
// Clé de chiffrement — à adapter selon ton backend
// ═══════════════════════════════════════════════════════
const SECRET_KEY = "ARO2025MADA2026!";

/**
 * Déchiffre un contenu crypté en AES et retourne le texte clair.
 * @param encryptedContent - Le contenu crypté du QR code
 * @returns Le texte déchiffré (ex: l'idInterne)
 */
export function decryptQRContent(encryptedContent: string): string {
  console.log("[crypto] Tentative de décryptage:", {
    contenuLongueur: encryptedContent.length,
    contenu: encryptedContent.substring(0, 90),
  });

  if (!encryptedContent) {
    throw new Error("Contenu encrypté vide");
  }

  try {
    // Créer la clé à partir du texte
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    // Déchiffrer avec AES/ECB/PKCS7
    const decrypted = CryptoJS.AES.decrypt(
      encryptedContent, // contenu base64 chiffré
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7, // PKCS5 == PKCS7 pour AES
      },
    );

    const result = decrypted.toString(CryptoJS.enc.Utf8);

    console.log("[crypto] Décryptage réussi:", {
      resultat: result,
      longueur: result.length,
    });

    if (!result || result.length === 0) {
      throw new Error("Résultat vide — clé incorrecte ou contenu corrompu");
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[crypto] Erreur décryptage:", message);
    throw new Error(`Échec du décryptage AES/ECB : ${message}`);
  }
}

// ═══════════════════════════════════════════════════════
//  Fonctions backend — à implémenter selon ton API
// ═══════════════════════════════════════════════════════

/**
 * @param decryptedId - Le contenu déchiffré complet
 * @returns Le idInterne (première partie avant le |)
 */
export function extractIdInterne(decryptedId: string): string {
  const parts = decryptedId.split("|");
  if (parts.length === 0) {
    throw new Error("Format de decryptedId invalide");
  }
  const idInterne = parts[0].trim();
  console.log("[crypto] ID interne extrait:", {
    decryptedIdComplet: decryptedId,
    idInterne,
  });
  return idInterne;
}

/**
 * Envoie la livraison au backend avec le idInterne et le statut
 * @param decryptedId - Le contenu déchiffré complet (sera extrait pour obtenir le idInterne)
 * @param status - Le statut à mettre à jour (ex: "remis")
 */
export async function livrer(
  decryptedId: string,
  status: string = "remis",
): Promise<boolean> {
  const idInterne = extractIdInterne(decryptedId);

  // Configuration de l'API selon l'environnement
  // - Sur émulateur Android: 10.0.2.2 (pointe vers le host)
  // - Sur iOS Simulator: localhost
  // - Sur téléphone physique: IP du PC (ex: 192.168.x.x)
  // - Variable d'environnement: process.env.EXPO_PUBLIC_API_URL
  let API_URL = process.env.EXPO_PUBLIC_API_URL;

  const endpoint = `${API_URL}/${idInterne}/livrerQRCode?status=${status}`;

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Erreur backend (${res.status}): ${errorMsg}`);
    }

    const data = await res.json();
    console.log("[livrer] Succès:", data);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[livrer] Erreur complète:", {
      message,
      endpoint,
      errorFull: error,
    });
    throw new Error(`Impossible de livrer : ${message}`);
  }
}
