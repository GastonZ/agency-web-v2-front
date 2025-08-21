import api from "./api/api";
import { getToken } from "../utils/helper";

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

export interface SignUpData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  username?: string;
}

export interface SignUpResponse {
  id: string;
  email: string;
  active: boolean;
  lastName: string;
  name: string;
  isGoogleUser: boolean;
  isFacebookUser: boolean;
  isInstagramUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>("auth/login", credentials);

    if (!data?.token || !data?.email || !data?.userId) {
      throw new Error("error_invalid");
    }

    return data;
  } catch (error: any) {
    if (error) {
      const status: number = error.status;
      const message: string = error.data?.message;

      if (
        (status === 400 || status === 401) &&
        (message === "Invalid login credentials" || message === "Invalid password")
      ) {
        throw new Error("error_credentials");
      }

      if (status >= 500) {
        throw new Error("error_server");
      }

      throw new Error(message || `Error ${status} en la autenticación`);
    }

    throw new Error("error_network");
  }
}

export async function signUp(data: SignUpData): Promise<SignUpResponse> {
  try {
    const payload = {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      ...(data.username && { username: data.username }),
    };

    const response = await api.post<SignUpResponse>("users", payload);

    if (!response.data?.id || !response.data?.email || !response.data?.active) {
      throw new Error("error_invalid");
    }

    return response.data;
  } catch (error: any) {
    if (error) {
      const status: number = error.status;
      const message: string = error.data?.message;

      if (status === 400 && message === "Email already exists") {
        throw new Error("error_email_exists");
      }
      if (status >= 500) {
        throw new Error("error_server");
      }
      throw new Error(message || `Error ${status} en el registro`);
    }
    throw new Error("error_network");
  }
}


export async function validateToken(tokenArg?: string): Promise<boolean> {
  const token = tokenArg ?? getToken();
  if (!token) return false;

  try {
    await api.post<void>("/auth/validate-token", { token });
    return true;
  } catch (error: any) {
    if (error?.response) {
      const status: number = error.response.status;
      const message: string = error.response.data?.message;

      if (status === 401 && message === "Invalid or expired token") {
        return false;
      }
      if (status >= 500) throw new Error("Error del servidor. Intente más tarde.");
      throw new Error(message || `Error ${status} al validar token`);
    }
    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}
