import * as React from "react";


type Props = {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
};


/**
* ToggleSwitch — estilo "glassy emerald" coherente con el resto del diseño
*/
const ToggleSwitch: React.FC<Props> = ({ checked, onChange, label, disabled, className }) => {
    return (
        <label className={["group inline-flex items-center gap-3 select-none", disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer", className || ""].join(" ")}
            aria-disabled={disabled}
        >
            <span
                role="switch"
                aria-checked={checked}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !disabled && onChange(!checked); } }}
                onClick={() => !disabled && onChange(!checked)}
                className={[
                    "relative w-12 h-7 rounded-full border transition-all duration-200",
                    checked ? "bg-emerald-500/20 border-emerald-400/60 shadow-[inset_0_0_8px_rgba(16,185,129,0.45)]" : "bg-white/60 dark:bg-neutral-900/60 border-neutral-300/60 dark:border-neutral-700/60",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute top-1 left-1 h-5 w-5 rounded-full transition-all duration-200 shadow-md",
                        checked ? "translate-x-5 bg-emerald-400/90" : "bg-neutral-300 dark:bg-neutral-600",
                    ].join(" ")}
                />
                {/* aura decorativa */}
                <span className={[
                    "absolute -inset-2 -z-[1] rounded-full blur-xl transition-opacity",
                    checked ? "opacity-60 bg-emerald-400/30" : "opacity-0",
                ].join(" ")} />
            </span>
            {label && <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>}
        </label>
    );
};


export default ToggleSwitch;