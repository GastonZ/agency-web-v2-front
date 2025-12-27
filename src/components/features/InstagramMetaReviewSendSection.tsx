import * as React from "react";
import { sendInstagramReviewMessage } from "../../services/campaigns";

type CampaignLike = {
  instagramCredentials?: {
    username?: string | null;
  } | null;
};

type Props = {
  campaign?: CampaignLike | null;
};

export function InstagramMetaReviewSendSection({ campaign }: Props) {
  const isInstagramConnected = React.useMemo(() => {
    return Boolean(campaign?.instagramCredentials?.username);
  }, [campaign]);

  const [message, setMessage] = React.useState("Hello! This is a test message sent from our app UI.");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const recipientId = "26195445306710296";
  const agentId = "694f305072ce21c3430490c8";

  if (!isInstagramConnected) return null;

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
      await sendInstagramReviewMessage(trimmed);
      setSuccess("Message sent. Please check the Instagram inbox to confirm delivery.");
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
            Meta Review: Send Instagram Test Message
          </h3>
          <p className="mt-1 text-xs text-neutral-600">
            This tool sends a message from the connected Instagram professional account using the Instagram Messaging API.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Instagram connected
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Connected Instagram account</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            @{campaign?.instagramCredentials?.username}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Recipient (visible for review)</p>
          <p className="mt-1 break-all text-sm font-medium text-neutral-900">
            {recipientId || "Not set (VITE_META_REVIEW_IG_RECIPIENT_ID)"}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Username (visible for review)</p>
          <p className="mt-1 break-all text-sm font-medium text-neutral-900">
            @gastonzappulla.ryu
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 p-3">
        <p className="text-xs text-neutral-500">Sender asset (agentId)</p>
        <p className="mt-1 break-all text-sm font-medium text-neutral-900">
          {agentId || "Not set (VITE_META_REVIEW_IG_AGENT_ID)"}
        </p>
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
            disabled={loading || !message.trim() || !recipientId || !agentId}
            className="h-11 shrink-0 rounded-xl cursor-pointer bg-emerald-500 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </div>

        {success && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
