import React, { useRef, useState } from "react";
import { loginUser } from "../services/client";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/ui/FormError";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMsg("Por favor ingresa email y contraseña.");
      return;
    }

    setErrorMsg("");
    setShowRetry(false);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      localStorage.setItem("aiaToken", res.token);
      navigate("/");
    } catch (err: any) {
      const msg = err?.message;

      if (msg === "Credenciales incorrectas") {
        setErrorMsg(msg);
        setPassword("");
        passwordRef.current?.focus();
      } else if (msg === "Error del servidor. Intente más tarde.") {
        setErrorMsg(msg);
        setShowRetry(true);
      } else if (msg === "No se pudo conectar con el servidor. Intenta de nuevo.") {
        setErrorMsg(msg);
        setShowRetry(true);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setShowRetry(false);
    if (!password) passwordRef.current?.focus();
  };

  return (
    <div>
      <div className="w-full max-w-sm px-4">
        <h1 className="text-3xl font-semibold text-center tracking-tight">AgencIA</h1>

        <div className="mt-14 text-center">
          <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa tu correo electrónico para entrar en esta app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input
            type="email"
            label="Correo electrónico"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correoelectrónico@dominio.com"
            disabled={loading}
            autoComplete="email"
          />

          <PasswordInput
            ref={passwordRef}
            label="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            disabled={loading}
            autoComplete="current-password"
          />

          <FormError message={errorMsg} />

          <Button type="submit" loading={loading}>
            Iniciar sesión
          </Button>

          {showRetry && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetry}
              className="mt-2"
              disabled={loading}
            >
              Reintentar
            </Button>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Al hacer clic en Continuar aceptas nuestros{" "}
          <a href="#" className="underline">
            Términos de servicio
          </a>{" "}
          y la{" "}
          <a href="#" className="underline">
            Política de privacidad
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
