import React, { useRef, useState } from "react";
import { loginUser } from "../services/client";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/ui/FormError";
import { useTranslation } from 'react-i18next'
import { saveSession } from "../utils/helper";
import GoogleSignInButton from "../components/features/GoogleLogin";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation('translations');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      setErrorMsg(t("emptyFields"));
      return;
    }

    setErrorMsg("");
    setShowRetry(false);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      saveSession({
        token: res.token,
        kind: "user",
        userId: res.userId,
        email: res.email,
      });
      const from = sessionStorage.getItem("post-login-redirect") || "/";
      sessionStorage.removeItem("post-login-redirect");
      navigate(from);
    } catch (err: any) {
      const msg = err?.message;

      console.log(msg);


      if (msg === t("error.invalidCredentials")) {
        setErrorMsg(t(msg));
        setPassword("");
        passwordRef.current?.focus();
      } else if (msg === t("error.serverError")) {
        setErrorMsg(t(msg));
        setShowRetry(true);
      } else if (msg === t("error.connectionError")) {
        setErrorMsg(t(msg));
        setShowRetry(true);
      } else {
        setErrorMsg(t(msg));
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
    <div className="w-full max-w-md mx-auto p-3 md:p-4">
      <div
        className={[
          "rounded-2xl border overflow-hidden shadow-lg",
          "bg-white/20 dark:bg-neutral-900/30",
          "backdrop-blur-xl supports-[backdrop-filter]:bg-white/10",
          "border-white/30 dark:border-white/10",
          "focus-within:ring-2 focus-within:ring-emerald-400/20",
          "transition-all",
        ].join(" ")}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {t("welcome")}
            </h1>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {t("login_title")}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {t("login_subtitle")}
            </p>
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/10" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <Input
            type="email"
            label={t("login_email_label")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login_email_placeholder")}
            disabled={loading}
            autoComplete="email"
            className="focus:ring-emerald-400/60"
          />

          <PasswordInput
            ref={passwordRef}
            label={t("login_password_label")}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login_password_placeholder")}
            disabled={loading}
            autoComplete="current-password"
            className="focus:ring-emerald-400/60"
          />

          <FormError message={errorMsg} />

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/30"
          >
            {t("login_button")}
          </Button>
          {/* <GoogleSignInButton /> */}

          {showRetry && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetry}
              className="w-full border border-emerald-400/40 text-emerald-500 dark:text-emerald-300 hover:bg-emerald-400/10"
              disabled={loading}
            >
              {t("login_retry")}
            </Button>
          )}
        </form>

        <div className="border-t border-white/20 dark:border-white/10" />
        <div className="px-5 py-4">
          <p className="text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("login_terms")}{" "}
            <a className="underline underline-offset-2 hover:text-emerald-500" href="#">
              {t("login_terms_link")}
            </a>{" "}
            &{" "}
            <a className="underline underline-offset-2 hover:text-emerald-500" href="#">
              {t("login_privacy_link")}
            </a>
          </p>
        </div>
      </div>
    </div>


  );
};

export default Login;
