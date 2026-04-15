import { loginCashpoint } from "@/lib/auth-api";
import * as SecureStore from "expo-secure-store";
import { useReducer } from "react";

export type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  cashpoint: any | null;
  error?: string;
};

const STORAGE_KEY = "cashpoint_auth";

type AuthAction =
  | { type: "RESTORE_TOKEN"; token: string | null }
  | { type: "SIGN_IN_LOADING" }
  | {
      type: "SIGN_IN_SUCCESS";
      payload: {
        token: string;
        cashpoint: any;
      };
    }
  | { type: "SIGN_IN_ERROR"; error: string }
  | { type: "SIGN_OUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        userToken: action.token,
        isLoading: false,
        isSignout: !action.token,
      };
    case "SIGN_IN_LOADING":
      return {
        ...state,
        isLoading: true,
        error: undefined,
      };
    case "SIGN_IN_SUCCESS":
      return {
        ...state,
        isSignout: false,
        userToken: action.payload.token,
        cashpoint: action.payload.cashpoint,
        isLoading: false,
      };
    case "SIGN_IN_ERROR":
      return {
        ...state,
        isSignout: true,
        isLoading: false,
        error: action.error,
      };
    case "SIGN_OUT":
      return {
        ...state,
        isSignout: true,
        userToken: null,
        cashpoint: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function useAuth() {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,
    isSignout: false,
    userToken: null,
    cashpoint: null,
  });

  const authContext = {
    signIn: async (numero: string, password: string) => {
      dispatch({ type: "SIGN_IN_LOADING" });

      try {
        const result = await loginCashpoint(numero, password);

        if (result.success && result.cashpoint) {
          // Store token
          await SecureStore.setItemAsync(
            STORAGE_KEY,
            JSON.stringify(result.cashpoint),
          );

          dispatch({
            type: "SIGN_IN_SUCCESS",
            payload: {
              token: result.cashpoint.id?.toString() || "authenticated",
              cashpoint: result.cashpoint,
            },
          });
        } else {
          throw new Error(result.error || "Authentication failed");
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        dispatch({
          type: "SIGN_IN_ERROR",
          error: errorMsg,
        });
        throw e;
      }
    },

    signOut: async () => {
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        dispatch({ type: "SIGN_OUT" });
      } catch (e) {
        console.error("Sign out error:", e);
      }
    },
  };

  return { state, authContext };
}
