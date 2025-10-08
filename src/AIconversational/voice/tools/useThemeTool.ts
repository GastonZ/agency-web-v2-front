import { setTheme as applyTheme } from "../../../utils/helper";

type Mode = "light" | "dark" | "system";

export function useThemeTool() {
    function changeTheme({ mode }: { mode: Mode }) {
        try {
            applyTheme(mode);
            localStorage.setItem("theme", mode);
            return {
                success: true,
                mode,
                message:
                    mode === "dark"
                        ? "Listo, activé el modo oscuro."
                        : mode === "light"
                            ? "Listo, volví al modo claro."
                            : "Listo, el tema sigue al sistema.",
            };
        } catch (err: any) {
            return {
                success: false,
                error: err?.message ?? String(err),
                message: "No pude cambiar el tema.",
            };
        }
    }

    return { changeTheme };
}