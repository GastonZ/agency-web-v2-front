import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, Chip } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={[
            "inline-flex items-center gap-3 select-none",
            "text-neutral-700 dark:text-neutral-300"
        ].join(" ")}
    >
        {label}
        <span
            className={[
                "relative h-7 w-12 rounded-full transition-colors",
                checked ? "bg-emerald-500/70 ring-1 ring-emerald-400/60" : "bg-neutral-300/60 dark:bg-neutral-800/70",
                "shadow-inner"
            ].join(" ")}
        >
            <span
                className={[
                    "absolute top-1 left-1 h-5 w-5 rounded-full bg-white dark:bg-neutral-900 transition-all",
                    "shadow-md",
                    checked ? "translate-x-5" : "translate-x-0"
                ].join(" ")}
            />
        </span>
    </button>
);

const AddSlotModal: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (start: string, end: string) => void;
    error?: string | null;
}> = ({ open, onClose, onSubmit, error }) => {
    const [start, setStart] = React.useState("09:00");
    const [end, setEnd] = React.useState("10:00");

    React.useEffect(() => {
        if (!open) return;
        setStart("09:00");
        setEnd("10:00");
    }, [open]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm rounded-2xl p-5 md:p-6 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/30 dark:border-white/10 ring-1 ring-emerald-400/20">
                <h4 className="text-base font-semibold mb-3 text-neutral-800 dark:text-neutral-100">Agregar horario</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Desde</Label>
                        <input
                            type="time"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full h-10 rounded-xl px-3 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        />
                    </div>
                    <div>
                        <Label>Hasta</Label>
                        <input
                            type="time"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full h-10 rounded-xl px-3 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        />
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{error}</p>}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 h-10 rounded-xl bg-white/60 dark:bg-neutral-800/60 border border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onSubmit(start, end)}
                        className="px-4 h-10 rounded-xl text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500/90 hover:to-emerald-600/90 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DAY_ORDER: Array<import("../../../../context/ModerationContext").DayOfWeek> = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS: Record<string, string> = {
    sun: "Domingo", mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado"
};

const BulkSlotsModal: React.FC<{
    open: boolean;
    onClose: () => void;
    calId?: string;
    activeDays?: Array<import("../../../../context/ModerationContext").DayOfWeek>;
}> = ({ open, onClose, calId, activeDays = [] }) => {
    const { addTimeSlotsBulk } = useModeration();
    const [selected, setSelected] = React.useState<Set<string>>(new Set(activeDays));
    const [start, setStart] = React.useState("09:00");
    const [end, setEnd] = React.useState("17:00");
    const [step, setStep] = React.useState(15);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) return;
        setSelected(new Set(activeDays));
        setStart("09:00");
        setEnd("17:00");
        setStep(15);
        setError(null);

    }, [open]);

    if (!open) return null;

    const toggle = (d: string) => {
        const next = new Set(selected);
        next.has(d) ? next.delete(d) : next.add(d);
        setSelected(next);
    };

    const submit = () => {
        if (!calId) return;
        const days = Array.from(selected) as any[];
        if (!days.length) { setError("Seleccioná al menos un día."); return; }
        const res = addTimeSlotsBulk(calId, days, { start, end }, step);
        if (!res.ok) { setError(res.reason); return; }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl p-5 md:p-6 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/30 dark:border-white/10 ring-1 ring-emerald-400/20">
                <h4 className="text-base font-semibold mb-3 text-neutral-800 dark:text-neutral-100">Agregar horarios múltiples</h4>

                <Label>Días (solo activos)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {activeDays.map((d) => (
                        <Chip key={d} active={selected.has(d)} onClick={() => toggle(d)} className="min-w-[94px] justify-center">
                            {DAY_LABELS[d]}
                        </Chip>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="col-span-1">
                        <Label>Desde</Label>
                        <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                            className="w-full h-10 rounded-xl px-3 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                    </div>
                    <div className="col-span-1">
                        <Label>Hasta</Label>
                        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                            className="w-full h-10 rounded-xl px-3 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                    </div>
                    <div className="col-span-1">
                        <Label>Duración (min)</Label>
                        <input
                            type="number" min={5} max={240} step={5} value={step}
                            onChange={(e) => setStep(parseInt(e.target.value) || 15)}
                            className="w-full h-10 rounded-xl px-3 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        />
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{error}</p>}

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 h-10 rounded-xl bg-white/60 dark:bg-neutral-800/60 border border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50">Cancelar</button>
                    <button onClick={submit} className="px-4 h-10 rounded-xl text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500/90 hover:to-emerald-600/90 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]">Agregar</button>
                </div>
            </div>
        </div>
    );
};

const CalendarCard: React.FC = () => {
    const {
        data,
        createCalendar,
        updateCalendarMeta,
        toggleCalendarDay,
        addTimeSlot,
        removeTimeSlot,
        setCalendarsEnabled,
    } = useModeration();

    const enabled = data.calendarsEnabled;

    const [modal, setModal] = React.useState<{ open: boolean; calId?: string; day?: string; error?: string | null }>({
        open: false,
        error: null
    });

    const [bulk, setBulk] = React.useState<{ open: boolean; calId?: string; activeDays?: any[] }>({ open: false });


    const handleAddCalendar = () => {
        const id = createCalendar({ name: "Nombre Calendario", assignee: "" });
        requestAnimationFrame(() => {
            const el = document.getElementById(`cal-name-${id}`);
            el?.focus();
        });
    };

    const openAddSlot = (calId: string, day: string) => setModal({ open: true, calId, day, error: null });
    const closeAddSlot = () => setModal({ open: false, calId: undefined, day: undefined, error: null });

    const submitAddSlot = (start: string, end: string) => {
        if (!modal.calId || !modal.day) return;
        const res = addTimeSlot(modal.calId, modal.day as any, { start, end });
        if (!res.ok) {
            setModal((m) => ({ ...m, error: res.reason }));
            return;
        }
        closeAddSlot();
    };

    return (
        <GlassCard className="relative overflow-hidden">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
            <SectionTitle
                title="Turnos y Citas (opcional)"
                subtitle="Define calendarios por profesional, días activos y horarios disponibles."
            />

            {/* Switch */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-300/80">
                    Activá para configurar calendarios de atención. Si lo desactivás, no se mostrarán en tu asistente.
                </p>
                <ToggleSwitch checked={enabled} onChange={setCalendarsEnabled} label="Usar agendas" />
            </div>

            {!enabled ? (
                <div className="mt-2 rounded-xl px-4 py-3 bg-white/40 dark:bg-neutral-900/40 border border-white/30 dark:border-white/10 text-neutral-600 dark:text-neutral-300/80">
                    Desactivado. Activa el interruptor para configurar calendarios.
                </div>
            ) : (
                <>
                    {/* Actions */}
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Calendarios</h4>
                        <button
                            type="button"
                            onClick={handleAddCalendar}
                            className="px-4 h-10 rounded-xl text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500/90 hover:to-emerald-600/90 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                        >
                            + Nuevo calendario
                        </button>
                    </div>

                    {data.calendars.length === 0 && (
                        <div className="rounded-xl border border-dashed border-emerald-400/40 p-4 text-sm text-neutral-600 dark:text-neutral-300/80">
                            No hay calendarios todavía. Creá el primero con “Nuevo calendario”.
                        </div>
                    )}

                    <div className="space-y-6">
                        {data.calendars.map((cal) => (
                            <div key={cal.id} className="rounded-2xl p-4 bg-white/50 dark:bg-neutral-900/30 border border-white/30 dark:border-white/10 ring-1 ring-inset ring-emerald-400/15">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label>Nombre del calendario</Label>
                                        <TextInput
                                            id={`cal-name-${cal.id}`}
                                            value={cal.name}
                                            onChange={(e) => updateCalendarMeta(cal.id, { name: e.target.value })}
                                            placeholder="Consultorio 1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Persona que atiende</Label>
                                        <TextInput
                                            value={cal.assignee}
                                            onChange={(e) => updateCalendarMeta(cal.id, { assignee: e.target.value })}
                                            placeholder="Dra. Gómez"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Label>Días en los que atiende</Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {DAY_ORDER.map((d) => {
                                            const active = cal.activeDays.includes(d as any);
                                            return (
                                                <Chip
                                                    key={`${cal.id}-${d}`}
                                                    active={active}
                                                    ariaLabel={DAY_LABELS[d]}
                                                    onClick={() => toggleCalendarDay(cal.id, d as any)}
                                                    className="min-w-[94px] justify-center"
                                                >
                                                    {DAY_LABELS[d]}
                                                </Chip>
                                            );
                                        })}
                                    </div>
                                </div>

                                {cal.activeDays.length > 0 && (
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cal.activeDays.map((d) => (
                                            <div key={`${cal.id}-${d}`} className="rounded-xl p-3 bg-white/40 dark:bg-neutral-900/40 border border-white/30 dark:border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{DAY_LABELS[d]}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => openAddSlot(cal.id, d)}
                                                        className="px-3 h-9 rounded-lg text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                                                    >
                                                        + Agregar horario
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setBulk({ open: true, calId: cal.id, activeDays: cal.activeDays })}
                                                        className="px-3 h-9 rounded-lg text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                                                    >
                                                        + Agregar horarios múltiples
                                                    </button>

                                                </div>

                                                {cal.slots[d]?.length ? (
                                                    <ul className="flex flex-wrap gap-2">
                                                        {cal.slots[d].map((r, idx) => (
                                                            <li
                                                                key={`${cal.id}-${d}-${idx}`}
                                                                className="flex items-center justify-between px-3 py-2 rounded-lg 
                                                                    bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 
                                                                    border border-emerald-400/30 
                                                                    w-[120px]"
                                                            >
                                                                <span className="text-sm">{r.start} – {r.end}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTimeSlot(cal.id, d, idx)}
                                                                    className="text-sm hover:opacity-80"
                                                                    aria-label="Eliminar horario"
                                                                >
                                                                    ×
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-300/80">
                                                        Sin horarios para este día.
                                                    </p>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <AddSlotModal
                        open={modal.open}
                        onClose={closeAddSlot}
                        onSubmit={submitAddSlot}
                        error={modal.error || null}
                    />
                    <BulkSlotsModal
                        open={bulk.open}
                        onClose={() => setBulk({ open: false })}
                        calId={bulk.calId}
                        activeDays={bulk.activeDays}
                    />
                </>
            )}
        </GlassCard>
    );
};

export default CalendarCard;
