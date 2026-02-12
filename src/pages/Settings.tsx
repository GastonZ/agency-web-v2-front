import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    BadgeCheck,
    Building2,
    KeyRound,
    Plus,
    Shield,
    Trash2,
    UserPlus,
    X,
    Pencil,
    Copy,
    RefreshCcw,
    Sparkles
} from "lucide-react";
import OnlineLayout from "../layout/OnlineLayout";
import { PunkButton } from "../components/ui/PunkButton";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { PasswordInput } from "../components/ui/PasswordInput";
import ToggleSwitch from "../components/ui/ToggleSwitch";
import { cn, countWords } from "../utils/helper";
import {
    createArea,
    createSubaccount,
    deleteArea,
    deleteSubaccount,
    getMyAreas,
    getMySubaccounts,
    resetSubaccountPassword,
    updateAreaDescription,
    updateSubaccount,
    type SubAccount,
    type UserArea,
} from "../services/subaccounts";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type Tab = "areas" | "subaccounts";

function formatDate(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function genPassword(len = 12) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?-_";
    const arr = new Uint32Array(len);
    try {
        crypto.getRandomValues(arr);
    } catch {
        for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 1e9);
    }
    let out = "";
    for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
    return out;
}

const GlassPanel: React.FC<{
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    right?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, subtitle, icon, right, children }) => (
    <section
        className={cn(
            "rounded-2xl border shadow-sm",
            "bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
            "border-neutral-200 dark:border-neutral-800",
            "p-4 md:p-6"
        )}
    >
        <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-3">
                {icon ? (
                    <div className="mt-0.5 inline-flex h-10 w-20 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        {icon}
                    </div>
                ) : null}
                <div className="min-w-0">
                    <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
        </header>

        <div className="mt-4">{children}</div>
    </section>
);

const Modal: React.FC<{
    open: boolean;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, title, subtitle, onClose, children }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

                <motion.div
                    role="dialog"
                    aria-modal="true"
                    className={cn(
                        "relative z-10 w-[92vw] max-w-xl",
                        "rounded-2xl ring-1 ring-emerald-400/20",
                        "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl",
                        "p-5 md:p-6 shadow-2xl"
                    )}
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
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                            {title}
                        </h3>
                        {subtitle ? (
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>

                    <div className="mt-5">{children}</div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const Select: React.FC<{
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ label: string; value: string }>;
    hint?: string;
    disabled?: boolean;
}> = ({ label, value, onChange, options, hint, disabled }) => {
    const id = React.useMemo(() => `sel-${Math.random().toString(36).slice(2)}`, []);
    return (
        <div className="space-y-1.5">
            {label ? (
                <label htmlFor={id} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {label}
                </label>
            ) : null}
            <select
                id={id}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full h-12 px-4 rounded-md",
                    "bg-white/70 hover:bg-white/90 dark:bg-neutral-900/70 dark:hover:bg-neutral-900/80",
                    "text-black dark:text-white",
                    "ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600",
                    "focus:outline-none transition-colors",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {hint ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p> : null}
        </div>
    );
};

export default function Settings() {
    const { t } = useTranslation("translations");

    const [tab, setTab] = React.useState<Tab>("areas");
    const [loading, setLoading] = React.useState(true);

    const [areas, setAreas] = React.useState<UserArea[]>([]);
    const [subs, setSubs] = React.useState<SubAccount[]>([]);

    const reload = React.useCallback(async () => {
        setLoading(true);
        try {
            const [a, s] = await Promise.all([getMyAreas(), getMySubaccounts()]);
            setAreas(a);
            setSubs(s);
        } catch (e: any) {
            toast.error(e?.message || "No se pudieron cargar tus configuraciones.");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        reload();
    }, [reload]);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmTitle, setConfirmTitle] = React.useState<React.ReactNode>(null);
    const [confirmSubtitle, setConfirmSubtitle] = React.useState<React.ReactNode>(null);
    const [confirmBody, setConfirmBody] = React.useState<React.ReactNode>(null);
    const [confirmOkText, setConfirmOkText] = React.useState<string>("");
    const [confirmCancelText, setConfirmCancelText] = React.useState<string>("");
    const resolverRef = React.useRef<((ok: boolean) => void) | null>(null);

    const confirm = React.useCallback(
        (opts: {
            title: React.ReactNode;
            subtitle?: React.ReactNode;
            body?: React.ReactNode;
            okText?: string;
            cancelText?: string;
        }) => {
            setConfirmTitle(opts.title);
            setConfirmSubtitle(opts.subtitle ?? null);
            setConfirmBody(opts.body ?? null);
            setConfirmOkText(opts.okText ?? t("common.delete", { defaultValue: "Borrar" }));
            setConfirmCancelText(opts.cancelText ?? t("common.cancel", { defaultValue: "Cancelar" }));
            setConfirmOpen(true);

            return new Promise<boolean>((resolve) => {
                resolverRef.current = resolve;
            });
        },
        [t]
    );

    const closeConfirm = React.useCallback((ok: boolean) => {
        setConfirmOpen(false);
        const r = resolverRef.current;
        resolverRef.current = null;
        r?.(ok);
    }, []);

    // -------- Areas modal state
    const [areaModalOpen, setAreaModalOpen] = React.useState(false);
    const [areaEditing, setAreaEditing] = React.useState<UserArea | null>(null);
    const [areaName, setAreaName] = React.useState("");
    const [areaDesc, setAreaDesc] = React.useState("");
    const [areaSaving, setAreaSaving] = React.useState(false);
    const [areaErr, setAreaErr] = React.useState<{ name?: string; description?: string }>({});

    function openCreateArea() {
        setAreaEditing(null);
        setAreaName("");
        setAreaDesc("");
        setAreaErr({});
        setAreaModalOpen(true);
    }

    function openEditArea(a: UserArea) {
        setAreaEditing(a);
        setAreaName(a.name);
        setAreaDesc(a.description || "");
        setAreaErr({});
        setAreaModalOpen(true);
    }

    async function handleSaveArea() {
        const nextErr: typeof areaErr = {};
        const trimmedName = areaName.trim();
        const trimmedDesc = areaDesc.trim();

        if (!areaEditing) {
            if (!trimmedName) nextErr.name = t("settings.areas.name_required", { defaultValue: "El nombre es obligatorio." });
            if (countWords(trimmedName) > 2) nextErr.name = t("settings.areas.name_max_words", { defaultValue: "Máximo 2 palabras." });
        }
        if (!trimmedDesc) nextErr.description = t("settings.areas.desc_required", { defaultValue: "La descripción es obligatoria." });
        setAreaErr(nextErr);
        if (Object.keys(nextErr).length) return;

        setAreaSaving(true);
        try {
            if (areaEditing) {
                await updateAreaDescription(areaEditing.name, trimmedDesc);
                toast.success(t("settings.areas.updated", { defaultValue: "Área actualizada." }));
            } else {
                await createArea({ name: trimmedName, description: trimmedDesc });
                toast.success(t("settings.areas.created", { defaultValue: "Área creada." }));
            }
            setAreaModalOpen(false);
            await reload();
        } catch (e: any) {
            toast.error(e?.message || t("settings.areas.save_error", { defaultValue: "No se pudo guardar el área." }));
        } finally {
            setAreaSaving(false);
        }
    }

    async function handleDeleteArea(a: UserArea) {
        const msg = t("settings.areas.delete_confirm", {
            defaultValue: `¿Borrar el área “${a.name}”?\n\nSolo podés borrarla si no tiene subcuentas asignadas.`,
        });

        const ok = await confirm({
            title: t("settings.areas.delete_title", { defaultValue: "Confirmar borrado" }),
            subtitle: t("settings.areas.delete_subtitle", { defaultValue: "Esta acción no se puede deshacer." }),
            body: (
                <div className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre-line">
                    {msg}
                </div>
            ),
            okText: t("common.delete", { defaultValue: "Borrar" }),
            cancelText: t("common.cancel", { defaultValue: "Cancelar" }),
        });

        if (!ok) return;

        try {
            await deleteArea(a.name);
            toast.success(t("settings.areas.deleted", { defaultValue: "Área borrada." }));
            await reload();
        } catch (e: any) {
            toast.error(e?.message || t("settings.areas.delete_error", { defaultValue: "No se pudo borrar el área." }));
        }
    }

    // -------- Subaccounts modals state
    const [subModalOpen, setSubModalOpen] = React.useState(false);
    const [subEditing, setSubEditing] = React.useState<SubAccount | null>(null);
    const [subUsername, setSubUsername] = React.useState("");
    const [subPassword, setSubPassword] = React.useState("");
    const [subAreaName, setSubAreaName] = React.useState("");
    const [subActive, setSubActive] = React.useState(true);
    const [subSaving, setSubSaving] = React.useState(false);
    const [subErr, setSubErr] = React.useState<{ username?: string; password?: string; areaName?: string }>({});

    function openCreateSub() {
        setSubEditing(null);
        setSubUsername("");
        setSubPassword(genPassword());
        setSubAreaName(areas[0]?.name || "");
        setSubActive(true);
        setSubErr({});
        setSubModalOpen(true);
    }

    function openEditSub(s: SubAccount) {
        setSubEditing(s);
        setSubUsername(s.username);
        setSubPassword(""); // no editable acá
        setSubAreaName(s.areaName);
        setSubActive(!!s.isActive);
        setSubErr({});
        setSubModalOpen(true);
    }

    async function handleSaveSub() {
        const nextErr: typeof subErr = {};
        const u = subUsername.trim();
        const p = subPassword.trim();
        const a = subAreaName.trim();

        if (!u) nextErr.username = t("settings.sub.username_required", { defaultValue: "El usuario es obligatorio." });
        if (!a) nextErr.areaName = t("settings.sub.area_required", { defaultValue: "Elegí un área." });
        if (!subEditing && !p) nextErr.password = t("settings.sub.password_required", { defaultValue: "La contraseña es obligatoria." });

        setSubErr(nextErr);
        if (Object.keys(nextErr).length) return;

        setSubSaving(true);
        try {
            if (subEditing) {
                await updateSubaccount(subEditing._id, { areaName: a, isActive: subActive });
                toast.success(t("settings.sub.updated", { defaultValue: "Subcuenta actualizada." }));
            } else {
                await createSubaccount({ username: u, password: p, areaName: a, isActive: subActive });
                toast.success(t("settings.sub.created", { defaultValue: "Subcuenta creada. Guardá la contraseña para compartirla." }));
                try {
                    await navigator.clipboard.writeText(`${u} / ${p}`);
                    toast.info(t("settings.sub.copied", { defaultValue: "Copiado al portapapeles (usuario / contraseña)." }));
                } catch { }
            }
            setSubModalOpen(false);
            await reload();
        } catch (e: any) {
            toast.error(e?.message || t("settings.sub.save_error", { defaultValue: "No se pudo guardar la subcuenta." }));
        } finally {
            setSubSaving(false);
        }
    }

    async function handleDeleteSub(s: SubAccount) {
        const msg = t("settings.sub.delete_confirm", {
            defaultValue: `¿Borrar la subcuenta “${s.username}”?`,
        });

        const ok = await confirm({
            title: t("settings.sub.delete_title", { defaultValue: "Confirmar borrado" }),
            subtitle: t("settings.sub.delete_subtitle", { defaultValue: "Esta acción no se puede deshacer." }),
            body: (
                <div className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre-line">
                    {msg}
                </div>
            ),
            okText: t("common.delete", { defaultValue: "Borrar" }),
            cancelText: t("common.cancel", { defaultValue: "Cancelar" }),
        });

        if (!ok) return;

        try {
            await deleteSubaccount(s._id);
            toast.success(t("settings.sub.deleted", { defaultValue: "Subcuenta borrada." }));
            await reload();
        } catch (e: any) {
            toast.error(e?.message || t("settings.sub.delete_error", { defaultValue: "No se pudo borrar la subcuenta." }));
        }
    }

    // Reset password modal
    const [resetOpen, setResetOpen] = React.useState(false);
    const [resetSub, setResetSub] = React.useState<SubAccount | null>(null);
    const [resetPass, setResetPass] = React.useState("");
    const [resetSaving, setResetSaving] = React.useState(false);

    function openReset(s: SubAccount) {
        setResetSub(s);
        setResetPass(genPassword());
        setResetOpen(true);
    }

    async function handleReset() {
        if (!resetSub) return;
        const p = resetPass.trim();
        if (!p) {
            toast.warning(t("settings.sub.reset_required", { defaultValue: "Ingresá una contraseña." }));
            return;
        }
        setResetSaving(true);
        try {
            await resetSubaccountPassword(resetSub._id, p);
            toast.success(t("settings.sub.reset_ok", { defaultValue: "Contraseña reseteada." }));
            try {
                await navigator.clipboard.writeText(`${resetSub.username} / ${p}`);
                toast.info(t("settings.sub.copied", { defaultValue: "Copiado al portapapeles (usuario / contraseña)." }));
            } catch { }
            setResetOpen(false);
            await reload();
        } catch (e: any) {
            toast.error(e?.message || t("settings.sub.reset_error", { defaultValue: "No se pudo resetear la contraseña." }));
        } finally {
            setResetSaving(false);
        }
    }

    const hasAreas = areas.length > 0;

    const areaOptions = React.useMemo(
        () => areas.map((a) => ({ label: a.name, value: a.name })),
        [areas]
    );

    const [areaQuery, setAreaQuery] = React.useState("");
    const [subQuery, setSubQuery] = React.useState("");
    const [previewArea, setPreviewArea] = React.useState<string>("");

    React.useEffect(() => {
        if (!previewArea && areas.length) setPreviewArea(areas[0].name);
    }, [areas, previewArea]);

    const subCountByArea = React.useMemo(() => {
        const m = new Map<string, number>();
        for (const s of subs) m.set(s.areaName, (m.get(s.areaName) || 0) + 1);
        return m;
    }, [subs]);

    const filteredAreas = React.useMemo(() => {
        const q = areaQuery.trim().toLowerCase();
        if (!q) return areas;
        return areas.filter((a) =>
            `${a.name} ${a.description}`.toLowerCase().includes(q)
        );
    }, [areas, areaQuery]);

    const filteredSubs = React.useMemo(() => {
        const q = subQuery.trim().toLowerCase();
        if (!q) return subs;
        return subs.filter((s) =>
            `${s.username} ${s.areaName} ${s.area?.description || ""}`
                .toLowerCase()
                .includes(q)
        );
    }, [subs, subQuery]);

    function areaExamples(name: string): string[] {
        const n = (name || "").toLowerCase();
        if (n.includes("venta")) {
            return [
                "“¿Cuánto cuesta? ¿Tenés lista de precios?”",
                "“Quiero cotizar / presupuesto para…”",
                "“¿Hacen envíos? ¿Cuánto demora?”",
            ];
        }
        if (n.includes("soport") || n.includes("help") || n.includes("ayuda")) {
            return [
                "“No me funciona / me da error…”",
                "“Necesito cambiar datos / recuperar acceso”",
                "“Tengo un problema con mi pedido / servicio”",
            ];
        }
        if (n.includes("turn") || n.includes("cita") || n.includes("agend") || n.includes("reser")) {
            return [
                "“Quiero sacar un turno para…”",
                "“¿Qué horarios tienen disponibles?”",
                "“Necesito reprogramar / cancelar una cita”",
            ];
        }
        return [
            "“Hola, necesito info sobre…”",
            "“Quiero saber si ofrecen…”",
            "“Me interesa, ¿cómo seguimos?”",
        ];
    }

    return (
        <OnlineLayout>
            <div className="relative">
                {/* Soft background */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/55 via-neutral-50 to-emerald-50/35 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950" />
                    <div className="absolute -top-28 right-[-12%] h-[420px] w-[520px] rounded-full bg-emerald-400/16 blur-[110px]" />
                    <div className="absolute -bottom-28 left-[-10%] h-[480px] w-[620px] rounded-full bg-emerald-300/14 blur-[120px]" />
                </div>

                <div className="mx-auto w-full max-w-7xl px-6 md:px-10 py-10 space-y-6">
                    {/* HERO */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/15">
                                <Shield className="h-3.5 w-3.5" />
                                {t("settings.subaccounts.badge", { defaultValue: "Accesos & Organización" })}
                            </div>

                            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                                {t("settings.subaccounts.title", { defaultValue: "Áreas y Subcuentas" })}
                            </h1>

                            <p className="mt-2 text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-3xl">
                                {t("settings.subaccounts.subtitle", {
                                    defaultValue:
                                        "Primero definís Áreas (para que la IA entienda el propósito). Luego creás Subcuentas y las asignás a un Área específica.",
                                })}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <PunkButton variant="ghost" onClick={reload} disabled={loading}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                {t("common.refresh", { defaultValue: "Actualizar" })}
                            </PunkButton>

                            <PunkButton onClick={() => { setTab("areas"); openCreateArea(); }}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t("settings.areas.create", { defaultValue: "Crear Área" })}
                            </PunkButton>

                            <PunkButton onClick={() => { setTab("subaccounts"); openCreateSub(); }} disabled={!hasAreas}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                {t("settings.sub.create", { defaultValue: "Crear Subcuenta" })}
                            </PunkButton>
                        </div>
                    </div>

                    {/* Tabs (segmented control) */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex rounded-full bg-white/70 dark:bg-neutral-900/60 ring-1 ring-neutral-200 dark:ring-neutral-800 p-1 backdrop-blur">
                            <button
                                type="button"
                                onClick={() => setTab("areas")}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                                    tab === "areas"
                                        ? "bg-emerald-500/12 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20"
                                        : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                )}
                            >
                                <Building2 className="h-4 w-4" />
                                {t("settings.tabs.areas", { defaultValue: "Áreas" })}
                                <span className="ml-1 rounded-full bg-neutral-900/5 dark:bg-white/10 px-2 py-0.5 text-xs">
                                    {areas.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTab("subaccounts")}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                                    tab === "subaccounts"
                                        ? "bg-emerald-500/12 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20"
                                        : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                )}
                            >
                                <Shield className="h-4 w-4" />
                                {t("settings.tabs.subaccounts", { defaultValue: "Subcuentas" })}
                                <span className="ml-1 rounded-full bg-neutral-900/5 dark:bg-white/10 px-2 py-0.5 text-xs">
                                    {subs.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 xl:grid-cols-12">
                            <div className="xl:col-span-8 h-80 rounded-2xl bg-neutral-900/5 dark:bg-white/5 animate-pulse" />
                            <div className="xl:col-span-4 h-80 rounded-2xl bg-neutral-900/5 dark:bg-white/5 animate-pulse" />
                        </div>
                    ) : (
                        <div className="grid gap-5 xl:grid-cols-12">
                            {/* MAIN */}
                            <div className="xl:col-span-8 space-y-5">
                                {/* AREAS */}
                                {tab === "areas" ? (
                                    <GlassPanel
                                        title={t("settings.areas.panel_title", { defaultValue: "Áreas" })}
                                        subtitle={t("settings.areas.panel_subtitle", {
                                            defaultValue:
                                                "Usá nombres cortos (máx. 2 palabras). La descripción guía a la IA para clasificar y asignar leads.",
                                        })}
                                        icon={<Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                                        right={
                                            <div className="flex items-center gap-2">
                                                <div className="hidden md:block">
                                                    <input
                                                        value={areaQuery}
                                                        onChange={(e) => setAreaQuery(e.target.value)}
                                                        placeholder={t("common.search", { defaultValue: "Buscar…" })}
                                                        className={cn(
                                                            "h-10 w-[260px] rounded-full px-4 text-sm",
                                                            "bg-white/70 dark:bg-neutral-900/60",
                                                            "ring-1 ring-neutral-200 dark:ring-neutral-800",
                                                            "focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        }
                                    >
                                        {areas.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-neutral-300/70 dark:border-neutral-700/60 p-7 text-center">
                                                <p className="text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                                                    {t("settings.areas.empty_title", { defaultValue: "Todavía no tenés áreas creadas." })}
                                                </p>
                                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                                                    {t("settings.areas.empty_desc", {
                                                        defaultValue:
                                                            "Creá al menos una para poder asignar subcuentas. Ej: “ventas”, “soporte”, “turnos”.",
                                                    })}
                                                </p>
                                                <div className="mt-5 flex justify-center">
                                                    <PunkButton onClick={openCreateArea}>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        {t("settings.areas.create", { defaultValue: "Crear Área" })}
                                                    </PunkButton>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200/70 dark:ring-neutral-800/70">
                                                {/* mobile search */}
                                                <div className="md:hidden p-3 bg-white/70 dark:bg-neutral-900/60">
                                                    <input
                                                        value={areaQuery}
                                                        onChange={(e) => setAreaQuery(e.target.value)}
                                                        placeholder={t("common.search", { defaultValue: "Buscar…" })}
                                                        className={cn(
                                                            "h-10 w-full rounded-full px-4 text-sm",
                                                            "bg-white/70 dark:bg-neutral-900/60",
                                                            "ring-1 ring-neutral-200 dark:ring-neutral-800",
                                                            "focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                                        )}
                                                    />
                                                </div>

                                                <table className="w-full text-sm">
                                                    <thead className="bg-neutral-50/80 dark:bg-neutral-950/40">
                                                        <tr className="text-left text-neutral-600 dark:text-neutral-300">
                                                            <th className="px-4 py-3 font-medium">Área</th>
                                                            <th className="px-4 py-3 font-medium hidden lg:table-cell">Descripción</th>
                                                            <th className="px-4 py-3 font-medium w-[110px] text-center">Subcuentas</th>
                                                            <th className="px-4 py-3 font-medium w-[130px] text-right">Acciones</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
                                                        {filteredAreas.map((a) => {
                                                            const cnt = subCountByArea.get(a.name) || 0;
                                                            return (
                                                                <tr key={a._id} className="hover:bg-neutral-900/5 dark:hover:bg-white/5 transition">
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{a.name}</span>
                                                                        </div>

                                                                        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 lg:hidden">
                                                                            {a.description}
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 hidden lg:table-cell">
                                                                        <div className="text-neutral-700 dark:text-neutral-200">
                                                                            {a.description}
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 text-center">
                                                                        <span
                                                                            className={cn(
                                                                                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                                                                                cnt
                                                                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20"
                                                                                    : "bg-neutral-900/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-200 ring-neutral-300/30 dark:ring-neutral-700/40"
                                                                            )}
                                                                        >
                                                                            {cnt}
                                                                        </span>
                                                                    </td>

                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openEditArea(a)}
                                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                                                                aria-label="Editar"
                                                                                title="Editar"
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteArea(a)}
                                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                                                                aria-label="Borrar"
                                                                                title="Borrar"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>

                                                {filteredAreas.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-neutral-600 dark:text-neutral-300 bg-white/70 dark:bg-neutral-900/60">
                                                        {t("common.no_results", { defaultValue: "No hay resultados." })}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </GlassPanel>
                                ) : (
                                    /* SUBACCOUNTS */
                                    <GlassPanel
                                        title={t("settings.sub.panel_title", { defaultValue: "Subcuentas" })}
                                        subtitle={t("settings.sub.panel_subtitle", {
                                            defaultValue:
                                                "Asigná cada subcuenta a un Área. Guardá credenciales y usá reset si necesitás rotar la contraseña.",
                                        })}
                                        icon={<Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                                        right={
                                            <div className="flex items-center gap-2">
                                                <div className="hidden md:block">
                                                    <input
                                                        value={subQuery}
                                                        onChange={(e) => setSubQuery(e.target.value)}
                                                        placeholder={t("common.search", { defaultValue: "Buscar…" })}
                                                        className={cn(
                                                            "h-10 w-[260px] rounded-full px-4 text-sm",
                                                            "bg-white/70 dark:bg-neutral-900/60",
                                                            "ring-1 ring-neutral-200 dark:ring-neutral-800",
                                                            "focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                                        )}
                                                    />
                                                </div>

                                            </div>
                                        }
                                    >
                                        {!hasAreas ? (
                                            <div className="rounded-2xl border border-dashed border-amber-400/40 bg-amber-500/5 p-7">
                                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                                    {t("settings.sub.locked_title", { defaultValue: "Primero necesitás crear al menos 1 Área." })}
                                                </p>
                                                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                                                    {t("settings.sub.locked_desc", {
                                                        defaultValue:
                                                            "Las subcuentas requieren un área existente (si elegís un área que no existe, el backend rechaza la creación).",
                                                    })}
                                                </p>
                                                <div className="mt-5 flex flex-wrap gap-2">
                                                    <PunkButton onClick={() => setTab("areas")}>
                                                        <Building2 className="h-4 w-4 mr-2" />
                                                        {t("settings.sub.go_areas", { defaultValue: "Ir a Áreas" })}
                                                    </PunkButton>
                                                    <PunkButton variant="ghost" onClick={() => { setTab("areas"); openCreateArea(); }}>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        {t("settings.areas.create", { defaultValue: "Crear Área" })}
                                                    </PunkButton>
                                                </div>
                                            </div>
                                        ) : subs.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-neutral-300/70 dark:border-neutral-700/60 p-7 text-center">
                                                <p className="text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                                                    {t("settings.sub.empty_title", { defaultValue: "Aún no creaste subcuentas." })}
                                                </p>
                                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                                                    {t("settings.sub.empty_desc", {
                                                        defaultValue:
                                                            "Creá una subcuenta, asignale un área y compartí las credenciales con tu equipo.",
                                                    })}
                                                </p>
                                                <div className="mt-5 flex justify-center">
                                                    <PunkButton onClick={openCreateSub}>
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                        {t("settings.sub.create", { defaultValue: "Crear Subcuenta" })}
                                                    </PunkButton>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200/70 dark:ring-neutral-800/70">
                                                {/* mobile search */}
                                                <div className="md:hidden p-3 bg-white/70 dark:bg-neutral-900/60">
                                                    <input
                                                        value={subQuery}
                                                        onChange={(e) => setSubQuery(e.target.value)}
                                                        placeholder={t("common.search", { defaultValue: "Buscar…" })}
                                                        className={cn(
                                                            "h-10 w-full rounded-full px-4 text-sm",
                                                            "bg-white/70 dark:bg-neutral-900/60",
                                                            "ring-1 ring-neutral-200 dark:ring-neutral-800",
                                                            "focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                                        )}
                                                    />
                                                </div>

                                                <table className="w-full text-sm">
                                                    <thead className="bg-neutral-50/80 dark:bg-neutral-950/40">
                                                        <tr className="text-left text-neutral-600 dark:text-neutral-300">
                                                            <th className="px-4 py-3 font-medium">Usuario</th>
                                                            <th className="px-4 py-3 font-medium">Área</th>
                                                            <th className="px-4 py-3 font-medium w-[160px]">Estado</th>
                                                            <th className="px-4 py-3 font-medium hidden lg:table-cell w-[210px]">Último login</th>
                                                            <th className="px-4 py-3 font-medium hidden lg:table-cell w-[210px]">Creada</th>
                                                            <th className="px-4 py-3 font-medium w-[170px] text-right">Acciones</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70 bg-white/70 dark:bg-neutral-900/60">
                                                        {filteredSubs.map((s) => (
                                                            <tr key={s._id} className="hover:bg-neutral-900/5 dark:hover:bg-white/5 transition">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                                                                        {s.username}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 lg:hidden mt-1">
                                                                        {t("settings.sub.last_login", { defaultValue: "Último login:" })} {formatDate(s.lastLoginAt)}
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-neutral-900 dark:text-neutral-50 text-center">{s.areaName}</div>
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <ToggleSwitch
                                                                            checked={!!s.isActive}
                                                                            onChange={async (checked: boolean) => {
                                                                                const prev = s.isActive;
                                                                                setSubs((old) =>
                                                                                    old.map((x) => (x._id === s._id ? { ...x, isActive: checked } : x))
                                                                                );
                                                                                try {
                                                                                    await updateSubaccount(s._id, { isActive: checked });
                                                                                } catch (e: any) {
                                                                                    setSubs((old) =>
                                                                                        old.map((x) => (x._id === s._id ? { ...x, isActive: prev } : x))
                                                                                    );
                                                                                    toast.error(e?.message || "No se pudo actualizar el estado.");
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 hidden lg:table-cell text-neutral-700 dark:text-neutral-200">
                                                                    {formatDate(s.lastLoginAt)}
                                                                </td>

                                                                <td className="px-4 py-3 hidden lg:table-cell text-neutral-700 dark:text-neutral-200">
                                                                    {formatDate(s.createdAt)}
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openEditSub(s)}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                                                            aria-label="Editar"
                                                                            title="Editar"
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openReset(s)}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                                                            aria-label="Reset password"
                                                                            title="Reset password"
                                                                        >
                                                                            <KeyRound className="h-4 w-4" />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteSub(s)}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-900/5 dark:hover:bg-white/5"
                                                                            aria-label="Borrar"
                                                                            title="Borrar"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {filteredSubs.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-neutral-600 dark:text-neutral-300 bg-white/70 dark:bg-neutral-900/60">
                                                        {t("common.no_results", { defaultValue: "No hay resultados." })}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </GlassPanel>
                                )}
                            </div>

                            {/* SIDEBAR */}
                            <div className="xl:col-span-4 space-y-5">
                                <GlassPanel
                                    title={t("settings.sidebar.status_title", { defaultValue: "Estado actual" })}
                                    subtitle={t("settings.sidebar.status_sub", { defaultValue: "Resumen rápido de tu configuración." })}
                                    icon={<BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                                >
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between rounded-xl bg-neutral-900/5 dark:bg-white/5 px-4 py-3 ring-1 ring-neutral-200/60 dark:ring-neutral-800/70">
                                            <span className="text-neutral-600 dark:text-neutral-300">Áreas</span>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{areas.length}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl bg-neutral-900/5 dark:bg-white/5 px-4 py-3 ring-1 ring-neutral-200/60 dark:ring-neutral-800/70">
                                            <span className="text-neutral-600 dark:text-neutral-300">Subcuentas</span>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{subs.length}</span>
                                        </div>

                                    </div>
                                </GlassPanel>
                            </div>
                        </div>
                    )}

                    <Modal
                        open={confirmOpen}
                        onClose={() => closeConfirm(false)}
                        title={confirmTitle || t("common.confirm", { defaultValue: "Confirmar" })}
                        subtitle={confirmSubtitle || undefined}
                    >
                        <div className="space-y-5">
                            {confirmBody ? (
                                <div className="rounded-xl bg-neutral-900/5 dark:bg-white/5 p-4 ring-1 ring-neutral-200/60 dark:ring-neutral-800/70">
                                    {confirmBody}
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-2">
                                <PunkButton variant="ghost" onClick={() => closeConfirm(false)}>
                                    {confirmCancelText}
                                </PunkButton>

                                <PunkButton
                                    onClick={() => closeConfirm(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white ring-1 ring-red-500/30"
                                >
                                    {confirmOkText}
                                </PunkButton>
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        open={areaModalOpen}
                        onClose={() => setAreaModalOpen(false)}
                        title={
                            areaEditing
                                ? t("settings.areas.edit_title", { defaultValue: "Editar Área" })
                                : t("settings.areas.create_title", { defaultValue: "Crear Área" })
                        }
                        subtitle={
                            areaEditing
                                ? t("settings.areas.edit_subtitle", { defaultValue: "Solo podés editar la descripción." })
                                : t("settings.areas.create_subtitle", {
                                    defaultValue: "Nombre corto (máx. 2 palabras) + descripción clara para ayudar a la IA.",
                                })
                        }
                    >
                        <div className="space-y-4">
                            <Input
                                label={t("settings.areas.name_label", { defaultValue: "Nombre del área" })}
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                disabled={!!areaEditing}
                                placeholder={t("settings.areas.name_ph", { defaultValue: "ventas" })}
                                error={areaErr.name}
                                hint={t("settings.areas.name_hint", { defaultValue: "Máximo 2 palabras. Ej: “ventas”, “soporte”, “turnos”." })}
                            />

                            <Textarea
                                label={t("settings.areas.desc_label", { defaultValue: "Descripción" })}
                                value={areaDesc}
                                onChange={(e) => setAreaDesc(e.target.value)}
                                placeholder={t("settings.areas.desc_ph", {
                                    defaultValue: "Leads que piden precio/cotización o intención de compra",
                                })}
                                error={areaErr.description}
                                hint={t("settings.areas.desc_hint", {
                                    defaultValue: "Esta descripción ayuda a la IA a asignar leads de manera más eficaz.",
                                })}
                            />

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <PunkButton variant="ghost" onClick={() => setAreaModalOpen(false)} disabled={areaSaving}>
                                    {t("common.cancel", { defaultValue: "Cancelar" })}
                                </PunkButton>
                                <PunkButton onClick={handleSaveArea} disabled={areaSaving}>
                                    {areaSaving
                                        ? t("common.saving", { defaultValue: "Guardando..." })
                                        : areaEditing
                                            ? t("common.save", { defaultValue: "Guardar" })
                                            : t("common.create", { defaultValue: "Crear" })}
                                </PunkButton>
                            </div>
                        </div>
                    </Modal>

                    {/* Subaccount create/edit modal */}
                    <Modal
                        open={subModalOpen}
                        onClose={() => setSubModalOpen(false)}
                        title={
                            subEditing
                                ? t("settings.sub.edit_title", { defaultValue: "Editar Subcuenta" })
                                : t("settings.sub.create_title", { defaultValue: "Crear Subcuenta" })
                        }
                        subtitle={
                            subEditing
                                ? t("settings.sub.edit_subtitle", { defaultValue: "Podés cambiar el área y activar/desactivar." })
                                : t("settings.sub.create_subtitle", {
                                    defaultValue: "Elegí un área existente. Guardá y compartí las credenciales con tu equipo.",
                                })
                        }
                    >
                        <div className="space-y-4">
                            <Input
                                label={t("settings.sub.username_label", { defaultValue: "Username" })}
                                value={subUsername}
                                onChange={(e) => setSubUsername(e.target.value)}
                                placeholder={t("settings.sub.username_ph", { defaultValue: "ventas_1" })}
                                error={subErr.username}
                                disabled={!!subEditing}
                                hint={
                                    subEditing
                                        ? t("settings.sub.username_hint_locked", { defaultValue: "El username no se puede editar." })
                                        : t("settings.sub.username_hint", {
                                            defaultValue: "Usá un nombre único, idealmente relacionado al área (ej: ventas_1).",
                                        })
                                }
                            />

                            {!subEditing ? (
                                <div className="space-y-2">
                                    <PasswordInput
                                        label={t("settings.sub.password_label", { defaultValue: "Contraseña" })}
                                        value={subPassword}
                                        onChange={(e: any) => setSubPassword(e.target.value)}
                                        error={subErr.password}
                                    />

                                    <div className="flex flex-wrap items-center gap-2">
                                        <PunkButton variant="ghost" onClick={() => setSubPassword(genPassword())} type="button">
                                            <RefreshCcw className="h-4 w-4 mr-2" />
                                            {t("settings.sub.generate", { defaultValue: "Generar" })}
                                        </PunkButton>

                                        <PunkButton
                                            variant="ghost"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(`${subUsername.trim()} / ${subPassword.trim()}`);
                                                    toast.info(t("settings.sub.copied", { defaultValue: "Copiado al portapapeles (usuario / contraseña)." }));
                                                } catch {
                                                    toast.warning(t("settings.sub.copy_fail", { defaultValue: "No se pudo copiar. Copiá manualmente." }));
                                                }
                                            }}
                                            type="button"
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            {t("common.copy", { defaultValue: "Copiar" })}
                                        </PunkButton>

                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {t("settings.sub.password_hint", { defaultValue: "Guardala: no se vuelve a mostrar desde el backend." })}
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <Select
                                label={t("settings.sub.area_label", { defaultValue: "Área" })}
                                value={subAreaName}
                                onChange={setSubAreaName}
                                options={areaOptions.length ? areaOptions : [{ label: t("settings.sub.no_areas", { defaultValue: "Sin áreas" }), value: "" }]}
                                disabled={!areaOptions.length}
                                hint={t("settings.sub.area_hint", { defaultValue: "Solo podés seleccionar áreas existentes." })}
                            />
                            {subErr.areaName ? <p className="text-xs text-red-600">{subErr.areaName}</p> : null}

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    <ToggleSwitch checked={subActive} onChange={setSubActive} />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-200">
                                        {t("settings.sub.active_label", { defaultValue: "Subcuenta activa" })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <PunkButton variant="ghost" onClick={() => setSubModalOpen(false)} disabled={subSaving}>
                                    {t("common.cancel", { defaultValue: "Cancelar" })}
                                </PunkButton>
                                <PunkButton onClick={handleSaveSub} disabled={subSaving || (!hasAreas && !subEditing)}>
                                    {subSaving
                                        ? t("common.saving", { defaultValue: "Guardando..." })
                                        : subEditing
                                            ? t("common.save", { defaultValue: "Guardar" })
                                            : t("common.create", { defaultValue: "Crear" })}
                                </PunkButton>
                            </div>
                        </div>
                    </Modal>

                    {/* Reset password modal */}
                    <Modal
                        open={resetOpen}
                        onClose={() => setResetOpen(false)}
                        title={t("settings.sub.reset_title", { defaultValue: "Resetear contraseña" })}
                        subtitle={t("settings.sub.reset_subtitle", {
                            defaultValue: "Generá o escribí una nueva contraseña y compartila con el usuario de la subcuenta.",
                        })}
                    >
                        <div className="space-y-4">
                            <Input label={t("settings.sub.reset_user", { defaultValue: "Subcuenta" })} value={resetSub?.username || ""} disabled />

                            <PasswordInput
                                label={t("settings.sub.reset_newpass", { defaultValue: "Nueva contraseña" })}
                                value={resetPass}
                                onChange={(e: any) => setResetPass(e.target.value)}
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                <PunkButton variant="ghost" onClick={() => setResetPass(genPassword())} type="button">
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    {t("settings.sub.generate", { defaultValue: "Generar" })}
                                </PunkButton>

                                <PunkButton
                                    variant="ghost"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(`${resetSub?.username || ""} / ${resetPass.trim()}`);
                                            toast.info(t("settings.sub.copied", { defaultValue: "Copiado al portapapeles (usuario / contraseña)." }));
                                        } catch {
                                            toast.warning(t("settings.sub.copy_fail", { defaultValue: "No se pudo copiar. Copiá manualmente." }));
                                        }
                                    }}
                                    type="button"
                                    disabled={!resetSub}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t("common.copy", { defaultValue: "Copiar" })}
                                </PunkButton>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <PunkButton variant="ghost" onClick={() => setResetOpen(false)} disabled={resetSaving}>
                                    {t("common.cancel", { defaultValue: "Cancelar" })}
                                </PunkButton>
                                <PunkButton onClick={handleReset} disabled={resetSaving || !resetSub}>
                                    {resetSaving ? t("common.saving", { defaultValue: "Guardando..." }) : t("settings.sub.reset_cta", { defaultValue: "Resetear" })}
                                </PunkButton>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </OnlineLayout>
    );
}
