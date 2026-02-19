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

export interface SubLoginCredentials {
  username: string;
  password: string;
}

export interface SubLoginResponse {
  token: string;
  userId: string;
  email: string;
  subAccountId: string;
  areaName: string;
}

export interface VerifyEmailResponse {
  message: string;
  user?: {
    id?: string;
    email?: string;
    activated?: boolean;
  };
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

export async function googleLogin(idToken: string): Promise<LoginResponse> {
  // Keep endpoints relative so baseURL (usually includes /api) is respected.
  const { data } = await api.post<LoginResponse>("auth/google-login", { idToken });
  return data;
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

    if (response.status !== 200 && response.status !== 201) {
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

      if (status === 409 && message === "User already exists") {
        throw new Error("error_user_exists");
      }

      if (
        status === 409 &&
        typeof message === "string" &&
        message.toLowerCase().includes("pending verification")
      ) {
        throw new Error(
          "Tu cuenta todavía no está verificada. Te reenviamos el correo de validación.",
        );
      }

      if (
        status >= 500 &&
        message === "Could not send verification email. Please try again."
      ) {
        throw new Error(
          "No pudimos enviar el correo de verificación. Intenta nuevamente.",
        );
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
    // Keep endpoints relative so baseURL (usually includes /api) is respected.
    await api.post<void>("auth/validate-token", { token });
    return true;
  } catch (error: any) {
    // api/api.ts rejects with `error.response` (AxiosResponse), not AxiosError.
    if (error?.status) {
      const status: number = error.status;
      const message: string = error.data?.message;

      if (status === 401 && message === "Invalid or expired token") {
        return false;
      }
      if (status >= 500) throw new Error("Error del servidor. Intente más tarde.");
      throw new Error(message || `Error ${status} al validar token`);
    }
    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}

export async function subLogin(credentials: SubLoginCredentials): Promise<SubLoginResponse> {
  try {
    const { data } = await api.post<SubLoginResponse>("auth/sub-login", credentials);

    if (!data?.token || !data?.userId || !data?.subAccountId || !data?.areaName) {
      throw new Error("error_invalid");
    }

    return data;
  } catch (error: any) {
    if (error) {
      const status: number = error.status;
      const message: string = error.data?.message;

      if (
        (status === 400 || status === 401) &&
        (message === "Invalid login credentials" ||
          message === "Invalid password" ||
          message === "Invalid username or password" ||
          message === "Invalid credentials")
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

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  try {
    const { data } = await api.post<VerifyEmailResponse>("users/verify-email", {
      token,
    });

    if (!data?.message) {
      throw new Error("error_invalid");
    }

    return data;
  } catch (error: any) {
    if (error) {
      const status: number = error.status;
      const messageRaw = error.data?.message;
      const message: string = Array.isArray(messageRaw)
        ? messageRaw.join(", ")
        : String(messageRaw || "");

      if (
        status === 400 &&
        (
          message === "Invalid or expired verification token" ||
          message === "Invalid verification token payload" ||
          message === "Verification token is required"
        )
      ) {
        throw new Error("El enlace de verificación es inválido o está vencido.");
      }

      if (status === 404 && message === "User not found") {
        throw new Error("No encontramos la cuenta para verificar.");
      }

      if (status >= 500) {
        throw new Error("error_server");
      }

      throw new Error(message || `Error ${status} al verificar el correo`);
    }

    throw new Error("error_network");
  }
}
