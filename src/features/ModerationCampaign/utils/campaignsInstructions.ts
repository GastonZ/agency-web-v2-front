export const MODERATION_PLAYBOOK = `
1) Datos de la campaña (Paso 1)
- name: Nombre corto y claro de la campaña. ES REQUERIDO PARA AVANZAR.
- goal: Objetivo principal de la moderación (p.ej., “responder consultas y derivar ventas”). ES REQUERIDO PARA AVANZAR.
- summary: Descripción breve del alcance (qué cubre y qué no). ES OPCIONAL
- leadDefinition: Reglas concisas para considerar una conversación como lead (criterios explícitos). ES REQUERIDO PARA AVANZAR

Público objetivo (Geo + Estilo):
- audience.geo.countryId / provinceId / cityId: selección mínima requerida: país. Provincia y ciudad son opcionales. ES REQUERIDO MÍNIMO EL PAÍS
- audience.cultural: segmento cultural o afinidad (p.ej., “joven tech”, “familias bilingües”). ES OPCIONAL
- tone: estilo de comunicación del asistente (p.ej., “formal breve”, “amable y resolutivo”). ES OPCIONAL

2) Canales (Paso 2)
- channels: lista no vacía. Valores permitidos: instagram | facebook | whatsapp | email | x (twitter).
- describeModerationChannels: herramienta para explicar por qué se eligió cada canal. ES REQUERIDO AL MENOS 1 CANAL

3) Reglas / Asistente (Paso 3)
Asistente:
- assistant.name: nombre visible del asistente. ES REQUERIDO PARA AVANZAR
- assistant.greeting: mensaje inicial (1–2 líneas, directo). ES OPCIONAL
- assistant.conversationLogic: guía de conversación (intenciones, desambiguación, cortesía, escalamiento). ES OPCIONAL

Base de conocimiento:
- knowHow: pares Q&A (cada par con question y answer claras y verificables). ES REQUERIDA AL MENOS UNA Q&A
- Las ediciones de Q&A son manuales desde UI (el asistente no modifica ni borra Q&A).

Temas permitidos:
- allowedTopics: lista de temas que SÍ se pueden tratar. ES OPCIONAL

Escalamiento humano:
- escalationItems: casos en los que se deriva a humano. ES OPCIONAL
- escalationPhone: teléfono de contacto normalizado (+CC RESTO). ES OPCIONAL

Turnos y citas (opcional; confirmar antes de habilitar):
- calendarsEnabled: booleano para habilitar agenda.
- calendars: definición de agenda, días activos e intervalos (HH:mm). Validar superposiciones.

4) Revisión (Paso 4)
- Verificar mínimos: Paso 1 completo (name/goal/leadDefinition + país), Paso 2 con ≥1 canal, Paso 3 con assistant.name y ≥1 Q&A.
- Al activar: estado = active; guardar último lanzamiento.

Política de Respuestas del Asistente:
- Siempre responder en español.
- No inventar datos: si un campo no está definido, pedirlo o explicar cómo completarlo.
- Al ejecutar una tool: confirmar brevemente el resultado y, si corresponde, desplazar/iluminar el campo.
- Si el usuario pide “apágate”/“detener”: detener sesión de voz (tool deactivateAgent).
- Navegación por pasos: aceptar “Paso 1/2/3/4” (1-based) o por tópico (“canales”, “saludo inicial”, etc.).
`.trim();
