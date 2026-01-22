import api from "./api/api";
import { getAreaName, isSubAccountSession } from "../utils/helper";

export type UserArea = {
  _id: string;
  name: string;
  description: string;
};

export type SubAccount = {
  _id: string;
  parentUserId: string;
  username: string;
  areaName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  area?: Pick<UserArea, "name" | "description">;
};

function pickErrorMessage(error: any, fallback: string) {
  const status: number | undefined = error?.status;
  const msg: string | undefined = error?.data?.message;
  if (status === 400 && msg) return msg;
  if (status === 401) return "No autorizado. Volvé a iniciar sesión.";
  if (status === 403) return "No tenés permisos para realizar esta acción.";
  if (status === 404) return msg || "No encontrado.";
  if (status && status >= 500) return "Error del servidor. Intentá más tarde.";
  return msg || fallback;
}

const AREAS_CACHE_KEY = "aiaAreasCache";

function readAreasCache(): UserArea[] | null {
  try {
    const raw = localStorage.getItem(AREAS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((a: any) => a && typeof a.name === "string");
  } catch {
    return null;
  }
}

function writeAreasCache(areas: UserArea[]) {
  try {
    localStorage.setItem(AREAS_CACHE_KEY, JSON.stringify(areas || []));
  } catch {}
}

function buildFallbackAreasFromSession(): UserArea[] {
  const areaName = (getAreaName() || "").trim();
  if (!areaName) return [];
  return [
    {
      _id: `sub:${encodeURIComponent(areaName)}`,
      name: areaName,
      description: "",
    },
  ];
}

// Areas

export async function getMyAreas(): Promise<UserArea[]> {
  try {
    // UX optimization: if a sub-account is blocked by the backend (403), prefer cache/fallback
    // so the UI can still show an area selector and avoid a hard failure.
    if (isSubAccountSession()) {
      const cached = readAreasCache();
      if (cached && cached.length) return cached;
    }

    const { data } = await api.get<UserArea[]>("users/me/areas");
    const areas = Array.isArray(data) ? data : [];
    // Cache for UX (also helps subaccounts if the API is temporarily unavailable).
    writeAreasCache(areas);
    return areas;
  } catch (error: any) {
    // Fallback to cache (frontend-only UX improvement)
    const cached = readAreasCache();
    if (cached && cached.length) return cached;

    // Common real-world case:
    // - sub accounts are sometimes forbidden by the backend on this endpoint (403)
    // - new browsers/PCs won't have the cache yet
    // In that scenario we return the sub-account's own assigned area (from localStorage)
    // instead of breaking the UI.
    if (error?.status === 403 && isSubAccountSession()) {
      const fallback = buildFallbackAreasFromSession();
      writeAreasCache(fallback);
      return fallback;
    }

    throw new Error(pickErrorMessage(error, "No se pudieron cargar las áreas."));
  }
}

export async function createArea(payload: {
  name: string;
  description: string;
}): Promise<UserArea> {
  try {
    const { data } = await api.post<UserArea>("users/me/areas", payload);
    return data;
  } catch (error: any) {
    throw new Error(pickErrorMessage(error, "No se pudo crear el área."));
  }
}

export async function updateAreaDescription(
  areaName: string,
  description: string
): Promise<UserArea> {
  try {
    const { data } = await api.patch<UserArea>(
      `users/me/areas/${encodeURIComponent(areaName)}`,
      { description }
    );
    return data;
  } catch (error: any) {
    throw new Error(pickErrorMessage(error, "No se pudo actualizar el área."));
  }
}

export async function deleteArea(areaName: string): Promise<void> {
  try {
    await api.delete<void>(`users/me/areas/${encodeURIComponent(areaName)}`);
  } catch (error: any) {
    throw new Error(pickErrorMessage(error, "No se pudo borrar el área."));
  }
}

// Subaccounts

export async function getMySubaccounts(): Promise<SubAccount[]> {
  try {
    const { data } = await api.get<SubAccount[]>("users/me/subaccounts");
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw new Error(
      pickErrorMessage(error, "No se pudieron cargar las subcuentas.")
    );
  }
}

export async function createSubaccount(payload: {
  username: string;
  password: string;
  areaName: string;
  isActive: boolean;
}): Promise<SubAccount> {
  try {
    const { data } = await api.post<SubAccount>("users/me/subaccounts", payload);
    return data;
  } catch (error: any) {
    throw new Error(pickErrorMessage(error, "No se pudo crear la subcuenta."));
  }
}

export async function updateSubaccount(
  subId: string,
  payload: Partial<Pick<SubAccount, "areaName" | "isActive">>
): Promise<SubAccount> {
  try {
    const { data } = await api.patch<SubAccount>(
      `users/me/subaccounts/${encodeURIComponent(subId)}`,
      payload
    );
    return data;
  } catch (error: any) {
    throw new Error(
      pickErrorMessage(error, "No se pudo actualizar la subcuenta.")
    );
  }
}

export async function resetSubaccountPassword(
  subId: string,
  newPassword: string
): Promise<SubAccount> {
  try {
    const { data } = await api.post<SubAccount>(
      `users/me/subaccounts/${encodeURIComponent(subId)}/reset-password`,
      { newPassword }
    );
    return data;
  } catch (error: any) {
    throw new Error(
      pickErrorMessage(error, "No se pudo resetear la contraseña.")
    );
  }
}

export async function deleteSubaccount(subId: string): Promise<void> {
  try {
    await api.delete<void>(`users/me/subaccounts/${encodeURIComponent(subId)}`);
  } catch (error: any) {
    throw new Error(pickErrorMessage(error, "No se pudo borrar la subcuenta."));
  }
}