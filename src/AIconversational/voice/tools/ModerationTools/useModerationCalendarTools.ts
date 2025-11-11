import { useModeration , type DayOfWeek } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

type Lang = "es" | "en";
const normalizeLang = (raw?: string): Lang =>
    raw && raw.toLowerCase().startsWith("en") ? "en" : "es";

type DayKey = DayOfWeek

const DAY_MAP: Record<string, DayKey> = {
    domingo: "sun", lunes: "mon", martes: "tue", miercoles: "wed", miércoles: "wed",
    jueves: "thu", viernes: "fri", sabado: "sat", sábado: "sat",
    sun: "sun", mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat",
};

function norm(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenSim(a: string, b: string) {
    const A = new Set(norm(a).split(" ").filter(Boolean));
    const B = new Set(norm(b).split(" ").filter(Boolean));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    const union = A.size + B.size - inter;
    return inter / union;
}

function findCalendarByIdOrName(
    calendars: Array<{ id: string; name: string }>,
    args: { id?: string; nameHint?: string },
    minScore = 0.45
) {
    if (args.id) {
        const c = calendars.find((x) => x.id === args.id);
        return c ?? null;
    }
    const hint = args.nameHint?.trim();
    if (!hint) return null;
    let best: any = null;
    let bestScore = 0;
    calendars.forEach((c) => {
        const s = tokenSim(c.name || "", hint);
        if (s > bestScore) { best = c; bestScore = s; }
    });
    return bestScore >= minScore ? best : null;
}

function parseDays(input: string | string[]) {
    const arr = Array.isArray(input) ? input : [input];
    const out: DayKey[] = [];
    for (const raw of arr) {
        const d = DAY_MAP[norm(raw)];
        if (d) out.push(d);
    }
    return out;
}

/* ---------- hook tools ---------- */

export function useModerationCalendarTools() {
    const {
        data,
        setCalendarsEnabled,
        createCalendar,
        updateCalendarMeta,
        toggleCalendarDay,
        addTimeSlot,
        addTimeSlotsBulk,
        removeTimeSlot,
        removeCalendar,
    } = useModeration();

function explainAndEnableCalendars(args?: { enable?: boolean; language?: string }) {
    const lang = normalizeLang(args?.language);

    const explanation =
        lang === "en"
            ? "\"Appointments & bookings\" lets you define calendars per professional, enable working days and load available time slots. This prepares your assistant to know when it can offer appointments."
            : "“Turnos y Citas” te permite definir calendarios por profesional (nombre/atendiente), activar días de atención y cargar horarios disponibles. Esto prepara a tu asistente para conocer qué días y en qué rangos puede ofrecer turnos.";

    if (args?.enable === true) {
        setCalendarsEnabled(true);
        return {
            success: true,
            enabled: true,
            message:
                explanation +
                (lang === "en" ? " Calendars enabled." : " Agendas activadas."),
        };
    }
    if (args?.enable === false) {
        setCalendarsEnabled(false);
        return {
            success: true,
            enabled: false,
            message:
                explanation +
                (lang === "en" ? " Calendars disabled." : " Agendas desactivadas."),
        };
    }
    return { success: true, message: explanation };
}
    function createModerationCalendar(args: { name?: string; assignee?: string }) {
        const name = args?.name?.trim() || "Nombre Calendario";
        const assignee = args?.assignee?.trim() || "";
        const id = createCalendar({ name, assignee });
        return { success: true, id, name, assignee, message: "Calendario creado." };
    }

    function updateModerationCalendarMeta(args: {
        id?: string;
        nameHint?: string;
        newName?: string;
        newAssignee?: string;
    }) {
        const list = data.calendars || [];
        const cal =
            findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint }) ||
            list[0];

        if (!cal) return { success: false, message: "No encontré calendarios para actualizar." };

        const patch: any = {};
        if (typeof args.newName === "string" && args.newName.trim()) patch.name = args.newName.trim();
        if (typeof args.newAssignee === "string" && args.newAssignee.trim()) patch.assignee = args.newAssignee.trim();
        if (!Object.keys(patch).length) {
            return { success: false, message: "No hay cambios para aplicar (newName/newAssignee)." };
        }

        updateCalendarMeta(cal.id, patch);
        return { success: true, id: cal.id, applied: patch, message: "Calendario actualizado." };
    }

    function removeModerationCalendar(args: { id?: string; nameHint?: string }) {
        const list = data.calendars || [];
        const cal = findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint });
        if (!cal) return { success: false, message: "No identifiqué el calendario a eliminar." };
        removeCalendar(cal.id);
        return { success: true, id: cal.id, message: "Calendario eliminado." };
    }

    function toggleModerationCalendarDay(args: { id?: string; nameHint?: string; day: string }) {
        const list = data.calendars || [];
        const cal = findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint }) || list[0];
        if (!cal) return { success: false, message: "No encontré el calendario para togglear día." };

        const dayKey = DAY_MAP[norm(args.day)];
        if (!dayKey) return { success: false, message: "Día inválido. Usa domingo..sábado o sun..sat." };

        toggleCalendarDay(cal.id, dayKey);
        return { success: true, id: cal.id, day: dayKey, message: "Día actualizado." };
    }

    function addModerationTimeSlot(args: { id?: string; nameHint?: string; day: string; start: string; end: string }) {
        const list = data.calendars || [];
        const cal = findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint }) || list[0];
        if (!cal) return { success: false, message: "No encontré el calendario para agregar horario." };

        const dayKey = DAY_MAP[norm(args.day)];
        if (!dayKey) return { success: false, message: "Día inválido. Usa domingo..sábado o sun..sat." };

        const res = addTimeSlot(cal.id, dayKey, { start: args.start, end: args.end });
        if (!res.ok) return { success: false, message: res.reason || "No se pudo agregar el horario." };
        return { success: true, id: cal.id, day: dayKey, start: args.start, end: args.end, message: "Horario agregado." };
    }

    function addModerationTimeSlotsBulk(args: {
        id?: string;
        nameHint?: string;
        days: string[] | string;
        start: string;
        end: string;
        step: number;
    }) {
        const list = data.calendars || [];
        const cal = findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint }) || list[0];
        if (!cal) return { success: false, message: "No encontré el calendario para agregar horarios múltiples." };

        const days = parseDays(args.days);
        if (!days.length) return { success: false, message: "Sin días válidos. Usa domingo..sábado o sun..sat." };

        const res = addTimeSlotsBulk(cal.id, days, { start: args.start, end: args.end }, args.step || 15);
        if (!res.ok) return { success: false, message: res.reason || "No se pudieron agregar los horarios." };
        return { success: true, id: cal.id, days, start: args.start, end: args.end, step: args.step, message: "Horarios múltiples agregados." };
    }

    function removeModerationTimeSlot(args: { id?: string; nameHint?: string; day: string; index: number }) {
        const list = data.calendars || [];
        const cal = findCalendarByIdOrName(list, { id: args.id, nameHint: args.nameHint }) || list[0];
        if (!cal) return { success: false, message: "No encontré el calendario." };

        const dayKey = DAY_MAP[norm(args.day)];
        if (!dayKey) return { success: false, message: "Día inválido." };

        removeTimeSlot(cal.id, dayKey, args.index);
        return { success: true, id: cal.id, day: dayKey, index: args.index, message: "Horario eliminado." };
    }

    return {
        explainAndEnableCalendars,
        createModerationCalendar,
        updateModerationCalendarMeta,
        removeModerationCalendar,
        toggleModerationCalendarDay,
        addModerationTimeSlot,
        addModerationTimeSlotsBulk,
        removeModerationTimeSlot,
    };
}