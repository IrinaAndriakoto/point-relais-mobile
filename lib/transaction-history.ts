import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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
  const rawAuth = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

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

export async function createTransactionHistory(
  payload: CreateTransactionHistoryPayload,
): Promise<TransactionHistoryEntry> {
  const idInterne = normalizeIdInterne(payload.idInterne);
  const updatedBy = (
    payload.updatedBy ??
    (await getConnectedCashpointSignature()) ??
    ""
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

  const rawData =
    (await response.json()) as Partial<TransactionHistoryEntry> & {
      updated_by?: string;
    };

  // Normalize snake_case fields from backend to camelCase
  return {
    ...rawData,
    updatedBy: rawData.updated_by || rawData.updatedBy,
  } as TransactionHistoryEntry;
}

export async function fetchHistoryByUser(
  signatureCashpoint: string,
): Promise<TransactionHistoryEntry[]> {
  const normalizedSignature = signatureCashpoint.trim();

  if (!normalizedSignature) {
    throw new Error("signatureCashpoint invalide: la valeur est vide.");
  }

  const endpoint = `${getApiOrigin()}/api/transaction-history/historyByUser/${encodeURIComponent(
    normalizedSignature,
  )}`;

  // console.log(`[historique] Fetching history for user: ${normalizedSignature}`);
  // console.log(`[historique] Endpoint: ${endpoint}`);

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

  const rawData = (await response.json()) as Array<
    Partial<TransactionHistoryEntry> & { updated_by?: string }
  >;

  // Normalize snake_case fields from backend to camelCase
  return rawData.map(
    (entry) =>
      ({
        ...entry,
        updatedBy: entry.updated_by || entry.updatedBy,
      }) as TransactionHistoryEntry,
  );
}

export async function fetchCashpointHistory(): Promise<
  TransactionHistoryEntry[]
> {
  const connectedSignature = await getConnectedCashpointSignature();

  if (!connectedSignature) {
    return [];
  }

  const history = await fetchHistoryByUser(connectedSignature);
  // console.log(
  //   `[historique] Historique brut pour ${connectedSignature}:`,
  //   history,
  // );
  return history
    .filter(
      (entry) =>
        entry.status === "remis" &&
        typeof entry.updatedBy === "string" &&
        entry.updatedBy.trim() === connectedSignature,
    )
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
    );
}
