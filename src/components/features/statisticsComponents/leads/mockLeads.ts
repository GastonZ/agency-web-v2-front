import type { Lead } from "../../../../services/types/moderation-types";
export const mockLeads: Lead[] = [
    {
        id: "L-001",
        name: "María Pérez",
        summary:
            "Consulta por precios del plan premium. Tiene urgencia por campaña de fin de año y pidió info de integración con WhatsApp.",
        score: 9,
        channel: "whatsapp",
        channelLink: "https://wa.me/5493865000000?text=Hola%20Mar%C3%ADa",
    },
    {
        id: "L-002",
        name: "Juan Gómez",
        summary:
            "Quiere demo del producto. Interesado en métricas y reportes. Podría decidir en 2 semanas.",
        score: 7,
        channel: "instagram",
        channelLink: "https://instagram.com/direct/t/1234567890",
    },
    {
        id: "L-003",
        name: "Lucía Rodríguez",
        summary:
            "Pidió cotización básica. Aún sin presupuesto confirmado. Volver a contactar el lunes.",
        score: 5,
        channel: "facebook",
    },
    {
        id: "L-004",
        name: "Carlos Díaz",
        summary:
            "Cliente caliente. Quiere arrancar esta semana y solicitó contrato estándar.",
        score: 10,
        channel: "whatsapp",
        channelLink: "https://wa.me/5493865111111?text=Hola%20Carlos",
    },
    {
        id: "L-005",
        name: "Valentina López",
        summary:
            "Solo pidió información general. Interés bajo por ahora.",
        score: 3,
        channel: "unknown",
    },
];