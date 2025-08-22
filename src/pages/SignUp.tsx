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
            setError(t(errorMsg));
            toast.error(t(errorMsg));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-3 md:p-4">
            <div
                className={[
                    "rounded-2xl border shadow-sm overflow-hidden",
                    "bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
                    "border-neutral-200 dark:border-neutral-800",
                    "focus-within:ring-2 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-600",
                    "transition-shadow",
                ].join(" ")}
            >
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {t("new_here")}
                        </h1>
                    </div>

                    <div className="mt-6 text-center">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                            {t("signup_button")}
                        </h2>
                        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-300">
                            {t("signup_subtitle")}
                        </p>
                    </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800" />

                <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
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

                    <Button type="submit" className="w-full">
                        {t("signup_button")}
                    </Button>
                </form>

                <div className="border-t border-neutral-200 dark:border-neutral-800" />
                <div className="px-5 py-4">
                    <p className="text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-300">
                        {t("login_terms")}{" "}
                        <a className="underline underline-offset-2 hover:opacity-80" href="#">
                            {t("login_terms_link")}
                        </a>{" "}
                        &{" "}
                        <a className="underline underline-offset-2 hover:opacity-80" href="#">
                            {t("login_privacy_link")}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
