import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const trackedTransactionIds = new Set<string>();
const AUTH_STORAGE_KEY = "cashpoint_auth";

type StoredCashpointAuth = {
  signatureCashpoint?: string;
  [key: string]: unknown;
};

export type TransactionHistoryEntry = {
  idHistory: number;
  idInterne?: string;
  status: string;
  changedAt: string;
  updatedBy?: string;
};

type CreateTransactionHistoryPayload = {
  idInterne: string;
  status: string;
  updatedBy?: string;
};

function getTransactionsApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL est absente du build. Verifiez la configuration EAS/.env.",
    );
  }

  return apiUrl;
}

function getApiOrigin(): string {
  const transactionsApiUrl = getTransactionsApiUrl();
  return transactionsApiUrl.replace(/\/api\/v1\/transactions$/i, "");
}

function normalizeIdInterne(idInterne: string): string {
  const normalized = idInterne.trim();

  if (!normalized) {
    throw new Error("idInterne invalide: la valeur est vide.");
  }

  return normalized;
}

async function readStoredAuth(): Promise<StoredCashpointAuth | null> {
  const rawAuth =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      : await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

  if (!rawAuth) {
    return null;
  }

  try {
    return JSON.parse(rawAuth) as StoredCashpointAuth;
  } catch (error) {
    console.error("[historique] Impossible de parser cashpoint_auth:", error);
    return null;
  }
}

export async function getConnectedCashpointSignature(): Promise<string | null> {
  const auth = await readStoredAuth();
  const signatureCashpoint = auth?.signatureCashpoint;

  if (typeof signatureCashpoint !== "string") {
    return null;
  }

  const normalized = signatureCashpoint.trim();
  return normalized || null;
}

export function trackTransaction(idInterne: string) {
  trackedTransactionIds.add(normalizeIdInterne(idInterne));
}

export function getTrackedTransactionIds(): string[] {
  return Array.from(trackedTransactionIds.values());
}

export async function createTransactionHistory(
  payload: CreateTransactionHistoryPayload,
): Promise<TransactionHistoryEntry> {
  const idInterne = normalizeIdInterne(payload.idInterne);
  const updatedBy = (
    payload.updatedBy ?? (await getConnectedCashpointSignature()) ?? ""
  ).trim();

  if (!updatedBy) {
    throw new Error("updatedBy manquant pour la creation de l'historique.");
  }

  const endpoint = `${getApiOrigin()}/api/transaction-history`;
  const requestBody = {
    idInterne,
    status: payload.status,
    updatedBy,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("[historique] ERREUR BACKEND:", {
      status: response.status,
      endpoint,
      body: requestBody,
      response: errorText,
    });

    throw new Error(
      `Historique echoue\n\n` +
        `Status: ${response.status}\n` +
        `Response: ${errorText}\n` +
        `Endpoint: ${endpoint}`,
    );
  }

  const created = (await response.json()) as TransactionHistoryEntry;
  trackTransaction(idInterne);
  return created;
}

export async function fetchHistoryByTransaction(
  idInterne: string,
): Promise<TransactionHistoryEntry[]> {
  const normalizedId = normalizeIdInterne(idInterne);
  const endpoint = `${getApiOrigin()}/api/transaction-history/${encodeURIComponent(
    normalizedId,
  )}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(
      `Erreur chargement historique (${response.status}): ${errorMsg}`,
    );
  }

  return (await response.json()) as TransactionHistoryEntry[];
}

export async function fetchTrackedTransactionsHistory(): Promise<
  TransactionHistoryEntry[]
> {
  const trackedIds = getTrackedTransactionIds();
  const connectedSignature = await getConnectedCashpointSignature();

  if (trackedIds.length === 0 || !connectedSignature) {
    return [];
  }

  const histories = await Promise.all(
    trackedIds.map((idInterne) => fetchHistoryByTransaction(idInterne)),
  );

  return histories
    .flat()
    .filter(
      (entry) =>
        typeof entry.updatedBy === "string" &&
        entry.updatedBy.trim() === connectedSignature,
    )
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
    );
}
