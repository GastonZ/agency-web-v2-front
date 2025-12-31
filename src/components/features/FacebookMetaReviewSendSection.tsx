import * as React from "react";
import { sendFacebookReviewMessage } from "../../services/campaigns";

type CampaignLike = {
  facebookCredentials?: {
    paused?: boolean;
    pages?: Array<{
      id: string;
      name?: string | null;
      category?: string | null;
    }> | null;
  } | null;
};

type Props = {
  campaign?: CampaignLike | null;
};

export function FacebookMetaReviewSendSection({ campaign }: Props) {
  const pages = (campaign?.facebookCredentials?.pages || []) as Array<{
    id: string;
    name?: string | null;
    category?: string | null;
  }>;

  const isFacebookConnected = React.useMemo(() => {
    return Boolean(pages?.length);
  }, [pages]);

  const isPaused = Boolean(campaign?.facebookCredentials?.paused);

  const [message, setMessage] = React.useState(
    "Hola! Este es un mensaje de prueba enviado desde nuestra UI (Facebook Messenger)."
  );
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Meta Review (hardcoded like the Instagram section)
  const recipientId = "33303037325976978";
  const agentId = "69553b77b1bbeb18d2a5673a";

  if (!isFacebookConnected) return null;

  async function onSend() {
    setSuccess(null);
    setError(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please enter a message.");
      return;
    }

    try {
      setLoading(true);
      await sendFacebookReviewMessage(trimmed);
      setSuccess("Message sent. Please check the Facebook Page inbox to confirm delivery.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Meta Review: Send Facebook Test Message
          </h3>
          <p className="mt-1 text-xs text-neutral-600">
            This tool sends a message from the connected Facebook Page using the Messenger API.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPaused ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isPaused ? "Facebook paused" : "Facebook connected"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Connected Facebook Pages</p>
          <div className="mt-1 space-y-1">
            {pages.slice(0, 3).map((p) => (
              <div key={p.id} className="text-sm font-medium text-neutral-900">
                {p.name || "(Unnamed page)"}
                <span className="text-xs font-normal text-neutral-500"> — {p.id}</span>
              </div>
            ))}
            {pages.length > 3 && <p className="text-xs text-neutral-500">+{pages.length - 3} more…</p>}
          </div>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Recipient (visible for review)</p>
          <p className="mt-1 break-all text-sm font-medium text-neutral-900">{recipientId}</p>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Sender asset (agentId)</p>
          <p className="mt-1 break-all text-sm font-medium text-neutral-900">{agentId}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-neutral-700">Message</label>
        <div className="mt-2 flex flex-col gap-3 md:flex-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-300 focus:ring-2 focus:ring-emerald-200"
            placeholder="Type a test message…"
            disabled={loading}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isPaused || loading || !message.trim() || !recipientId || !agentId}
            className="h-11 shrink-0 rounded-xl cursor-pointer bg-emerald-500 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </div>

        {success && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{success}</p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>
        )}

        {isPaused && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Facebook channel is paused for this campaign. Unpause it to send messages.
          </p>
        )}
      </div>
    </section>
  );
}
