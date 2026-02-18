export type BillingPlanName = "free" | "basic" | "premium" | "custom" | (string & {});
export type BillingCycle = "monthly" | "yearly";
export type BillingStatus =
  | "active"
  | "grace_period"
  | "paused"
  | "cancelled"
  | "pending"
  | "trialing"
  | (string & {});

export type BillingPlan = {
  _id: string;
  name: BillingPlanName;
  displayName: string;
  allowMarketing: boolean;
  allowSocialListening: boolean;
  isDefault: boolean;
  maxActiveCampaigns: number;
  priceMonthly: number;
  priceYearly: number;
  quotaAudios: number;
  quotaMessages: number;
  unlimitedAudios: boolean;
  unlimitedCampaigns: boolean;
  unlimitedMessages: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserSubscription = {
  _id?: string;
  userId: string;
  betaMigratedAt?: string | null;
  planName: BillingPlanName;
  billingCycle: BillingCycle;
  status: BillingStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  graceUntil?: string | null;
  metadata?: {
    pendingCheckout?: {
      mpSubscriptionId?: string;
      planName?: BillingPlanName;
      billingCycle?: BillingCycle;
      createdAt?: string;
    } | null;
  };
  mercadoPagoSubscriptionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UsageRecord = {
  userId: string;
  period: string;
  messagesUsed: number;
  audiosUsed: number;
  tokensMessagesBalance?: number;
  tokensAudiosBalance?: number;
};

export type BillingSummary = {
  billingEnabled: boolean;
  subscription: UserSubscription;
  plan: BillingPlan;
  usage: UsageRecord;
  remaining: {
    messages: number;
    audios: number;
  };
  upgradeMessage?: string;
};

export type CreateSubscriptionCheckoutPayload = {
  planName: BillingPlanName;
  billingCycle?: BillingCycle;
  payerEmail?: string;
  returnUrl?: string;
};

export type CreateSubscriptionCheckoutResponse = {
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  currencyId: string;
  mpSubscriptionId: string | null;
  initPoint: string | null;
  sandboxInitPoint: string | null;
  status: string | null;
  raw: unknown;
};

export type MercadoPagoSubscriptionDiagnostics = {
  localSubscription: UserSubscription | null;
  remoteSubscription: unknown;
};

export type BillingPlansResponse = {
  success: true;
  data: BillingPlan[];
};

export type BillingSummaryResponse = {
  success: true;
  data: BillingSummary;
};
