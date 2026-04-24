import {
  createTransactionHistory,
  getConnectedCashpointSignature,
} from "@/lib/transaction-history";
import CryptoJS from "crypto-js";
import "react-native-get-random-values";

const SECRET_KEY = "ARO2025MADA2026!";

type DeliveryResponse = {
  signatureCashpoint?: string;
  [key: string]: unknown;
};

export function decryptQRContent(encryptedContent: string): string {
  console.log("[crypto] Tentative de decryptage:", {
    contenuLongueur: encryptedContent.length,
    contenu: encryptedContent.substring(0, 90),
  });

  if (!encryptedContent) {
    throw new Error("Contenu encrypte vide");
  }

  try {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);

    const decrypted = CryptoJS.AES.decrypt(encryptedContent, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);

    console.log("[crypto] Decryptage reussi:", {
      resultat: result,
      longueur: result.length,
    });

    if (!result || result.length === 0) {
      throw new Error("Resultat vide: cle incorrecte ou contenu corrompu");
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[crypto] Erreur decryptage:", message);
    throw new Error(`Echec du decryptage AES/ECB: ${message}`);
  }
}

export function extractIdInterne(decryptedId: string): string {
  const parts = decryptedId.split("|");

  if (parts.length === 0) {
    throw new Error("Format de decryptedId invalide");
  }

  const idInterne = parts[0].trim();

  if (!idInterne) {
    throw new Error("idInterne vide dans le QR dechiffre");
  }

  console.log("[crypto] ID interne extrait:", {
    decryptedIdComplet: decryptedId,
    idInterne,
  });

  return idInterne;
}

export async function ChangerStatut(
  decryptedId: string,
  status: string,
): Promise<DeliveryResponse> {
  const idInterne = extractIdInterne(decryptedId);
  const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL est absente du build. Verifiez la configuration EAS/.env.",
    );
  }

  const endpoint = `${API_URL}/${encodeURIComponent(idInterne)}/updateDispatch?status=${encodeURIComponent(
    status,
  )}`;

  try {
    console.log("[Changement Statut] Requete backend:", {
      apiUrl: API_URL,
      endpoint,
      idInterne,
      status,
    });

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

    const data = (await res.json()) as DeliveryResponse;
    console.log("[Changement Statut] Succes:", data);
    return data;
  } catch (error) {
    const detailedMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    const debugInfo = {
      message: detailedMessage,
      endpoint,
      apiUrl: API_URL,
      idInterne,
      status,
    };

    console.error("[Changement Statut] ERREUR DETAILLEE:", debugInfo);

    throw new Error(
      `Changement de statut echoue\n\n` +
        `Message: ${detailedMessage}\n` +
        `Endpoint: ${endpoint}\n` +
        `API_URL: ${API_URL}`,
    );
  }
}

export async function UpdateStatutEtHistoriser(
  decryptedId: string,
  status: string,
): Promise<{ historyCreated: boolean }> {
  const idInterne = extractIdInterne(decryptedId);
  await ChangerStatut(decryptedId, status);
  const signatureCashpoint =
    (await getConnectedCashpointSignature())?.trim() ?? "";

  try {
    if (!signatureCashpoint) {
      throw new Error(
        "signatureCashpoint absente des donnees du compte connecte.",
      );
    }

    await createTransactionHistory({
      idInterne,
      status,
      updatedBy: signatureCashpoint,
    });

    return { historyCreated: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[historique] Creation echouee:", {
      idInterne,
      status,
      signatureCashpoint,
      message,
      errorFull: error,
    });

    return { historyCreated: false };
  }
}
