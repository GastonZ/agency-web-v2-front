import React, { useState } from "react";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { useTranslation } from 'react-i18next';
import { signUp } from "../services/client";
import { toast } from "react-toastify";

interface SignUpProps {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

const SignUp: React.FC<SignUpProps> = ({ setIsLogin }) => {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { t } = useTranslation('translations');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !lastName || !password || !email) {
            setError(t("signup_error_required"));
            toast.error(t("signup_error_required"));
            return;
        }
        setError("");
        try {
            await signUp({
                name,
                lastName,
                username: username || undefined,
                email,
                password,
            });
            toast.success(t("signup_success") || "Sign up successful!");
            setIsLogin(true);

        } catch (err: any) {
            const errorMsg = err.message || t("signup_error_generic");
            setError(errorMsg);
            toast.error(errorMsg);
        }
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
                        type="text"
                        label={t("signup_name_label") || "Name"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder={t("signup_name_placeholder") || "John"}
                        autoComplete="given-name"
                    />
                    <Input
                        type="text"
                        label={t("signup_lastname_label") || "Last Name"}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder={t("signup_lastname_placeholder") || "Doe"}
                        autoComplete="family-name"
                    />
                    <Input
                        type="text"
                        label={t("signup_username_label") || "Username"}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={false}
                        placeholder={t("signup_username_placeholder") || "Optional"}
                        autoComplete="username"
                    />
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
