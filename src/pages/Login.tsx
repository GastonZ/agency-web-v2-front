import React, { useRef, useState } from "react";
import { loginUser } from "../services/client";
import { useNavigate } from "react-router-dom";

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


      navigate("/dashboard");
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
    <div className="min-h-screen bg-white flex items-start justify-center">
      <div className="w-full max-w-sm px-4 pt-24 pb-12">
        <h1 className="text-3xl font-semibold text-center tracking-tight">AgencIA</h1>

        <div className="mt-14 text-center">
          <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa tu correo electrónico para entrar en esta app
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correoelectrónico@dominio.com"
            className="w-full h-12 rounded-md border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80"
            disabled={loading}
          />

          <input
            type="password"
            ref={passwordRef}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full h-12 rounded-md border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80"
            disabled={loading}
          />

          {errorMsg && (
            <div role="alert" className="text-red-500 text-sm mt-1">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-md bg-black text-white text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

          {showRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full h-11 rounded-md bg-gray-100 text-gray-900 text-sm font-medium hover:bg-gray-200 transition-colors mt-2"
              disabled={loading}
            >
              Reintentar
            </button>
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
