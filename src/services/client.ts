import api from "./api/api";

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

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>("auth/login", credentials);

    if (!data?.token || !data?.email || !data?.userId) {
      throw new Error("Respuesta inválida del servidor");
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
        throw new Error("Credenciales incorrectas");
      }

      if (status >= 500) {
        throw new Error("Error del servidor. Intente más tarde.");
      }

      throw new Error(message || `Error ${status} en la autenticación`);
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
  } catch (error: any) {
    if (error.response) {
      const status: number = error.response.status;
      const message: string = error.response.data?.message;

      if (status === 401 && message === "Invalid or expired token") {
        return false;
      }

      if (status >= 500) {
        throw new Error("Error del servidor. Intente más tarde.");
      }

      throw new Error(message || `Error ${status} al validar token`);
    }

    throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}
