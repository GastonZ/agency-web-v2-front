import api from "./api/api";
import type { AxiosError } from "axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  token: string;
  active: boolean;
}

function isAxiosError<T = any>(e: unknown): e is AxiosError<T> {
  return typeof e === "object" && e !== null && "isAxiosError" in e;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>("auth/login", credentials);

    if (!data?.token || !data?.email || !data?.userId) {
      throw new Error("Respuesta inválida del servidor");
    }

    return data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = (error.response?.data as any)?.message;

      if (
        status === 400 &&
        (message === "Invalid login credentials" || message === "Invalid password")
      ) {
        throw new Error("Credenciales incorrectas");
      }

      if (status && status >= 500 && status <= 599) {
        throw new Error("Error del servidor. Intente más tarde.");
      }

    }

    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}


export async function validateToken(tokenArg?: string): Promise<boolean> {
  const token = tokenArg ?? localStorage.getItem("aiaToken") ?? "";
  if (!token) return false;

  try {
    await api.post<void>("/auth/validate-token", { token });
    return true;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = (error.response?.data as any)?.message;

      if (status === 401 && message === "Invalid or expired token") {
        return false;
      }

      if (status && status >= 500) {
        throw new Error("Error del servidor. Intente más tarde.");
      }

      if (status) {
        throw new Error(message || `Error ${status} al validar token`);
      }
    }

    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}