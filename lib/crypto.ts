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
    contenu: encryptedContent.substring(0, 50) + "...",
    cleSecrete: SECRET_KEY,
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
 * Vérifie si l'idInterne déchiffré existe dans la base de données.
 * @param idInterne - L'identifiant interne déchiffré
 * @returns true si l'ID existe, false sinon
 */
export async function verifyId(idInterne: string): Promise<boolean> {
  // TODO: Remplacer par un appel API réel
  // Exemple :
  //   const res = await fetch(`${API_URL}/verify/${idInterne}`);
  //   const data = await res.json();
  //   return data.exists;
  console.log("[verifyId] Vérification de l'ID:", idInterne);
  return false; // Placeholder — à adapter
}

/**
 * Marque le colis comme livré dans la base de données.
 * @param idInterne - L'identifiant interne du colis
 * @returns true si le statut a été changé avec succès
 */
export async function livrer(idInterne: string): Promise<boolean> {
  // TODO: Remplacer par un appel API réel
  // Exemple :
  //   const res = await fetch(`${API_URL}/livrer/${idInterne}`, { method: 'POST' });
  //   return res.ok;
  console.log("[livrer] Colis livré:", idInterne);
  return true; // Placeholder — à adapter
}
