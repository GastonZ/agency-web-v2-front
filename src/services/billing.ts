import api from "./api/api";
import type { AxiosResponse } from "axios";
import type {
  BillingPlan,
  BillingPlansResponse,
  BillingSummary,
  BillingSummaryResponse,
  BillingCycle,
  CreateSubscriptionCheckoutPayload,
  CreateSubscriptionCheckoutResponse,
  MercadoPagoSubscriptionDiagnostics,
} from "./types/billing-types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

export async function getBillingPlans(): Promise<BillingPlan[]> {
  const res: AxiosResponse<BillingPlansResponse | BillingPlan[]> = await api.get("billing/plans");
  return unwrapEnvelope(res.data);
}

export async function getMyBillingSummary(): Promise<BillingSummary> {
  const res: AxiosResponse<BillingSummaryResponse | BillingSummary> = await api.get(
    "billing/subscription/me",
  );
  return unwrapEnvelope(res.data);
}

export async function createSubscriptionCheckout(
  payload: CreateSubscriptionCheckoutPayload,
): Promise<CreateSubscriptionCheckoutResponse> {
  const res: AxiosResponse<ApiEnvelope<CreateSubscriptionCheckoutResponse> | CreateSubscriptionCheckoutResponse> =
    await api.post("billing/subscription/checkout", payload);
  return unwrapEnvelope(res.data);
}

export async function getMercadoPagoSubscriptionDiagnostics(
  subscriptionId: string,
): Promise<MercadoPagoSubscriptionDiagnostics> {
  const res: AxiosResponse<ApiEnvelope<MercadoPagoSubscriptionDiagnostics> | MercadoPagoSubscriptionDiagnostics> =
    await api.get(`billing/subscription/mercadopago/${encodeURIComponent(subscriptionId)}`);
  return unwrapEnvelope(res.data);
}

export async function mockUpgradeSubscription(
  planName: string,
  billingCycle?: BillingCycle,
) {
  const res: AxiosResponse<ApiEnvelope<unknown> | unknown> = await api.post(
    `billing/subscription/mock-upgrade/${encodeURIComponent(planName)}`,
    { billingCycle },
  );
  return unwrapEnvelope(res.data);
}
