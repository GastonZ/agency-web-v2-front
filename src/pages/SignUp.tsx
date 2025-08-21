import React, { useState } from "react";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/ui/FormError";
import { useTranslation } from 'react-i18next';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { t } = useTranslation('translations');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError(t("signup_error_required"));
            return;
        }
        setError("");
    };

    return (
        <div>
            <div className="w-full max-w-sm px-4">

                <h1 className="text-3xl font-semibold text-center tracking-tight">AgencIA</h1>

                <div className="mt-14 text-center">
                    <h2 className="text-2xl font-semibold">{t("signup_button")}</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {t("signup_subtitle")}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                    <Input
                        type="email"
                        label={t("login_email_label")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t("signup_email_placeholder")}
                        autoComplete="email"
                    />

                    <PasswordInput
                        label={t("login_password_label")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="********"
                        autoComplete="new-password"
                    />

                    <FormError message={error} />

                    <Button type="submit">{t("signup_button")}</Button>
                </form>
                <p className="mt-8 text-center text-xs text-gray-400">
                    {t("login_terms")}{" "}
                    <a href="#" className="underline">
                        {t("login_terms_link")}
                    </a>{" "}
                    &{" "}
                    <a href="#" className="underline">
                        {t("login_privacy_link")}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
