import CryptoJS from "crypto-js";

const API_BASE_URL = "https://preprod.api.cashless.eqima.org";

export type LoginResponse = {
  success: boolean;
  cashpoint?: {
    id: number;
    numero: string;
    [key: string]: any;
  };
  error?: string;
};

export async function loginCashpoint(
  numero: string,
  password: string,
): Promise<LoginResponse> {
  try {
    // Hash the password using SHA256
    const hashedPassword = CryptoJS.SHA256(password).toString();

    const url = new URL("/cashpoint/existenceVerifying", API_BASE_URL);
    url.searchParams.append("numero", numero);
    url.searchParams.append("password", hashedPassword);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP Error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if the response indicates success
    // Adjust based on what the API actually returns
    if (data && (data.success || data.id || data.numero)) {
      return {
        success: true,
        cashpoint: data,
      };
    }

    return {
      success: false,
      error: data?.error || "Authentication failed",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
