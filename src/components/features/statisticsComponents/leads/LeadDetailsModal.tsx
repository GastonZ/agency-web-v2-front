import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Lead } from "../../../../services/types/moderation-types";


interface LeadDetailsModalProps {
    open: boolean;
    lead: Lead | null;
    onClose: () => void;
}


export function LeadDetailsModal({ open, lead, onClose }: LeadDetailsModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />


                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className="relative z-10 w-[92vw] max-w-2xl rounded-2xl ring-1 ring-emerald-400/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-5 md:p-6 shadow-2xl"
                        initial={{ y: 16, scale: 0.98, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 16, scale: 0.98, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-3.5 top-3.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-300/30 dark:ring-neutral-700/40 hover:bg-neutral-950/5 dark:hover:bg-white/5"
                            aria-label="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>


                        <div className="pr-10">
                            <h3 className="text-lg font-semibold">
                                {lead?.name || "—"}
                            </h3>
                            <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">
                                {lead?.summary || ""}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}