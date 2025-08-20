import React, { useRef, useState } from "react";
import { loginUser } from "../services/client";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/ui/FormError";
import { useTranslation } from 'react-i18next'

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

    if (!email || !password) {
      setErrorMsg(t("emptyFields"));
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
    <div>
      <div className="w-full max-w-sm px-4">
        <h1 className="text-3xl font-semibold text-center tracking-tight">AgencIA</h1>

        <div className="mt-14 text-center">
          <h2 className="text-2xl font-semibold">{t("login_title")}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {t("login_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input
            type="email"
            label={t("login_email_label")}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login_email_placeholder")}
            disabled={loading}
            autoComplete="email"
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
          />

          <FormError message={errorMsg} />

          <Button type="submit" loading={loading}>
            {t("login_button")}
          </Button>

          {showRetry && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetry}
              className="mt-2"
              disabled={loading}
            >
              {t("login_retry")}
            </Button>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          {t("login_terms")}{" "}
          <a href="#" className="underline">
            {t("login_terms_link")}
          </a>{" "}
          {t("termsAnd")}{" "}
          <a href="#" className="underline">
            {t("login_privacy_link")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
