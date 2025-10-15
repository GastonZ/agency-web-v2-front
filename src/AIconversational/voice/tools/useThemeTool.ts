import { setTheme as applyTheme } from "../../../utils/helper";

export function useThemeTool() {
  return {
    changeTheme: ({ mode }: { mode: "light" | "dark" | "system" }) => {
      applyTheme(mode); localStorage.setItem("theme", mode);
      return { success: true, mode };
    }
  };
}

export const uiTools = [
  {
    type: "function",
    name: "changeTheme",
    description: "Cambia el tema (light | dark | system).",
    parameters: { type: "object", properties: { mode: { type: "string", enum: ["light","dark","system"] } }, required: ["mode"] }
  },
  {
    type: "function",
    name: "launchWebsite",
    description: "Abre una URL en una nueva pestaña.",
    parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
  },
] as const;