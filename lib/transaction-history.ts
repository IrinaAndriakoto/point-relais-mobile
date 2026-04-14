const trackedTransactionIds = new Set<number>();

export type TransactionHistoryEntry = {
  idHistory: number;
  idTransaction: number;
  status: string;
  changedAt: string;
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

function parseTransactionId(idInterne: string): number {
  const parsed = Number.parseInt(idInterne, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(
      `idTransaction invalide: "${idInterne}". Le backend attend un entier.`,
    );
  }

  return parsed;
}

export function trackTransaction(transactionId: number) {
  trackedTransactionIds.add(transactionId);
}

export function getTrackedTransactionIds(): number[] {
  return Array.from(trackedTransactionIds.values());
}

export function getTransactionIdFromIdInterne(idInterne: string): number {
  return parseTransactionId(idInterne);
}

export async function createTransactionHistory(
  idInterne: string,
  status: string,
): Promise<TransactionHistoryEntry> {
  const idTransaction = parseTransactionId(idInterne);
  const endpoint = `${getApiOrigin()}/api/transaction-history`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      idTransaction,
      status,
    }),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Erreur historique (${response.status}): ${errorMsg}`);
  }

  const created = (await response.json()) as TransactionHistoryEntry;
  trackTransaction(idTransaction);
  return created;
}

export async function fetchHistoryByTransaction(
  idTransaction: number,
): Promise<TransactionHistoryEntry[]> {
  const endpoint = `${getApiOrigin()}/api/transaction-history/${idTransaction}`;
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

  if (trackedIds.length === 0) {
    return [];
  }

  const histories = await Promise.all(
    trackedIds.map((transactionId) => fetchHistoryByTransaction(transactionId)),
  );

  return histories
    .flat()
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
    );
}
