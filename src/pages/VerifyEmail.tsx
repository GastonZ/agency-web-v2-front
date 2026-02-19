import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import OfflineLayout from "../layout/OfflineLayout";
import { verifyEmail } from "../services/client";

type VerificationStatus = "idle" | "loading" | "success" | "error";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [message, setMessage] = useState<string>("");

  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const runVerification = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el token de verificación en el enlace.");
      return;
    }

    setStatus("loading");
    setMessage("Verificando tu correo...");

    try {
      const result = await verifyEmail(token);
      setStatus("success");
      setMessage(result.message || "Tu correo fue verificado correctamente.");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "No se pudo validar tu correo.");
    }
  };

  useEffect(() => {
    void runVerification();
  }, [token]);

  const icon = status === "loading"
    ? <LoaderCircle className="w-10 h-10 text-emerald-500 animate-spin" />
    : status === "success"
      ? <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      : status === "error"
        ? <CircleAlert className="w-10 h-10 text-red-500" />
        : <MailCheck className="w-10 h-10 text-neutral-600 dark:text-neutral-300" />;

  return (
    <OfflineLayout>
      <div className="w-full max-w-md mx-auto p-3 md:p-4">
        <div
          className={[
            "rounded-2xl border overflow-hidden shadow-lg",
            "bg-white/20 dark:bg-neutral-900/30",
            "backdrop-blur-xl supports-[backdrop-filter]:bg-white/10",
            "border-white/30 dark:border-white/10",
            "transition-all",
          ].join(" ")}
        >
          <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
            {icon}
            <h1 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Verificación de correo
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {message || "Preparando validación..."}
            </p>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800" />

          <div className="px-5 py-5 space-y-3">
            {status === "success" && (
              <Link to="/auth" className="block">
                <Button
                  type="button"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/30"
                >
                  Ir a iniciar sesión
                </Button>
              </Link>
            )}

            {status === "error" && (
              <Button
                type="button"
                onClick={() => void runVerification()}
                className="w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg"
              >
                Reintentar validación
              </Button>
            )}
          </div>
        </div>
      </div>
    </OfflineLayout>
  );
};

export default VerifyEmail;
