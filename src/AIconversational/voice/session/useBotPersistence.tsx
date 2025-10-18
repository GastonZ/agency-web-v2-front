import * as React from "react";
import type { BotSnapshot } from "./persistence";
import { saveBotSnapshot } from "./persistence";

function useDebounced(fn: () => void, delay: number, deps: any[]) {
  React.useEffect(() => {
    const id = setTimeout(fn, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useBotPersistence(params: {
  namespace: string;
  userId: string;
  conversation: Array<{ role: "user" | "assistant"; text: string; timestamp?: string }>;
  business: Record<string, any>;
  localNote?: string;
  maxHistory?: number; // por defecto 12
}) {
  const { namespace, userId, conversation, business, localNote, maxHistory = 12 } = params;

  const snapshot: BotSnapshot = React.useMemo(() => {
    const hist = (conversation || [])
      .slice(-maxHistory)
      .map(m => ({
        role: m.role,
        text: m.text || "",
        ts: m.timestamp ? Date.parse(m.timestamp) : Date.now(),
      }));

    return {
      history: hist,
      business,
      meta: { namespace, userId },
      localNote,
      savedAt: Date.now(),
    };
  }, [namespace, userId, conversation, business, localNote, maxHistory]);

  useDebounced(() => {
    saveBotSnapshot(namespace, userId, snapshot);
  }, 250, [namespace, userId, snapshot]);

  React.useEffect(() => {
    const onBye = () => saveBotSnapshot(namespace, userId, snapshot);
    window.addEventListener("beforeunload", onBye);
    return () => window.removeEventListener("beforeunload", onBye);
  }, [namespace, userId, snapshot]);
}
